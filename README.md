<div align="center">

# HyperEval

### AI-Powered Impact Claim Evaluation Engine

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**Evaluate, verify, and attest impact claims on the [Hypercerts Protocol](https://hypercerts.org) using multi-agent AI analysis.**

[Getting Started](#getting-started) · [API Reference](#api-reference) · [Architecture](#architecture)

</div>

---

## Overview

HyperEval is an intelligent evaluation system that leverages three specialized AI agents working in parallel to assess the credibility, evidence quality, and real-world impact of hypercert claims. The system generates EAS-compatible attestations for every evaluation, enabling trustless verification of impact claims on-chain.

### Key Capabilities

| Feature | Description |
|---------|-------------|
| **Multi-Agent Analysis** | Three AI agents evaluate claims simultaneously for comprehensive assessment |
| **Real-time Hypercert Browser** | Browse and search live hypercerts from the Hypercerts GraphQL API |
| **EAS Attestations** | Generate Ethereum Attestation Service compatible records with SHA-256 hashes |
| **Schema Extraction** | Extract structured hypercert fields from unstructured text (reports, proposals) |
| **Comparative Analysis** | Side-by-side evaluation comparison with visual score charts |
| **Agent-to-Agent API** | RESTful endpoints designed for integration with other AI systems |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         HyperEval                               │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   Claim     │  │  Evidence   │  │   Impact    │   AI Agents  │
│  │  Verifier   │  │  Checker    │  │   Scorer    │   (Parallel) │
│  │    30%      │  │    35%      │  │    35%      │              │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
│         └────────────────┼────────────────┘                     │
│                          ▼                                      │
│              ┌───────────────────────┐                          │
│              │   Score Aggregation   │                          │
│              │   & EAS Attestation   │                          │
│              └───────────────────────┘                          │
├─────────────────────────────────────────────────────────────────┤
│  Frontend (React + Vite)  │  Backend (Express 5)  │  AI Client  │
└─────────────────────────────────────────────────────────────────┘
```

### Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 19, Vite, TypeScript |
| **Styling** | Tailwind CSS v4, shadcn/ui, Framer Motion |
| **Backend** | Express 5, Node.js 20+ |
| **AI Engine** | Claude (Anthropic) — 3 parallel agents |
| **Data Source** | Hypercerts GraphQL API |
| **API Contract** | OpenAPI 3.1, Orval codegen |
| **Package Manager** | pnpm workspaces (monorepo) |

---

## Project Structure

```
hypereval/
├── artifacts/
│   ├── hypereval/              # React frontend application
│   └── api-server/             # Express REST API server
├── packages/
│   ├── ai-client/              # Anthropic AI integration
│   ├── api-client-react/       # Auto-generated React Query hooks
│   ├── api-spec/               # OpenAPI specification
│   ├── api-zod/                # Zod validation schemas
│   └── db/                     # Database utilities
├── scripts/                    # Build & automation scripts
├── tsconfig.base.json          # Shared TypeScript config
└── pnpm-workspace.yaml         # Monorepo configuration
```

---

## Getting Started

### Prerequisites

- **Node.js** 20 or higher
- **pnpm** 9 or higher

### Installation

```bash
# Clone the repository
git clone https://github.com/envexx/HyperEval.git
cd HyperEval

# Install dependencies
pnpm install
```

### Configuration

Create a `.env` file in the root directory:

```env
# Anthropic AI Configuration (Required)
AI_INTEGRATIONS_ANTHROPIC_BASE_URL=https://api.anthropic.com
AI_INTEGRATIONS_ANTHROPIC_API_KEY=your_api_key_here

# Application Security
SESSION_SECRET=your_secure_session_secret
```

### Development

```bash
# Start the API server (Terminal 1)
pnpm --filter @workspace/api-server run dev

# Start the frontend (Terminal 2)
pnpm --filter @workspace/hypereval run dev
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| API Server | http://localhost:8080 |

### Production Build

```bash
pnpm run build
```

---

## API Reference

### Agent Evaluation Endpoint

#### `POST /api/v1/agent/evaluate`

Evaluate a hypercert claim using multi-agent AI analysis.

**Request (by Hypercert ID):**
```json
{
  "hypercert_id": "10-0x822f17a9...-123456",
  "context": "Additional evaluation context"
}
```

**Request (by Raw Data):**
```json
{
  "hypercert_data": {
    "metadata": {
      "name": "Climate Reforestation Initiative",
      "description": "Planted 10,000 trees across degraded land",
      "work_scope": ["climate", "reforestation"],
      "contributors": ["Organization A", "Organization B"]
    }
  }
}
```

**Response:**
```json
{
  "overallScore": 78,
  "verdict": "Credible Impact",
  "agents": {
    "claimVerifier": { "score": 82, "findings": [...] },
    "evidenceChecker": { "score": 75, "findings": [...] },
    "impactScorer": { "score": 77, "findings": [...] }
  },
  "attestation": {
    "type": "offchain-unsigned",
    "schema": "0x...",
    "summaryHash": "sha256:..."
  }
}
```

### Additional Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/agent` | Agent capabilities and schema documentation |
| `POST` | `/api/evaluate` | Direct evaluation with hypercert data |
| `GET` | `/api/hypercerts` | List hypercerts from GraphQL API |
| `POST` | `/api/extract` | Extract schema fields from unstructured text |

---

## Scoring System

### Agent Weights

| Agent | Weight | Evaluation Criteria |
|-------|--------|---------------------|
| **Claim Verifier** | 30% | Specificity, internal consistency, verifiability |
| **Evidence Checker** | 35% | Documentation quality, attestation count, measurability |
| **Impact Scorer** | 35% | Scale, depth, duration, counterfactual impact |

### Verdict Scale

| Score Range | Verdict |
|-------------|---------|
| 80 – 100 | **Highly Credible Impact** |
| 60 – 79 | **Credible Impact** |
| 40 – 59 | **Moderate Evidence** |
| 20 – 39 | **Weak Evidence** |
| 0 – 19 | **Insufficient Evidence** |

---

## EAS Attestation

Every evaluation generates an Ethereum Attestation Service compatible record:

```json
{
  "success": true,
  "type": "offchain-unsigned",
  "schema": "0x...",
  "attester": "0x0000000000000000000000000000000000000000",
  "attestation": {
    "hypercertId": "10-0x822f17a9...-123456",
    "overallScore": 78,
    "verdict": "credible",
    "summaryHash": "sha256:a1b2c3d4..."
  }
}
```

---

## License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built for the [Hypercerts](https://hypercerts.org) ecosystem**

</div>
