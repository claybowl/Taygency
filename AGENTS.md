# AGENTS.md - Vibe Planning Development Guidelines

This file provides guidelines for AI coding agents working in this repository.

## Project Overview

Vibe Planning is a task management system with an AI agent that processes email/SMS, manages tasks via GitHub storage, and maintains a knowledge graph. The monorepo uses Turbo with Next.js (web app) and a shared package.

## Build, Test, and Development Commands

### Root Commands (run from repository root)

```bash
npm run build          # Build all workspaces
npm run dev            # Start development servers
npm run lint           # Lint all workspaces
npm run type-check     # Type-check all workspaces
npm run format         # Format all files with Prettier
npm run clean          # Clean build artifacts and node_modules
```

### Web App Commands (apps/web)

```bash
cd apps/web
npm run dev            # Start Next.js dev server (port 3000)
npm run build          # Build Next.js app
npm run start          # Production start
npm run lint           # Run Next.js linter
npm run type-check     # Type-check TypeScript
```

### Shared Package Commands (packages/shared)

```bash
cd packages/shared
npm run build          # Build TypeScript types
npm run type-check     # Type-check only
```

## Code Style Guidelines

### TypeScript Conventions

- Use **TypeScript interfaces** for all data structures (extends `Record<string, unknown>` when needed)
- Use `import type` for type-only imports to avoid circular dependencies
- Explicit return types on public functions and methods
- No `any` types - use `unknown` and type guards instead
- No `@ts-ignore`, `@ts-expect-error`, or `as any`

### Naming Conventions

- **Interfaces**: PascalCase (`Task`, `AgentResponse`)
- **Types**: PascalCase (`TaskFilter`, `SkillResult`)
- **Variables/functions**: camelCase (`taskList`, `getTaskById`)
- **Constants**: SCREAMING_SNAKE_CASE (`DEFAULT_TIMEZONE`, `WORKSPACE_DIRS`)
- **Files**: kebab-case for general files, PascalCase for components
- **CSS properties**: camelCase in JS objects

### Import Order

1. External npm packages (`react`, `@anthropic-ai/sdk`)
2. Shared package imports (`@vibe-planning/shared`)
3. Absolute path imports (`@/lib/...`, `@/app/...`)
4. Relative imports (`./`, `../`)

### React/Next.js Patterns

- Use `"use client"` directive for client components
- `use client` hooks at top level, followed by handlers
- Event handlers named `handle*` (`handleSubmit`, `onClick={handleClick}`)
- Refs named with `Ref` suffix (`simulationRef`, `dragOffsetRef`)
- State setters follow pattern: `setStateName` (auto-derived from state variable)

### Error Handling

- Never use empty catch blocks: `catch (err) { console.warn(...) }` or `catch { }` with comment
- Propagate errors with context: `console.error("[Component] Action failed:", err)`
- API routes return `{ error: "..." }` with appropriate HTTP status codes

### Component Structure

- One component per file for significant components
- Keep `page.tsx` focused on routing/layout
- Extract sub-components (`StatCard`, `Bar`, `ActivityItem`) to same file or separate file
- Use CSS-in-JS objects for styling (no CSS modules or Tailwind unless existing pattern)

### File Organization

```
apps/web/
├── app/
│   ├── api/           # Next.js API routes
│   ├── dashboard/     # Main dashboard page
│   └── layout.tsx
├── lib/
│   ├── agent*.ts      # Agent core logic
│   ├── skills/        # Code-based skills
│   │   ├── calendar-sync.ts      # Calendar integration
│   │   ├── smart-scheduling.ts   # Energy-aware scheduling
│   │   └── time-horizon-planner.ts # Deadline cluster detection
│   ├── integrations/  # External service clients
│   └── *.ts           # Utility modules
└── package.json
packages/shared/
├── src/
│   └── types.ts       # Shared TypeScript interfaces
└── package.json
```

## Skills System

### Markdown Skills (Legacy)

Stored in workspace as `.md` files with frontmatter:

```yaml
---
name: categorize
version: "1.0"
trigger: "new tasks imported or user requests categorization"
---
# Skill: Categorize Tasks
## Purpose
Organize tasks into meaningful categories...
```

### Code-Based Skills (Preferred)

Located in `lib/skills/` as TypeScript classes implementing `Skill` interface:

- Implement `Skill` interface with `name`, `version`, `trigger`, `description`, `content`, `tools`
- Register in `lib/skills.ts` `codeBasedSkills` map
- Tools use JSON Schema for input validation
- See `lib/skills/calendar-sync.ts`, `lib/skills/smart-scheduling.ts`, and `lib/skills/time-horizon-planner.ts` for examples

### Adding a New Skill

1. Create `lib/skills/[skill-name].ts` implementing `Skill` interface
2. Add tool definitions with JSON Schema input validation
3. Register in `lib/skills.ts` `codeBasedSkills` map
4. Export instance from `lib/skills/index.ts` (create if needed)
5. Run `npm run type-check` to verify

## API Routes

Next.js API routes in `app/api/` return `NextResponse.json()`:

- Successful: `{ success: true, data: {...} }` or direct data
- Errors: `{ error: "message" }` with appropriate status code

## Knowledge Graph

The Memory page uses D3 force simulation (`d3-force`):

- `lib/integrations/google-calendar.ts` - Calendar integration
- Use `d3.forceSimulation` with `forceLink`, `forceManyBody`, `forceCenter`, `forceCollide`
- Register in `lib/skills.ts` and add to skills system
- Nodes: `{ id, label, type }`; Edges: `{ id, source, target, fact }`

## Common Patterns

### React State Updates

```typescript
// Functional updates for state depending on previous value
setPositions((prev) => {
  const newPositions = new Map(prev);
  newPositions.set(id, { x, y });
  return newPositions;
});
```

### Refs for D3/Animation

```typescript
const simulationRef = useRef<d3.Simulation | null>(null);
// Use ref.current to access mutable simulation instance
```

### Optional Properties

Use `field?: Type` not `field: Type | null` unless null is meaningful

## Development Workflow

1. Make changes in appropriate workspace (`apps/web` or `packages/shared`)
2. Run `npm run type-check` from root to verify types
3. Run `npm run format` to auto-format
4. Test in browser: `npm run dev` then open http://localhost:3000

## Environment Variables

Required for full functionality:

- `GITHUB_TOKEN` - GitHub API access
- `OPENROUTER_API_KEY` - LLM access
- `GOOGLE_CLIENT_ID/SECRET` - Calendar integration (optional)
- `NEO4J_*` - Knowledge graph (optional, memory API works without)

Copy `.env.example` to `.env.local` and fill in values.
