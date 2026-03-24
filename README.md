# CoreClaw

AI assistant with Chat frontend and Agent Skills, powered by GitHub Copilot CLI in Docker containers.

CoreClaw is derived from [SciClaw](https://github.com/nahisaho/sciclaw) with SATORI Skill and ToolUniverse removed, providing a streamlined Chat + Agent Skills environment.

## Features

- **ChatGPT-like Web UI** — 2-pane SPA with experiment management, markdown rendering, and file uploads
- **Agent Skills** — 8 skill packages (consultant ×5, educator, scientist with 195 sub-skills, general-assistant)
- **Docker Isolation** — Each agent task runs in its own container sandbox
- **GitHub Copilot CLI** — Powered by `@github/copilot` for AI-driven code generation
- **WebSocket Streaming** — Real-time response streaming
- **GitHub Sync** — Push/pull experiment results to GitHub repositories
- **MCP Support** — Connect to any MCP server (ToolUniverse, Deep Research, custom servers)
- **GitHub MCP Tools** — Optional GitHub MCP server integration (repos, issues, PRs)
- **Skill Scanner** — Security scan for skills with whitelist support
- **Self-Update** — Check/Update mechanism with automatic server restart

## Prerequisites

- Node.js 22+
- Docker
- GitHub Copilot license (Individual, Business, or Enterprise)
- GitHub Token (for Copilot CLI authentication)

## Quick Start

```bash
# Clone the repository
git clone https://github.com/nahisaho/coreclaw.git
cd coreclaw

# Install dependencies
npm install

# Copy and configure environment
cp .env.example .env
# Edit .env and set GITHUB_TOKEN
# You can use the gh CLI to get your token:
#   echo "GITHUB_TOKEN=$(gh auth token)" > .env

# Build the agent container
./container/build.sh

# Start the server
npm run build && npm start

# Start with custom ports (e.g. if port 3000 is already in use)
CORECLAW_WEB_PORT=3050 CREDENTIAL_PROXY_PORT=3051 npm start

# Development mode (auto-reload with tsx)
npm run dev
```

Open http://localhost:3000 in your browser (port is configurable via `CORECLAW_WEB_PORT`).

## Architecture

```
┌────────────────────────────────────────────────────────┐
│  Browser (SPA)                                         │
│  http://localhost:3000 (default)                       │
└────────────┬───────────────────────────────────────────┘
             │ HTTP/WS
┌────────────▼───────────────────────────────────────────┐
│  web-server.ts (API + WebSocket)                       │
│  ├── Settings, Skills, Experiments, Scanner APIs       │
│  ├── Check/Update (CoreClaw + Copilot CLI)             │
│  └── GitHub Sync                                       │
├────────────────────────────────────────────────────────┤
│  container-runner.ts                                   │
│  ├── Docker spawn + volume mounts                      │
│  ├── Skills sync to container                          │
│  ├── MCP config injection (--additional-mcp-config)    │
│  └── GitHub MCP tools (--enable-all-github-mcp-tools)  │
├────────────────────────────────────────────────────────┤
│  credential-proxy.ts (:3001)                           │
│  └── GitHub token injection for container agents       │
└────────────┬───────────────────────────────────────────┘
             │ Docker
┌────────────▼───────────────────────────────────────────┐
│  coreclaw-agent:latest                                 │
│  ├── agent-runner (TypeScript)                         │
│  │   └── copilot -p <prompt> --allow-all               │
│  │       --additional-mcp-config @/tmp/mcp-config.json │
│  ├── GitHub Copilot CLI (@github/copilot)              │
│  ├── Python 3 + uv (for MCP servers like ToolUniverse) │
│  ├── Chromium (for web automation)                     │
│  └── CJK fonts (Japanese/Chinese/Korean support)       │
└────────────────────────────────────────────────────────┘
```

## Project Structure

```
coreclaw/
├── src/                    # TypeScript source (host orchestrator)
│   ├── index.ts            # Main orchestrator + message loop
│   ├── web-server.ts       # HTTP API + WebSocket server
│   ├── experiments.ts      # Experiment CRUD + artifacts
│   ├── db.ts               # SQLite database layer
│   ├── container-runner.ts # Docker container spawn + MCP config
│   ├── container-runtime.ts# Docker runtime abstraction
│   ├── skills-sync.ts      # Local skills synchronization
│   ├── ipc.ts              # Inter-process communication
│   ├── credential-proxy.ts # GitHub token injection proxy
│   ├── task-scheduler.ts   # Cron/interval task scheduling
│   ├── group-queue.ts      # Concurrency management
│   ├── router.ts           # Message formatting
│   ├── config.ts           # Environment config
│   └── ...
├── container/              # Docker container files
│   ├── Dockerfile          # Agent container (Copilot + Python + uv + CJK)
│   ├── build.sh            # Build automation
│   └── agent-runner/       # In-container Copilot CLI orchestrator
├── public/                 # Web frontend
│   ├── index.html          # Main chat UI (single-file SPA)
│   └── viewer.html         # Markdown/Mermaid viewer
├── skills/                 # Agent Skills
│   ├── consultant/         # General consulting (53 frameworks)
│   ├── consultant-acn/     # Accenture-style consulting
│   ├── consultant-bcg/     # BCG-style consulting
│   ├── consultant-mck/     # McKinsey-style consulting
│   ├── consultant-pwc/     # PwC-style consulting
│   ├── educationalist/     # Teaching assistant (175 education theories)
│   ├── general-assistant/  # General-purpose assistant
│   └── scientist/          # Scientific assistant (195 sub-skills)
├── data/                   # Runtime data (git-ignored)
└── groups/                 # Group workspaces (git-ignored)
```

## MCP Servers

CoreClaw supports external MCP servers via Settings > MCP Servers.
Configured servers are injected into agent containers via `--additional-mcp-config`.

### Preset MCP Servers

| Server | Button | Description |
|--------|--------|-------------|
| **ToolUniverse** | `+ ToolUniverse` | 1000+ scientific tools (life science, chemistry, literature search) |
| **Deep Research** | `+ Deep Research` | Structured research report generation |

### GitHub MCP Tools

Settings > Copilot > GitHub MCP Tools enables GitHub API access for agents:
- **All Tools** — Full access to repos, issues, PRs, search
- **Repos + Issues + PRs** — Common subset
- Individual tool categories available

### Custom MCP Servers

Add any stdio or SSE-based MCP server with command, args, and environment variables.

## Adding Skills

Place skill directories in `skills/`:

```
skills/
├── my-skill/
│   └── SKILL.md
└── another-skill/
    └── SKILL.md
```

Each `SKILL.md` should have YAML frontmatter:

```markdown
---
name: My Skill
description: |
  What this skill does and when to use it.
---

Detailed instructions for the agent...
```

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `GITHUB_TOKEN` | *(required)* | GitHub token for Copilot CLI |
| `CORECLAW_WEB_PORT` | `3000` | Web server port |
| `CREDENTIAL_PROXY_PORT` | `3001` | Credential proxy port |
| `ASSISTANT_NAME` | `Andy` | Bot trigger name |
| `CONTAINER_IMAGE` | `coreclaw-agent:latest` | Docker image for agents |
| `CONTAINER_TIMEOUT` | `1800000` | Agent timeout (ms) |
| `MAX_CONCURRENT_CONTAINERS` | `5` | Max parallel agents |
| `LOG_LEVEL` | `info` | Log level |

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for the full version history.

### Recent highlights

| Version | Date | Summary |
|---------|------|---------|
| **v0.1.16** | 2026-03-24 | Artifact inline viewer — popup for Markdown (with PNG embed), JSON, Python, Mermaid, images, PDF |
| **v0.1.15** | 2026-03-24 | Fix: background agent output disappears — summariser container stole `_close` IPC sentinel from next main-agent run |
| **v0.1.14** | 2026-03-24 | Scientist skill: figures saved to `figures/` are now embedded as `![Caption](figures/file.png)` links in `report.md` |
| **v0.1.13** | 2026-03-24 | Fix: auto-restart `EADDRINUSE` — graceful HTTP port release + `npm run build` added to update flow |
| **v0.1.11** | 2026-03-24 | Per-group conversation memory with auto-summarization (rolling DB summary, UI badge, manual compress) |
| **v0.1.10** | 2026-03-24 | Auto-restart on update; port numbers inherited by restarted process |
| **v0.1.9** | 2026-03-24 | Fix: cross-group streaming leaks via server-side subscription model |
| **v0.1.8** | 2026-03-24 | Fix: streaming messages leaking across chat groups (client-side) |

## License

MIT
