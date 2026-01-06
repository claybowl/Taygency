"use client";

import { useEffect, useState, useRef, CSSProperties } from "react";
import type { Task, TasksResponse, AgentResponse } from "@vibe-planning/shared";

type PageId =
  | "overview"
  | "tasks"
  | "skills"
  | "files"
  | "logs"
  | "context"
  | "simulator";
type TaskFilter = "active" | "completed" | "someday";

export default function DashboardPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<PageId>("overview");
  const [taskFilter, setTaskFilter] = useState<TaskFilter>("active");
  const [barsAnimated, setBarsAnimated] = useState(false);
  const [simulatorResponse, setSimulatorResponse] =
    useState<AgentResponse | null>(null);
  const [simulatorError, setSimulatorError] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string>("config.json");
  const [hoveredNavItem, setHoveredNavItem] = useState<string | null>(null);

  // Form state for simulator
  const [simChannel, setSimChannel] = useState<"email" | "sms">("email");
  const [simFrom, setSimFrom] = useState("");
  const [simSubject, setSimSubject] = useState("");
  const [simBody, setSimBody] = useState("");

  // Mock data for when API fails (no GitHub token, etc.)
  const mockTasks: Task[] = [
    {
      id: "task-demo-1",
      title: "Review Q4 Planning Strategy",
      status: "active",
      priority: "high",
      category: "Strategic Planning",
      energy: "high",
      duration: "45 mins",
      due: "Today, 5:00 PM",
      source: "email",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "task-demo-2",
      title: "Schedule team sync for next week",
      status: "active",
      priority: "medium",
      category: "Work",
      energy: "medium",
      duration: "15 mins",
      source: "sms",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "task-demo-3",
      title: "Buy birthday gift for mom",
      status: "active",
      priority: "low",
      category: "Personal",
      energy: "low",
      duration: "30 mins",
      due: "Saturday",
      source: "email",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  useEffect(() => {
    async function fetchTasks() {
      try {
        const res = await fetch("/api/dashboard/tasks");
        if (!res.ok) throw new Error("Failed to fetch tasks");
        const data: TasksResponse = await res.json();
        setTasks(data.tasks);
        setError(null);
      } catch (err) {
        console.warn("[Dashboard] API unavailable, using mock data:", err);
        // Use mock data when API fails (e.g., no GitHub token)
        setTasks(mockTasks);
        setError(null); // Don't show error, just use mock data
      } finally {
        setLoading(false);
      }
    }
    fetchTasks();
  }, []);

  // Bar chart animation on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setBarsAnimated(true);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const showPage = (pageId: PageId) => {
    setCurrentPage(pageId);
  };

  const simulateSend = async () => {
    if (!simBody.trim()) {
      setSimulatorError("Please enter a message");
      return;
    }

    setIsSimulating(true);
    setSimulatorResponse(null);
    setSimulatorError(null);

    try {
      const response = await fetch("/api/simulator/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          channel: simChannel,
          message: simBody,
          context: {
            from: simChannel === "email" ? simFrom : undefined,
            subject: simChannel === "email" ? simSubject : undefined,
            phoneNumber: simChannel === "sms" ? simFrom : undefined,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to process message");
      }

      setSimulatorResponse(data.response);
    } catch (error) {
      setSimulatorError(
        error instanceof Error ? error.message : "An error occurred",
      );
    } finally {
      setIsSimulating(false);
    }
  };

  const filteredTasks = tasks.filter((task) => task.status === taskFilter);

  const getPriorityClass = (priority: string): "high" | "medium" | "low" => {
    if (priority === "high") return "high";
    if (priority === "medium") return "medium";
    return "low";
  };

  const fileContents: Record<string, string> = {
    "config.json": `{
  "agent_id": "vibe-planning-01",
  "version": "2.4.0-stable",
  "capabilities": [
    "nlp_classification",
    "calendar_orchestration",
    "energy_modeling"
  ],
  "latency_threshold": 250,
  "default_channel": "email"
}`,
    "preferences.md": `# User Preferences

## Schedule
- Morning meetings preferred (9-11 AM)
- Deep work blocks: 2-5 PM
- No meetings on Fridays

## Communication
- Email for async, Slack for urgent
- Daily digest at 8 AM`,
    "patterns.md": `# Detected Patterns

## Meeting Preferences
- 95% confidence: Prefers morning meetings
- 87% confidence: Avoids Monday mornings

## Task Completion
- Average completion time: 2.3 days
- Most productive: Tuesday/Wednesday`,
  };

  // Stats computation
  const activeTasks = tasks.filter((t) => t.status === "active").length;
  const completedToday = tasks.filter((t) => t.status === "completed").length;
  const totalSkills = 24;

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner} />
        <p style={styles.loadingText}>Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.errorContainer}>
        <p style={styles.errorText}>Error: {error}</p>
      </div>
    );
  }

  return (
    <div style={styles.body}>
      {/* Structural Grid Lines */}
      <div style={{ ...styles.gridLine, ...styles.gridV, left: "260px" }} />
      <div style={{ ...styles.gridLine, ...styles.gridV, left: "60%" }} />
      <div style={{ ...styles.gridLine, ...styles.gridH, top: "100px" }} />

      {/* Sidebar Navigation */}
      <aside style={styles.aside}>
        <div style={styles.logo}>
          <div style={styles.logoMark} />
          <span>Vibe Planning</span>
        </div>
        <nav style={styles.nav}>
          <ul style={styles.navList}>
            {(
              [
                "overview",
                "tasks",
                "skills",
                "files",
                "logs",
                "context",
              ] as PageId[]
            ).map((page) => (
              <li key={page} style={styles.navItem}>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    showPage(page);
                  }}
                  onMouseEnter={() => setHoveredNavItem(page)}
                  onMouseLeave={() => setHoveredNavItem(null)}
                  style={{
                    ...styles.navLink,
                    ...(currentPage === page ? styles.navLinkActive : {}),
                    ...(hoveredNavItem === page && currentPage !== page
                      ? styles.navLinkHover
                      : {}),
                  }}
                >
                  {page.charAt(0).toUpperCase() + page.slice(1)}
                </a>
              </li>
            ))}
            <li style={styles.navDivider} />
            <li style={styles.navItem}>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  showPage("simulator");
                }}
                onMouseEnter={() => setHoveredNavItem("simulator")}
                onMouseLeave={() => setHoveredNavItem(null)}
                style={{
                  ...styles.navLink,
                  ...styles.simulatorLink,
                  ...(currentPage === "simulator" ? styles.navLinkActive : {}),
                  ...(hoveredNavItem === "simulator" &&
                  currentPage !== "simulator"
                    ? styles.navLinkHover
                    : {}),
                }}
              >
                Simulator
              </a>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main style={styles.main}>
        {/* Overview Page */}
        {currentPage === "overview" && (
          <section style={styles.pageTransition}>
            <div style={styles.pageHeader}>
              <h1 style={styles.pageTitle}>System Overview</h1>
              <p style={styles.pageSubtitle}>
                Real-time monitoring and agent health diagnostics.
              </p>
            </div>

            <div style={styles.statsGrid}>
              <StatCard
                label="Active Tasks"
                value={activeTasks.toString()}
                hatch
              />
              <StatCard
                label="Completed Today"
                value={completedToday.toString()}
              />
              <StatCard
                label="Total Skills"
                value={totalSkills.toString()}
                subValue="/ 8 meta"
                hatch
              />
              <StatCard label="Last Activity" value="2m 14s ago" small />
            </div>

            <div style={styles.dashboardContent}>
              {/* Activity Feed */}
              <div style={styles.sectionBox}>
                <div style={styles.sectionHeader}>
                  <span style={styles.sectionTitle}>Recent Activity Feed</span>
                  <span style={styles.activityTime}>Live Sync Active</span>
                </div>
                <ul style={styles.activityFeed}>
                  <ActivityItem
                    icon="E"
                    iconType="email"
                    channel="incoming_email"
                    time="14:02:11"
                    preview='"Can we reschedule the sync to 4 PM? Check my availability..."'
                  />
                  <ActivityItem
                    icon="S"
                    iconType="sms"
                    channel="outgoing_sms"
                    time="13:58:45"
                    preview='"Your grocery list has been updated. Reminder: Milk."'
                  />
                  <ActivityItem
                    icon="⚙"
                    iconType="system"
                    channel="skill_executed"
                    time="13:45:02"
                    preview="Pattern recognized: Preference for morning meetings (95% confidence)."
                    isLast
                  />
                </ul>
              </div>

              {/* Task Distribution Chart */}
              <div style={{ ...styles.sectionBox, ...styles.hatchBg }}>
                <div style={styles.sectionHeader}>
                  <span style={styles.sectionTitle}>Task Distribution</span>
                </div>
                <div style={styles.chartPlaceholder}>
                  <Bar height={barsAnimated ? 80 : 0} label="Work" />
                  <Bar height={barsAnimated ? 40 : 0} label="Life" />
                  <Bar height={barsAnimated ? 60 : 0} label="Agent" />
                  <Bar height={barsAnimated ? 25 : 0} label="Other" />
                </div>
                <div style={styles.priorityRatioContainer}>
                  <div style={styles.statLabel}>Priority Ratio</div>
                  <div style={styles.priorityBar}>
                    <div
                      style={{
                        ...styles.prioritySegment,
                        width: "20%",
                        background: COLORS.danger,
                      }}
                    />
                    <div
                      style={{
                        ...styles.prioritySegment,
                        width: "50%",
                        background: COLORS.warning,
                      }}
                    />
                    <div
                      style={{
                        ...styles.prioritySegment,
                        width: "30%",
                        background: COLORS.success,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Tasks Page */}
        {currentPage === "tasks" && (
          <section style={styles.pageTransition}>
            <div style={styles.pageHeader}>
              <h1 style={styles.pageTitle}>Task Management</h1>
              <p style={styles.pageSubtitle}>
                Structural overview of all planned agent operations.
              </p>
            </div>

            <div style={styles.filterButtons}>
              {(["active", "completed", "someday"] as TaskFilter[]).map(
                (filter) => (
                  <button
                    key={filter}
                    onClick={() => setTaskFilter(filter)}
                    style={{
                      ...styles.btn,
                      ...(taskFilter === filter
                        ? styles.btnActive
                        : styles.btnOutline),
                    }}
                  >
                    {filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </button>
                ),
              )}
            </div>

            {filteredTasks.length === 0 ? (
              <div style={styles.emptyState}>
                <p>No {taskFilter} tasks found.</p>
              </div>
            ) : (
              filteredTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  getPriorityClass={getPriorityClass}
                />
              ))
            )}
          </section>
        )}

        {/* Skills Page */}
        {currentPage === "skills" && (
          <section style={styles.pageTransition}>
            <div style={styles.pageHeader}>
              <h1 style={styles.pageTitle}>Skills Library</h1>
              <p style={styles.pageSubtitle}>
                Available agent capabilities and automation patterns.
              </p>
            </div>
            <div style={styles.placeholderBox}>
              <div style={styles.placeholderIcon}>⚡</div>
              <p style={styles.placeholderText}>
                Skills management interface coming soon.
              </p>
              <p style={styles.placeholderSubtext}>
                24 skills loaded • 8 meta-skills active
              </p>
            </div>
          </section>
        )}

        {/* Files Page */}
        {currentPage === "files" && (
          <section style={styles.pageTransition}>
            <div style={styles.pageHeader}>
              <h1 style={styles.pageTitle}>File Browser</h1>
              <p style={styles.pageSubtitle}>
                Inspect the underlying data structure of the planning agent.
              </p>
            </div>

            <div style={styles.fileBrowser}>
              <div style={styles.fileTree}>
                <TreeItem icon="📁" label="tasks" indent={0} />
                <TreeItem icon="📁" label="skills" indent={0} />
                <TreeItem icon="📁" label="context" indent={0} />
                <TreeItem
                  icon="📄"
                  label="preferences.md"
                  indent={1}
                  onClick={() => setSelectedFile("preferences.md")}
                  active={selectedFile === "preferences.md"}
                />
                <TreeItem
                  icon="📄"
                  label="patterns.md"
                  indent={1}
                  onClick={() => setSelectedFile("patterns.md")}
                  active={selectedFile === "patterns.md"}
                />
                <TreeItem icon="📁" label="meta" indent={0} />
                <TreeItem
                  icon="📄"
                  label="config.json"
                  indent={1}
                  onClick={() => setSelectedFile("config.json")}
                  active={selectedFile === "config.json"}
                  highlight
                />
                <TreeItem icon="📁" label="inbox" indent={0} />
              </div>
              <div style={styles.fileContent}>
                <pre style={styles.fileContentPre}>
                  {fileContents[selectedFile] || "// Select a file to view"}
                </pre>
              </div>
            </div>
          </section>
        )}

        {/* Logs Page */}
        {currentPage === "logs" && (
          <section style={styles.pageTransition}>
            <div style={styles.pageHeader}>
              <h1 style={styles.pageTitle}>System Logs</h1>
              <p style={styles.pageSubtitle}>
                Real-time event stream and debugging information.
              </p>
            </div>
            <div style={styles.placeholderBox}>
              <div style={styles.placeholderIcon}>📋</div>
              <p style={styles.placeholderText}>
                Log viewer interface coming soon.
              </p>
              <p style={styles.placeholderSubtext}>
                Streaming logs • Filter by severity • Export
              </p>
            </div>
          </section>
        )}

        {/* Context Page */}
        {currentPage === "context" && (
          <section style={styles.pageTransition}>
            <div style={styles.pageHeader}>
              <h1 style={styles.pageTitle}>Context Memory</h1>
              <p style={styles.pageSubtitle}>
                Learned patterns and user preferences.
              </p>
            </div>
            <div style={styles.placeholderBox}>
              <div style={styles.placeholderIcon}>🧠</div>
              <p style={styles.placeholderText}>
                Context explorer interface coming soon.
              </p>
              <p style={styles.placeholderSubtext}>
                Preferences • Patterns • History
              </p>
            </div>
          </section>
        )}

        {/* Simulator Page */}
        {currentPage === "simulator" && (
          <section style={styles.pageTransition}>
            <div style={styles.pageHeader}>
              <h1 style={styles.pageTitle}>Agent Simulator</h1>
              <p style={styles.pageSubtitle}>
                Send mock triggers to test system response logic.
              </p>
            </div>

            <div style={styles.simulatorLayout}>
              <div style={styles.composer}>
                <div style={styles.inputGroup}>
                  <label style={styles.inputLabel}>Channel</label>
                  <select
                    value={simChannel}
                    onChange={(e) =>
                      setSimChannel(e.target.value as "email" | "sms")
                    }
                    style={styles.select}
                  >
                    <option value="email">Email</option>
                    <option value="sms">SMS</option>
                  </select>
                </div>

                {simChannel === "email" && (
                  <>
                    <div style={styles.inputGroup}>
                      <label style={styles.inputLabel}>From</label>
                      <input
                        type="text"
                        placeholder="sender@domain.com"
                        value={simFrom}
                        onChange={(e) => setSimFrom(e.target.value)}
                        style={styles.input}
                      />
                    </div>
                    <div style={styles.inputGroup}>
                      <label style={styles.inputLabel}>Subject</label>
                      <input
                        type="text"
                        placeholder="Subject line..."
                        value={simSubject}
                        onChange={(e) => setSimSubject(e.target.value)}
                        style={styles.input}
                      />
                    </div>
                  </>
                )}

                <div style={styles.inputGroup}>
                  <label style={styles.inputLabel}>Message Body</label>
                  <textarea
                    rows={8}
                    placeholder="Type mock message here..."
                    value={simBody}
                    onChange={(e) => setSimBody(e.target.value)}
                    style={styles.textarea}
                  />
                </div>

                <button onClick={simulateSend} style={styles.btnPrimary}>
                  Dispatch Trigger
                </button>

                <div style={styles.presetsSection}>
                  <label style={styles.statLabel}>Quick Presets</label>
                  <div style={styles.presetsGrid}>
                    <button
                      style={styles.presetBtn}
                      onClick={() => {
                        setSimSubject("Can we reschedule?");
                        setSimBody(
                          "Hey, can we move our 3pm meeting to 4pm? I have a conflict.",
                        );
                      }}
                    >
                      Reschedule Meeting
                    </button>
                    <button
                      style={styles.presetBtn}
                      onClick={() => {
                        setSimSubject("New task");
                        setSimBody(
                          "Please add 'Review Q4 strategy' to my task list with high priority.",
                        );
                      }}
                    >
                      New Task Request
                    </button>
                    <button
                      style={styles.presetBtn}
                      onClick={() => {
                        setSimSubject("Schedule conflict");
                        setSimBody(
                          "I need to attend both the team standup and client call at 10am. Can you help resolve this?",
                        );
                      }}
                    >
                      Complex Conflict
                    </button>
                  </div>
                </div>
              </div>

              <div style={styles.responseView}>
                {isSimulating ? (
                  <div style={styles.processingText}>[PROCESSING...]</div>
                ) : simulatorError ? (
                  <div style={styles.errorText}>
                    <span style={{ color: COLORS.danger }}>ERROR:</span>{" "}
                    {simulatorError}
                  </div>
                ) : simulatorResponse ? (
                  <SimulatorResponseContent response={simulatorResponse} />
                ) : (
                  <div style={styles.waitingText}>// Waiting for input...</div>
                )}
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

// Color constants
const COLORS = {
  primary: "#1a1a1a",
  accent: "#6366f1",
  success: "#22c55e",
  warning: "#f59e0b",
  danger: "#dc2626",
  bg: "#f9fafb",
  surface: "#ffffff",
  border: "#e5e7eb",
  text: "#111827",
  muted: "#6b7280",
  hatchColor: "rgba(0, 0, 0, 0.03)",
  vellumBg: "rgba(255, 255, 255, 0.85)",
};

// Sub-components
function StatCard({
  label,
  value,
  subValue,
  hatch,
  small,
}: {
  label: string;
  value: string;
  subValue?: string;
  hatch?: boolean;
  small?: boolean;
}) {
  return (
    <div style={{ ...styles.statCard, ...(hatch ? styles.hatchBg : {}) }}>
      <div style={styles.statCardCornerTL} />
      <div style={styles.statCardCornerBR} />
      <span style={styles.statLabel}>{label}</span>
      <div
        style={{ ...styles.statValue, ...(small ? { fontSize: "1rem" } : {}) }}
      >
        {value}
        {subValue && <small style={styles.statSubValue}>{subValue}</small>}
      </div>
    </div>
  );
}

function Bar({ height, label }: { height: number; label: string }) {
  return (
    <div
      style={{
        ...styles.bar,
        height: `${height}%`,
      }}
      data-label={label}
    >
      <span style={styles.barLabel}>{label}</span>
    </div>
  );
}

function ActivityItem({
  icon,
  iconType,
  channel,
  time,
  preview,
  isLast,
}: {
  icon: string;
  iconType: "email" | "sms" | "system";
  channel: string;
  time: string;
  preview: string;
  isLast?: boolean;
}) {
  const iconStyles: Record<string, CSSProperties> = {
    email: { background: "#dbeafe", color: "#3b82f6" },
    sms: { background: "#dcfce7", color: "#22c55e" },
    system: { background: "#e5e7eb", color: "#4b5563" },
  };

  return (
    <li
      style={{
        ...styles.activityItem,
        ...(isLast ? { borderBottom: "none" } : {}),
      }}
    >
      <div style={{ ...styles.channelIcon, ...iconStyles[iconType] }}>
        {icon}
      </div>
      <div style={styles.activityContent}>
        <div style={styles.activityMeta}>
          <span style={styles.activityChannel}>{channel}</span>
          <span style={styles.activityTime}>{time}</span>
        </div>
        <p style={styles.activityPreview}>{preview}</p>
      </div>
    </li>
  );
}

function TaskCard({
  task,
  getPriorityClass,
}: {
  task: Task;
  getPriorityClass: (priority: string) => "high" | "medium" | "low";
}) {
  const priorityColors: Record<string, string> = {
    high: COLORS.danger,
    medium: COLORS.warning,
    low: COLORS.success,
  };

  return (
    <div style={styles.taskCard}>
      <div style={styles.taskCardHeader}>
        <div>
          <span
            style={{
              ...styles.priorityBadge,
              color: priorityColors[getPriorityClass(task.priority)],
              borderColor: priorityColors[getPriorityClass(task.priority)],
            }}
          >
            {task.priority} Priority
          </span>
          <h3 style={styles.taskTitle}>{task.title}</h3>
          <p style={styles.taskMeta}>
            Category: {task.category} {task.due && `• Due: ${task.due}`}
          </p>
        </div>
        <div style={styles.taskStats}>
          {task.energy && <div>⚡ {task.energy} Energy</div>}
          {task.duration && <div>⏱ {task.duration}</div>}
        </div>
      </div>
      <div style={styles.taskTags}>
        {task.source && (
          <span style={styles.taskTag}>Source: {task.source}</span>
        )}
        <span style={styles.taskTag}>ID: {task.id.slice(0, 8)}</span>
      </div>
    </div>
  );
}

function TreeItem({
  icon,
  label,
  indent,
  onClick,
  active,
  highlight,
}: {
  icon: string;
  label: string;
  indent: number;
  onClick?: () => void;
  active?: boolean;
  highlight?: boolean;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      style={{
        ...styles.treeItem,
        paddingLeft: `${indent * 20 + 4}px`,
        ...(active || highlight ? { color: COLORS.accent } : {}),
        ...(hovered && !active ? { color: COLORS.accent } : {}),
        cursor: onClick ? "pointer" : "default",
      }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </div>
  );
}

function SimulatorResponseContent({ response }: { response: AgentResponse }) {
  return (
    <>
      <div style={styles.responseSection}>
        <span style={{ color: COLORS.success }}>
          &gt; {response.success ? "RESPONSE RECEIVED" : "RESPONSE FAILED"}
        </span>
        <p style={styles.responseMessage}>"{response.message}"</p>
      </div>

      <div style={styles.metadataSection}>
        <div style={styles.metadataLabel}>METADATA</div>
        <div style={styles.metadataGrid}>
          <div>
            Tokens:{" "}
            <span style={{ color: COLORS.accent }}>
              {response.metadata.tokensUsed}
            </span>
          </div>
          <div>
            Time:{" "}
            <span style={{ color: COLORS.accent }}>
              {response.metadata.processingTimeMs}ms
            </span>
          </div>
          <div>
            Skills:{" "}
            <span style={{ color: COLORS.accent }}>
              {response.metadata.skillsExecuted.length}
            </span>
          </div>
        </div>
      </div>

      {response.metadata.skillsExecuted.length > 0 && (
        <div style={styles.metadataSection}>
          <div style={styles.metadataLabel}>SKILLS EXECUTED</div>
          <ul style={styles.actionsList}>
            {response.metadata.skillsExecuted.map((skill) => (
              <li key={skill}>• {skill}</li>
            ))}
          </ul>
        </div>
      )}

      {response.actions.length > 0 && (
        <div style={styles.actionsSection}>
          <div style={styles.metadataLabel}>ACTIONS TAKEN</div>
          <ul style={styles.actionsList}>
            {response.actions.map((action, index) => (
              <li key={index}>
                • {action.type}:{" "}
                {action.type === "task_created"
                  ? `${action.title}`
                  : action.type === "task_completed"
                    ? `Task ${action.taskId}`
                    : JSON.stringify(action)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

// Styles
const styles: Record<string, CSSProperties> = {
  // Layout
  body: {
    display: "flex",
    height: "100vh",
    overflow: "hidden",
    fontFamily: "'Inter', sans-serif",
    background: COLORS.bg,
    color: COLORS.text,
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    gap: "16px",
  },
  loadingSpinner: {
    width: "32px",
    height: "32px",
    border: `3px solid ${COLORS.border}`,
    borderTopColor: COLORS.accent,
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  loadingText: {
    color: COLORS.muted,
    fontSize: "0.9rem",
  },
  errorContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
  },
  errorText: {
    color: "#dc2626",
    fontFamily: "'JetBrains Mono', monospace",
  },

  // Grid lines
  gridLine: {
    position: "fixed" as const,
    background: COLORS.border,
    zIndex: 0,
    pointerEvents: "none" as const,
  },
  gridV: {
    width: "1px",
    height: "100vh",
    top: 0,
  },
  gridH: {
    height: "1px",
    width: "100vw",
    left: 0,
  },

  // Sidebar
  aside: {
    width: "260px",
    height: "100vh",
    background: COLORS.surface,
    borderRight: `1px solid ${COLORS.border}`,
    display: "flex",
    flexDirection: "column" as const,
    padding: "2rem 0",
    zIndex: 10,
    position: "relative" as const,
  },
  logo: {
    padding: "0 2rem 3rem 2rem",
    fontWeight: 700,
    fontSize: "0.8rem",
    letterSpacing: "0.2em",
    textTransform: "uppercase" as const,
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  logoMark: {
    width: "12px",
    height: "12px",
    background: COLORS.accent,
    transform: "rotate(45deg)",
  },
  nav: {
    flexGrow: 1,
  },
  navList: {
    listStyle: "none",
  },
  navItem: {
    position: "relative" as const,
    marginBottom: "4px",
  },
  navLink: {
    display: "flex",
    alignItems: "center",
    padding: "0.75rem 2rem",
    textDecoration: "none",
    color: COLORS.muted,
    fontSize: "0.9rem",
    fontWeight: 500,
    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
    borderLeft: "3px solid transparent",
    cursor: "pointer",
  },
  navLinkHover: {
    color: COLORS.text,
    background: "rgba(99, 102, 241, 0.05)",
  },
  navLinkActive: {
    color: COLORS.accent,
    background: "rgba(99, 102, 241, 0.08)",
    borderLeft: `3px solid ${COLORS.accent}`,
  },
  navDivider: {
    height: "1px",
    background: COLORS.border,
    margin: "1.5rem 2rem",
    listStyle: "none",
  },
  simulatorLink: {
    color: COLORS.accent,
    fontWeight: 600,
    background:
      "linear-gradient(90deg, rgba(99, 102, 241, 0.05) 0%, transparent 100%)",
  },

  // Main content
  main: {
    flexGrow: 1,
    height: "100vh",
    overflowY: "auto" as const,
    position: "relative" as const,
    zIndex: 5,
    padding: "2rem 3rem",
  },
  pageTransition: {
    animation: "fadeIn 0.4s ease-out",
  },
  pageHeader: {
    marginBottom: "2.5rem",
  },
  pageTitle: {
    fontSize: "2rem",
    fontWeight: 700,
    letterSpacing: "-0.02em",
  },
  pageSubtitle: {
    color: COLORS.muted,
    fontSize: "0.95rem",
    marginTop: "0.5rem",
  },

  // Stats Grid
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "1.5rem",
    marginBottom: "2.5rem",
  },
  statCard: {
    background: COLORS.vellumBg,
    backdropFilter: "blur(8px)",
    border: `1px solid ${COLORS.border}`,
    padding: "1.5rem",
    position: "relative" as const,
    transition: "transform 0.2s ease",
  },
  statCardCornerTL: {
    position: "absolute" as const,
    top: "-5px",
    left: "-5px",
    width: "10px",
    height: "10px",
    borderTop: `1px solid ${COLORS.muted}`,
    borderLeft: `1px solid ${COLORS.muted}`,
  },
  statCardCornerBR: {
    position: "absolute" as const,
    bottom: "-5px",
    right: "-5px",
    width: "10px",
    height: "10px",
    borderBottom: `1px solid ${COLORS.muted}`,
    borderRight: `1px solid ${COLORS.muted}`,
  },
  statLabel: {
    fontSize: "0.75rem",
    textTransform: "uppercase" as const,
    letterSpacing: "0.1em",
    color: COLORS.muted,
    marginBottom: "1rem",
    display: "block",
  },
  statValue: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "1.75rem",
    fontWeight: 600,
  },
  statSubValue: {
    fontSize: "0.6em",
    color: COLORS.muted,
    marginLeft: "4px",
  },
  hatchBg: {
    backgroundImage: `repeating-linear-gradient(
      -45deg,
      transparent,
      transparent 8px,
      ${COLORS.hatchColor} 8px,
      ${COLORS.hatchColor} 9px
    )`,
  },

  // Dashboard Content
  dashboardContent: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr",
    gap: "2rem",
  },
  sectionBox: {
    background: COLORS.surface,
    border: `1px solid ${COLORS.border}`,
    position: "relative" as const,
  },
  sectionHeader: {
    padding: "1.25rem 1.5rem",
    borderBottom: `1px solid ${COLORS.border}`,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: "0.9rem",
    fontWeight: 600,
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
  },

  // Activity Feed
  activityFeed: {
    listStyle: "none",
  },
  activityItem: {
    padding: "1.25rem 1.5rem",
    borderBottom: `1px solid ${COLORS.border}`,
    display: "flex",
    gap: "1rem",
    transition: "background 0.2s",
  },
  channelIcon: {
    width: "32px",
    height: "32px",
    borderRadius: "4px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "0.75rem",
    fontWeight: "bold",
    flexShrink: 0,
  },
  activityContent: {
    flexGrow: 1,
  },
  activityMeta: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "0.25rem",
  },
  activityChannel: {
    fontFamily: "'JetBrains Mono', monospace",
    fontWeight: 600,
    fontSize: "0.8rem",
  },
  activityTime: {
    fontSize: "0.75rem",
    color: COLORS.muted,
    fontFamily: "'JetBrains Mono', monospace",
  },
  activityPreview: {
    fontSize: "0.9rem",
    color: COLORS.text,
    lineHeight: 1.4,
  },

  // Chart
  chartPlaceholder: {
    height: "200px",
    display: "flex",
    alignItems: "flex-end",
    gap: "10px",
    padding: "1.5rem",
  },
  bar: {
    flexGrow: 1,
    background: COLORS.accent,
    position: "relative" as const,
    transition: "height 1s cubic-bezier(0.16, 1, 0.3, 1)",
  },
  barLabel: {
    position: "absolute" as const,
    bottom: "-20px",
    left: "50%",
    transform: "translateX(-50%)",
    fontSize: "0.6rem",
    color: COLORS.muted,
    whiteSpace: "nowrap" as const,
  },
  priorityRatioContainer: {
    padding: "1.5rem",
    borderTop: `1px solid ${COLORS.border}`,
  },
  priorityBar: {
    height: "8px",
    background: "#eee",
    display: "flex",
  },
  prioritySegment: {
    height: "100%",
  },

  // Tasks View
  filterButtons: {
    display: "flex",
    gap: "1rem",
    marginBottom: "2rem",
  },
  btn: {
    padding: "0.75rem 1.5rem",
    fontWeight: 600,
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
    cursor: "pointer",
    border: "none",
    transition: "all 0.2s",
    fontSize: "0.875rem",
    fontFamily: "'Inter', sans-serif",
  },
  btnActive: {
    background: COLORS.text,
    color: "white",
    border: `1px solid ${COLORS.text}`,
  },
  btnOutline: {
    background: "transparent",
    color: COLORS.text,
    border: `1px solid ${COLORS.border}`,
  },
  taskCard: {
    background: "white",
    border: `1px solid ${COLORS.border}`,
    padding: "1.25rem",
    marginBottom: "1rem",
    display: "flex",
    flexDirection: "column" as const,
    gap: "1rem",
  },
  taskCardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  priorityBadge: {
    fontSize: "0.7rem",
    fontWeight: 700,
    padding: "2px 8px",
    textTransform: "uppercase" as const,
    border: "1px solid currentColor",
    display: "inline-block",
  },
  taskTitle: {
    marginTop: "0.5rem",
    fontSize: "1rem",
    fontWeight: 600,
  },
  taskMeta: {
    color: COLORS.muted,
    fontSize: "0.85rem",
    marginTop: "0.25rem",
  },
  taskStats: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "0.8rem",
    textAlign: "right" as const,
    color: COLORS.muted,
  },
  taskTags: {
    display: "flex",
    gap: "10px",
    marginTop: "0.5rem",
  },
  taskTag: {
    background: "#f3f4f6",
    padding: "2px 8px",
    fontSize: "0.75rem",
  },
  emptyState: {
    textAlign: "center" as const,
    padding: "4rem 2rem",
    color: COLORS.muted,
  },

  // File Browser
  fileBrowser: {
    display: "flex",
    height: "600px",
    border: `1px solid ${COLORS.border}`,
  },
  fileTree: {
    width: "250px",
    borderRight: `1px solid ${COLORS.border}`,
    padding: "1rem",
    background: COLORS.bg,
  },
  fileContent: {
    flexGrow: 1,
    padding: "2rem",
    background: "white",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "0.85rem",
    lineHeight: 1.6,
    overflowY: "auto" as const,
  },
  fileContentPre: {
    margin: 0,
    whiteSpace: "pre-wrap" as const,
  },
  treeItem: {
    padding: "4px 0",
    fontSize: "0.9rem",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    transition: "color 0.15s",
  },

  // Placeholder pages
  placeholderBox: {
    background: COLORS.surface,
    border: `1px solid ${COLORS.border}`,
    padding: "4rem 2rem",
    textAlign: "center" as const,
  },
  placeholderIcon: {
    fontSize: "3rem",
    marginBottom: "1rem",
  },
  placeholderText: {
    fontSize: "1.1rem",
    fontWeight: 500,
    color: COLORS.text,
  },
  placeholderSubtext: {
    fontSize: "0.9rem",
    color: COLORS.muted,
    marginTop: "0.5rem",
  },

  // Simulator
  simulatorLayout: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 0,
    border: `1px solid ${COLORS.border}`,
    height: "calc(100vh - 200px)",
  },
  composer: {
    padding: "2.5rem",
    overflowY: "auto" as const,
    borderRight: `1px solid ${COLORS.border}`,
    background: COLORS.surface,
  },
  responseView: {
    padding: "2.5rem",
    overflowY: "auto" as const,
    background: "#1a1a1a",
    color: "#fff",
    fontFamily: "'JetBrains Mono', monospace",
  },
  inputGroup: {
    marginBottom: "1.5rem",
  },
  inputLabel: {
    display: "block",
    fontSize: "0.75rem",
    fontWeight: 600,
    textTransform: "uppercase" as const,
    marginBottom: "0.5rem",
    color: COLORS.muted,
  },
  input: {
    width: "100%",
    padding: "0.75rem",
    border: `1px solid ${COLORS.border}`,
    fontFamily: "'Inter', sans-serif",
    fontSize: "0.9rem",
    outline: "none",
  },
  textarea: {
    width: "100%",
    padding: "0.75rem",
    border: `1px solid ${COLORS.border}`,
    fontFamily: "'Inter', sans-serif",
    fontSize: "0.9rem",
    outline: "none",
    resize: "vertical" as const,
  },
  select: {
    width: "100%",
    padding: "0.75rem",
    border: `1px solid ${COLORS.border}`,
    fontFamily: "'Inter', sans-serif",
    fontSize: "0.9rem",
    outline: "none",
    background: "white",
  },
  btnPrimary: {
    padding: "0.75rem 1.5rem",
    fontWeight: 600,
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
    cursor: "pointer",
    border: "none",
    transition: "all 0.2s",
    background: COLORS.accent,
    color: "white",
    fontSize: "0.875rem",
    fontFamily: "'Inter', sans-serif",
  },
  presetsSection: {
    marginTop: "2rem",
  },
  presetsGrid: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: "8px",
  },
  presetBtn: {
    fontSize: "0.7rem",
    padding: "0.5rem 0.75rem",
    border: `1px solid ${COLORS.border}`,
    background: "transparent",
    cursor: "pointer",
    fontFamily: "'Inter', sans-serif",
    transition: "all 0.2s",
  },
  processingText: {
    fontFamily: "'JetBrains Mono', monospace",
    color: COLORS.accent,
  },
  waitingText: {
    color: "#666",
  },
  responseSection: {
    marginBottom: "2rem",
  },
  responseMessage: {
    marginTop: "1rem",
    color: "#fff",
    fontFamily: "'Inter', sans-serif",
    lineHeight: 1.5,
  },
  metadataSection: {
    borderTop: "1px solid #333",
    paddingTop: "1rem",
  },
  metadataLabel: {
    color: "#666",
    fontSize: "0.8rem",
    marginBottom: "1rem",
  },
  metadataGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
    fontSize: "0.8rem",
  },
  actionsSection: {
    marginTop: "2rem",
  },
  actionsList: {
    listStyle: "none",
    fontSize: "0.8rem",
    color: "#aaa",
  },
};
