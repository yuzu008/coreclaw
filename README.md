# CoreClaw

AI assistant with Chat frontend and Agent Skills, powered by GitHub Copilot CLI in Docker containers.

CoreClaw is derived from [SciClaw](https://github.com/nahisaho/sciclaw) with SATORI Skill and ToolUniverse removed, providing a streamlined Chat + Agent Skills environment.

## Features

- **ChatGPT-like Web UI** — 2-pane SPA with experiment management, markdown rendering, and file uploads
- **Agent Skills** — Local skill definitions in `skills/` directory, synced to agent containers
- **Docker Isolation** — Each agent task runs in its own container sandbox
- **GitHub Copilot CLI** — Powered by `@github/copilot` for AI-driven code generation
- **WebSocket Streaming** — Real-time response streaming
- **GitHub Sync** — Push/pull experiment results to GitHub repositories
- **MCP Support** — Connect to any MCP server for extended capabilities

## Prerequisites

- Node.js 20+
- Docker
- GitHub Token (for Copilot CLI authentication)

## Quick Start

```bash
# Install dependencies
npm install

# Copy and configure environment
cp .env.example .env
# Edit .env and set GITHUB_TOKEN

# Build the agent container
./container/build.sh

# Start the server
npm run dev
```

Open http://localhost:3000 in your browser.

## Project Structure

```
coreclaw/
├── src/                    # TypeScript source (host orchestrator)
│   ├── index.ts            # Main orchestrator + message loop
│   ├── web-server.ts       # HTTP API + WebSocket server
│   ├── experiments.ts      # Experiment CRUD + artifacts
│   ├── db.ts               # SQLite database layer
│   ├── container-runner.ts # Docker container spawn + streaming
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
│   ├── Dockerfile          # Agent container (Copilot + Python + CJK)
│   ├── build.sh            # Build automation
│   └── agent-runner/       # In-container Copilot CLI orchestrator
├── public/                 # Web frontend
│   ├── index.html          # Main chat UI
│   └── viewer.html         # Markdown/Mermaid viewer
├── skills/                 # Agent Skills (local)
│   └── {skill-name}/
│       └── SKILL.md        # Skill definition with YAML frontmatter
├── data/                   # Runtime data (git-ignored)
└── groups/                 # Group workspaces (git-ignored)
```

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
| `ASSISTANT_NAME` | `Andy` | Bot trigger name |
| `CONTAINER_IMAGE` | `coreclaw-agent:latest` | Docker image for agents |
| `CONTAINER_TIMEOUT` | `1800000` | Agent timeout (ms) |
| `MAX_CONCURRENT_CONTAINERS` | `5` | Max parallel agents |
| `LOG_LEVEL` | `info` | Log level |

## License

MIT
