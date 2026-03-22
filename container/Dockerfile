# SciClaw Agent Container
# Runs GitHub Copilot CLI in isolated Linux container

FROM node:22-slim

# Install system dependencies (Chromium for web automation, git, curl, Python for data science)
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-liberation \
    fonts-noto-cjk \
    fonts-noto-cjk-extra \
    fonts-noto-color-emoji \
    fonts-ipafont-gothic \
    fonts-ipafont-mincho \
    fontconfig \
    libgbm1 \
    libnss3 \
    libatk-bridge2.0-0 \
    libgtk-3-0 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libasound2 \
    libpangocairo-1.0-0 \
    libcups2 \
    libdrm2 \
    libxshmfence1 \
    curl \
    git \
    python3 \
    python3-pip \
    python3-venv \
    sqlite3 \
    && rm -rf /var/lib/apt/lists/*

# Install uv (Python package manager for MCP servers like ToolUniverse)
ENV UV_INSTALL_DIR=/usr/local/bin
RUN curl -LsSf https://astral.sh/uv/install.sh | sh

# Rebuild font cache so all fonts are discoverable
RUN fc-cache -fv

# Configure matplotlib to use Japanese fonts by default
RUN mkdir -p /etc/matplotlib && printf '\
font.family : sans-serif\n\
font.sans-serif : Noto Sans CJK JP, IPAGothic, Noto Sans CJK SC, DejaVu Sans\n\
axes.unicode_minus : False\n\
' > /etc/matplotlib/matplotlibrc
ENV MPLCONFIGDIR=/tmp/matplotlib

# Set Chromium path for browser automation
ENV AGENT_BROWSER_EXECUTABLE_PATH=/usr/bin/chromium

# Install GitHub CLI
RUN curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg \
    | dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg \
    && chmod go+r /usr/share/keyrings/githubcli-archive-keyring.gpg \
    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" \
    | tee /etc/apt/sources.list.d/github-cli.list > /dev/null \
    && apt-get update \
    && apt-get install -y gh \
    && rm -rf /var/lib/apt/lists/*

# Install GitHub Copilot CLI (the actual GitHub Copilot coding agent)
# ARGs bust Docker cache to ensure latest version is installed on each build
ARG COPILOT_VERSION=latest
ARG BUILD_DATE=unknown
RUN npm install -g @github/copilot@latest

# Create app directory
WORKDIR /app

# Copy package files for better caching
COPY agent-runner/package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY agent-runner/ ./

# Build TypeScript
RUN npm run build

# Create workspace directories
RUN mkdir -p /workspace/group/.github/skills /workspace/global /workspace/extra /workspace/ipc/messages /workspace/ipc/tasks /workspace/ipc/input

# Create entrypoint script
RUN printf '#!/bin/bash\nset -e\ncd /app && npx tsc --outDir /tmp/dist 2>&1 >&2\nln -s /app/node_modules /tmp/dist/node_modules\nchmod -R a-w /tmp/dist\ncat > /tmp/input.json\nnode /tmp/dist/index.js < /tmp/input.json\n' > /app/entrypoint.sh && chmod +x /app/entrypoint.sh

# Set ownership to node user (non-root)
RUN chown -R node:node /workspace && chmod 777 /home/node

# Switch to non-root user
USER node

# Set working directory to group workspace
WORKDIR /workspace/group

# Entry point reads JSON from stdin, outputs JSON to stdout
ENTRYPOINT ["/app/entrypoint.sh"]
