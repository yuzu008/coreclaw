---
name: scientific-assistant
description: |
  Comprehensive scientific research assistant powered by SATORI Agent Skills.
  195 specialized sub-skills covering bayesian statistics, deep research,
  molecular modeling, genomics, clinical NLP, cheminformatics, advanced
  visualization, and more. Supports the SHIKIGAMI paradigm
  (Think → Report → Action iterative cycle) for systematic research workflows.
---

# Scientific Assistant

A comprehensive collection of 195 scientific research skills from SATORI,
organized as sub-skill directories within this skill package.

## Capabilities

- **Data Analysis**: Bayesian statistics, time-series, anomaly detection, causal inference
- **Life Sciences**: AlphaFold structures, genomics, ADMET pharmacokinetics, clinical NLP
- **Chemistry**: Cheminformatics, molecular dynamics, reaction predictions
- **Research Workflows**: Deep research, systematic reviews, experiment design
- **Visualization**: Advanced plotting, network graphs, geospatial mapping
- **AI/ML**: Active learning, transfer learning, ensemble methods, NLP

## Usage

Each sub-skill is automatically loaded and activated based on the user's request.
The SHIKIGAMI paradigm guides complex research tasks through iterative cycles
of thinking, reporting, and acting.

## Education Theory Database

Shared with `teaching-assistant`. Data is stored at `skills/teaching-assistant/data/`:

| File | Size | Contents |
|------|------|----------|
| `theories.db` | 1.5MB | 175 education theories (SQLite FTS5 trigram) |
| `theories.json` | 315KB | Education theories in JSON |
| `relations.json` | 9.4KB | Inter-theory relationships (77 entries) |
| `curriculum/*.md` | 5.2MB | Japanese curriculum guidelines (elementary/middle/high school) |
