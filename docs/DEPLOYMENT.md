# Deployment Guide

This guide covers deploying the complete Vibe Planning application to production, including the Next.js app, Graphiti knowledge graph service, and Neo4j database.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Production Deployment                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────┐ │
│  │  Next.js App    │───▶│  Graphiti API   │───▶│   Neo4j     │ │
│  │  (Vercel)       │    │  (Railway/Fly)  │    │  (Aura)     │ │
│  └─────────────────┘    └─────────────────┘    └─────────────┘ │
│           │                                                     │
│           ▼                                                     │
│  ┌─────────────────┐                                           │
│  │  GitHub Repo    │  (for task storage)                       │
│  └─────────────────┘                                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Services Overview

| Service              | Platform          | Purpose                        | Cost      |
| -------------------- | ----------------- | ------------------------------ | --------- |
| **Next.js Frontend** | Vercel            | Web app, API routes, dashboard | Free      |
| **Graphiti API**     | Railway or Fly.io | Knowledge graph service        | $5-10/mo  |
| **Neo4j Database**   | Neo4j Aura        | Graph database for memory      | Free tier |
| **Task Storage**     | GitHub API        | File-based workspace           | Free      |

## Prerequisites

Before deploying, ensure you have:

- [ ] GitHub account with your code pushed
- [ ] Vercel account (sign up at https://vercel.com)
- [ ] Railway account (https://railway.app) OR Fly.io account (https://fly.io)
- [ ] Neo4j Aura database (https://neo4j.com/cloud/aura/)
- [ ] OpenAI API key (https://platform.openai.com/api-keys)
- [ ] OpenRouter API key (https://openrouter.ai/keys)

---

## Step 1: Set Up Neo4j Aura (Database)

### 1.1 Create Database

1. Go to https://neo4j.com/cloud/aura/
2. Click "Start Free"
3. Create a new **AuraDB Free** instance
4. Choose a region close to your users
5. **Save the credentials** - you'll need them later

### 1.2 Note Your Connection Details

After creation, you'll receive:

```
NEO4J_URI=neo4j+s://xxxxx.databases.neo4j.io
NEO4J_USER=neo4j
NEO4J_PASSWORD=your-generated-password
```

**Important:** Save these immediately - the password is only shown once!

---

## Step 2: Deploy Graphiti API

Graphiti needs to run as a separate service. Choose **Railway** (easier) or **Fly.io** (more control).

### Option A: Railway (Recommended)

#### 2.1 Install Railway CLI

```bash
npm install -g @railway/cli
```

#### 2.2 Login to Railway

```bash
railway login
```

#### 2.3 Create Railway Project

```bash
cd graphiti
railway init
```

#### 2.4 Create `railway.toml`

Create this file in the `graphiti` directory:

```toml
[build]
builder = "DOCKERFILE"
dockerfilePath = "Dockerfile"

[deploy]
startCommand = "python -m uvicorn main:app --host 0.0.0.0 --port $PORT"
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10
```

#### 2.5 Set Environment Variables

In Railway dashboard or via CLI:

```bash
railway variables set NEO4J_URI="neo4j+s://xxxxx.databases.neo4j.io"
railway variables set NEO4J_USER="neo4j"
railway variables set NEO4J_PASSWORD="your-password"
railway variables set OPENAI_API_KEY="sk-..."
railway variables set PORT="8000"
```

#### 2.6 Deploy

```bash
railway up
```

#### 2.7 Get Your Railway URL

```bash
railway domain
```

Note the URL (e.g., `https://your-app.railway.app`) - you'll need it for the Next.js deployment.

### Option B: Fly.io

#### 2.1 Install Fly CLI

Windows:

```powershell
iwr https://fly.io/install.ps1 -useb | iex
```

Mac/Linux:

```bash
curl -L https://fly.io/install.sh | sh
```

#### 2.2 Login and Launch

```bash
cd graphiti
fly auth login
fly launch
```

Follow the prompts:

- App name: `your-app-graphiti`
- Region: Choose closest to your users
- Postgres: No
- Deploy now: No (we need to set secrets first)

#### 2.3 Set Secrets

```bash
fly secrets set \
  NEO4J_URI="neo4j+s://xxxxx.databases.neo4j.io" \
  NEO4J_USER="neo4j" \
  NEO4J_PASSWORD="your-password" \
  OPENAI_API_KEY="sk-..."
```

#### 2.4 Deploy

```bash
fly deploy
```

#### 2.5 Get Your Fly URL

```bash
fly status
```

Note the URL (e.g., `https://your-app-graphiti.fly.dev`)

---

## Step 3: Deploy Next.js App to Vercel

### 3.1 Push Code to GitHub

If you haven't already:

```bash
cd C:\Users\clayb\OneDrive\Documents\GitHub\Taygency
git add .
git commit -m "Prepare for deployment"
git push origin main
```

### 3.2 Connect to Vercel

**Option A: Via Website (Easiest)**

1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Framework: Next.js (auto-detected)
4. Root Directory: `./apps/web`
5. Click "Deploy"

**Option B: Via CLI**

```bash
npm install -g vercel
cd apps/web
vercel
```

### 3.3 Set Environment Variables in Vercel

Go to your project in Vercel Dashboard → Settings → Environment Variables

Add the following:

#### Required Variables

```bash
# AI/LLM
OPENROUTER_API_KEY=your-openrouter-key

# GitHub Storage
GITHUB_TOKEN=ghp_your-github-token
GITHUB_OWNER=your-github-username
GITHUB_REPO=vibe-planning-data

# Graphiti Knowledge Graph
GRAPHITI_URL=https://your-graphiti-app.railway.app
```

#### Optional Variables

```bash
# Email (if using SendGrid)
SENDGRID_API_KEY=SG.your-sendgrid-key

# Rate Limiting (if using Upstash)
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token

# SMS (if using VAPI)
VAPI_API_KEY=your-vapi-key
```

### 3.4 Redeploy

After adding environment variables:

1. Go to Deployments tab
2. Click "..." on latest deployment
3. Click "Redeploy"

Or via CLI:

```bash
vercel --prod
```

---

## Step 4: Verification

### 4.1 Test Neo4j Connection

```bash
curl -X POST https://your-graphiti-app.railway.app/healthcheck
```

Expected response:

```json
{ "status": "healthy" }
```

### 4.2 Test Graphiti API

```bash
curl -X POST https://your-graphiti-app.railway.app/search \
  -H "Content-Type: application/json" \
  -d '{"query": "test", "max_facts": 5}'
```

Expected response:

```json
{ "facts": [] }
```

### 4.3 Test Next.js App

1. Visit your Vercel URL (e.g., `https://your-app.vercel.app`)
2. Check the landing page loads
3. Go to `/dashboard`
4. Click "Memory" - should show "Graphiti not configured" or connection status

### 4.4 Test Full Integration

Send a test message through the simulator:

1. Go to `https://your-app.vercel.app/dashboard`
2. Click "Simulator"
3. Send a test message
4. Check the Memory page - should show extracted facts

---

## Step 5: Custom Domain (Optional)

### 5.1 Add Domain to Vercel

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add your domain (e.g., `vibeplan.com`)
3. Follow DNS configuration instructions

### 5.2 Add Domain to Railway (Optional)

1. Go to Railway Dashboard → Your Service → Settings
2. Click "Generate Domain" or add custom domain
3. Update `GRAPHITI_URL` in Vercel to use the custom domain

---

## Cost Breakdown

### Monthly Estimates

| Service        | Tier          | Cost            |
| -------------- | ------------- | --------------- |
| **Vercel**     | Hobby         | $0              |
| **Railway**    | Starter       | $5-10           |
| **Neo4j Aura** | Free          | $0              |
| **OpenAI API** | Pay-as-you-go | $1-5            |
| **OpenRouter** | Pay-as-you-go | $1-5            |
| **GitHub**     | Free/Pro      | $0-4            |
| **SendGrid**   | Free tier     | $0              |
| **Total**      |               | **$7-24/month** |

### Usage-Based Costs

- **OpenAI**: ~$0.0001 per 1K tokens (embeddings)
- **OpenRouter**: Varies by model (~$0.002-0.02 per 1K tokens)
- Expect $1-5/month for light usage, $10-20/month for moderate usage

---

## Scaling Considerations

### When You Outgrow Free Tiers

| Bottleneck       | Solution                  | Cost      |
| ---------------- | ------------------------- | --------- |
| Vercel bandwidth | Upgrade to Pro            | $20/mo    |
| Railway compute  | Scale up resources        | $10-50/mo |
| Neo4j storage    | Upgrade to Pro            | $65/mo    |
| API usage        | Batch operations, caching | Variable  |

### Performance Optimization

1. **Enable Vercel Edge Functions** for global performance
2. **Add Redis caching** (Upstash) for frequent queries
3. **Use Vercel Analytics** to monitor performance
4. **Implement rate limiting** to control costs

---

## Troubleshooting

### Graphiti Connection Errors

**Problem:** Dashboard shows "Connection failed"

**Solutions:**

1. Check `GRAPHITI_URL` in Vercel matches your Railway/Fly URL
2. Test Graphiti health endpoint directly
3. Check Railway/Fly logs for errors
4. Verify Neo4j credentials are correct

### Neo4j Authentication Errors

**Problem:** "Invalid credentials" or "Connection refused"

**Solutions:**

1. Verify `NEO4J_URI` uses `neo4j+s://` (with SSL)
2. Check username is `neo4j`
3. Ensure password matches Neo4j Aura
4. Check firewall/network restrictions

### OpenAI API Errors

**Problem:** "Invalid API key" or "Rate limit exceeded"

**Solutions:**

1. Regenerate API key at https://platform.openai.com/api-keys
2. Check billing is enabled on OpenAI account
3. Verify key is set correctly in Railway/Fly
4. Restart Graphiti service after updating key

### GitHub Storage Errors

**Problem:** "Failed to fetch tasks" or "API rate limit"

**Solutions:**

1. Verify `GITHUB_TOKEN` has `repo` scope
2. Check repository exists and is accessible
3. Use a Personal Access Token (classic) not Fine-grained
4. Verify repository name matches `GITHUB_REPO`

---

## Monitoring

### Vercel

- **Analytics**: Automatic, view in dashboard
- **Logs**: Real-time logs in deployment view
- **Errors**: Runtime logs show server errors

### Railway

- **Metrics**: CPU, Memory, Network in dashboard
- **Logs**: Click "View Logs" in service view
- **Alerts**: Set up via integrations

### Neo4j Aura

- **Metrics**: Database size, query performance
- **Logs**: Available in console
- **Alerts**: Email notifications for issues

---

## Maintenance

### Regular Tasks

| Task                | Frequency | How                          |
| ------------------- | --------- | ---------------------------- |
| Check logs          | Weekly    | Review Vercel + Railway logs |
| Monitor costs       | Monthly   | Check billing dashboards     |
| Update dependencies | Monthly   | `npm update` and redeploy    |
| Rotate API keys     | Quarterly | Regenerate and update        |
| Database cleanup    | As needed | Remove old graph data        |

### Backup Strategy

1. **GitHub Repository**: Already versioned
2. **Neo4j Aura**: Automatic backups (restore via console)
3. **Environment Variables**: Keep secure copy in password manager

---

## Support Resources

- **Vercel Docs**: https://vercel.com/docs
- **Railway Docs**: https://docs.railway.app
- **Fly.io Docs**: https://fly.io/docs
- **Neo4j Aura**: https://neo4j.com/docs/aura
- **Graphiti**: https://github.com/getzep/graphiti

---

## Quick Deploy Script

For future deployments, create a script:

```bash
#!/bin/bash
# deploy.sh

echo "🚀 Deploying Vibe Planning..."

# Deploy Graphiti
echo "📦 Deploying Graphiti..."
cd graphiti
railway up
cd ..

# Deploy Next.js
echo "🌐 Deploying Next.js..."
cd apps/web
vercel --prod
cd ../..

echo "✅ Deployment complete!"
echo "🔗 Check your Vercel dashboard for the live URL"
```

Make executable:

```bash
chmod +x deploy.sh
./deploy.sh
```

---

## Next Steps After Deployment

1. **Test all features** end-to-end
2. **Set up monitoring** (Sentry, LogRocket, etc.)
3. **Configure email webhooks** (SendGrid inbound parse)
4. **Set up SMS** (VAPI or Twilio)
5. **Add custom domain**
6. **Enable analytics**
7. **Create backup/restore procedures**

---

_Last updated: January 2026_
