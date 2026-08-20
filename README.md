# Resume Screener

A production-quality, LLM-powered resume screening application.

## Features

- Upload one Job Description and multiple resumes (PDF, DOCX).
- Extract text safely without sending raw binary to the LLM.
- Evaluate each candidate independently using a configurable prompt template.
- Consolidate results into a structured hiring report.
- Export reports as Markdown and professional PDF.
- Clean REST API and a modern web interface.

## Installation

```bash
npm install
```

## Configuration

Copy `.env.example` to `.env` and set at minimum:

```env
LLM_PROVIDER=openai
LLM_API_KEY=sk-...
LLM_MODEL=gpt-4o-mini
```

See `.env.example` for all options.

## Running Locally

Development (backend + frontend):

```bash
npm run dev
```

Backend only:

```bash
npm run dev:server
```

Production build and start:

```bash
npm run build
npm start
```

The web UI is available at `http://localhost:5173` in development and `http://localhost:3000` in production.

## Uploading Documents

1. Open the web UI.
2. Drop or select the Job Description (one PDF or DOCX).
3. Drop or select candidate resumes (multiple PDF or DOCX).
4. Select an evaluation template.
5. Click **Analyze Candidates**.

## Running an Evaluation

Use the web UI or `POST /api/evaluations` with form data:

- `jobDescription` (file)
- `resumes` (files)
- `templateId` (string)
- `jobTitle` (string, optional)

Poll `GET /api/evaluations/:id` for status. Download the report from `GET /api/evaluations/:id/report?format=markdown|pdf`.

## Adding Evaluation Templates

1. Create a prompt file in `prompts/`.
2. Add an entry to `src/prompts/templates.json`.
3. Restart the server.

## Changing the Evaluation Prompt

Edit `prompts/candidate-evaluation.md` (or any template file). The application loads the file at runtime; no TypeScript changes are required.

## Configuring the LLM

Set `LLM_PROVIDER`, `LLM_API_KEY`, `LLM_MODEL`, `LLM_BASE_URL`, `LLM_TEMPERATURE`, and `LLM_MAX_TOKENS` in `.env`. The LLM provider is abstracted; adding a new provider means implementing the `LLMProvider` interface in `src/llm/`.

## Generating Reports

Reports are written to `output/reports/` and are downloadable from the web UI or the `/api/evaluations/:id/report` endpoint.

## Running Tests

```bash
npm test
```

## Architecture

- `src/extraction/` — PDF and DOCX text extraction.
- `src/prompts/` — Template and prompt loading.
- `src/llm/` — LLM provider abstraction.
- `src/schemas/` — Zod schemas for structured output.
- `src/evaluation/` — Per-candidate evaluation and consolidation.
- `src/reports/` — Markdown and PDF report generation.
- `src/storage/` — Filesystem storage (swappable for PostgreSQL).
- `src/server/` — Express API.
- `src/client/` — React + Vite web UI.

## Bias and Safety

This tool is decision-support only. It does not make autonomous employment decisions. It does not evaluate candidates based on protected characteristics. Final hiring decisions require human review.
