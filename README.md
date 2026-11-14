# Astronaut MSK Health & Performance Monitoring System

A **fictional, demonstration-only** prototype for monitoring astronaut musculoskeletal (MSK) exercise countermeasures, physical performance and individual baseline changes.

---

## 1. Overview

The system lets a demonstration crew record baseline assessments, exercise countermeasure sessions, performance measurements and sensor data. A rule-based engine compares each astronaut only with **their own baseline** and raises insights and alerts for specialist review. Reports can be exported as CSV or PDF.

It stores everything in local JSON files. There is no external database.

## 2. Important disclaimer

- **Prototype with fictional demonstration data.** Astronaut names, IDs, missions and sensor values are invented unless a record is explicitly labelled otherwise.
- **Not a medical device.** It does not diagnose atrophy, osteoporosis, bone mineral density loss or any other condition.
- **No muscle-mass measurement.** Outputs are performance indicators (force, movement, range of motion, completion), not measurements of muscle mass.
- **Not NASA-approved.** The product is not affiliated with or endorsed by any space agency.
- **Thresholds are sample logic.** They are configurable for demonstration only and must be set by an authorised specialist before any real use.

## 3. Features

- Dashboard overview with KPIs, mission overview, adherence and performance trend charts, mission timeline, latest insights and recent alerts
- Astronaut management (search, filter, create, edit, delete for administrators, cascade delete of linked records)
- Baseline and performance assessments with validation (a measurement or functional result is required)
- Exercise countermeasures: prescribed vs completed sessions, category-to-equipment validation, adherence analytics
- Muscle performance dashboard with per-astronaut baseline comparison and percentage / points handling (invalid percentages for zero baselines are rejected)
- Sensor data: manual entry, CSV sample import and simulated stream, each record with a data-source badge
- Adaptive insights (rule engine, optional narrative layer) and alerts with review workflow and specialist notes
- Reports (8 types) with scope, KPI summary, data-source summary and notes; CSV and PDF export; print view
- Settings: profile, preferences, configurable sample thresholds, demo roles, mission management, system status, audit trail

## 4. Technology stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, JavaScript, Tailwind CSS, React Router, React Hook Form, Zod, Recharts, Lucide icons, Framer Motion, react-hot-toast, Axios |
| Backend | Node.js (ES modules), Express 4, helmet, cors, Zod, pdfkit, dotenv |
| Storage | JSON files via `fs/promises` with atomic writes and per-collection locks |
| Tests | Node built-in test runner (`node --test`) with HTTP integration tests against a local server |

## 5. Folder structure

```
astronaut-msk-monitoring-system/
├── package.json              root scripts (dev, build, test, seed, start, install:all)
├── README.md
├── .gitignore
├── .env.example
├── backend/
│   ├── package.json  package-lock.json  .env.example
│   ├── data/                 JSON collections (demo seed)
│   ├── scripts/generateDemoData.js
│   ├── src/
│   │   ├── app.js  server.js
│   │   ├── config/           env and storage configuration
│   │   ├── storage/          jsonStorage.js (atomic write, locking, corruption handling)
│   │   ├── analysis/         rule engine, metric catalogue, narrative provider
│   │   ├── sensors/adapters/ ManualEntry, SampleImport, SimulatedStream, README
│   │   ├── services/         business logic and report/export services
│   │   ├── controllers/  routes/  validators/  middleware/  utils/
│   └── tests/                calculations.test.js, api.test.js
└── frontend/
    ├── package.json  package-lock.json  vite.config.js  tailwind.config.js
    ├── index.html  public/logo/msk-logo.svg
    └── src/
        ├── App.jsx  main.jsx  styles/
        ├── pages/            Dashboard, Astronauts, AstronautDetails, and the other sections
        ├── components/       common, layout, charts, dashboard, insights, alerts, exercises,
        │                     performance, sensors, astronauts, reports
        ├── context/AppContext.jsx   role, global filters, reference data, data version
        ├── hooks/  services/  utils/
```

## 6. Prerequisites

- **Node.js 18.17 or newer** (Node 20 or 22 LTS recommended)
- npm 9 or newer
- A modern browser (Chrome, Edge, Firefox, Safari)

## 7. Installation

From the project root:

```bash
npm run install:all
```

This runs `npm install` at the root, in `backend/` and in `frontend/`. Lockfiles are included so installs are reproducible. Alternatively, install each part manually:

```bash
npm install
npm install --prefix backend
npm install --prefix frontend
```

## 8. Environment configuration

Copy the examples and adjust as needed. Nothing is required for the default demo.

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env   # optional
```

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `5000` | Backend port |
| `HOST` | `127.0.0.1` | Backend bind address (keep local for the demo) |
| `CORS_ORIGINS` | `http://localhost:5173,http://127.0.0.1:5173` | Allowed browser origins |
| `DATA_DIR` | `backend/data` | Directory for JSON collections |
| `AI_PROVIDER` | `none` | `none` or `openai` (optional narrative layer) |
| `OPENAI_API_KEY` | empty | Only used when `AI_PROVIDER=openai`. Never commit a real key |
| `OPENAI_MODEL` | `gpt-4o-mini` | Model used by the narrative layer |
| `BODY_LIMIT` | `100kb` | Maximum JSON request body size |
| `VITE_API_PROXY_TARGET` (frontend) | `http://127.0.0.1:5000` | Where the Vite dev server forwards `/api` |

## 9. Running the application

Development (backend and frontend together):

```bash
npm run seed    # optional: regenerate demo data
npm run dev
```

Production-style run:

```bash
npm run build   # builds frontend/dist
npm start       # starts the backend; serve frontend/dist with any static host or `npm run preview --prefix frontend`
```

Seed data only: `npm run seed`.

## 10. URLs and ports

| Service | URL |
|---|---|
| Frontend (dev) | http://localhost:5173 |
| Backend API | http://localhost:5000/api |
| Health check | http://localhost:5000/api/health |

## 11. Demo authentication and its limitations

The prototype does **not** have real authentication. The UI sends a role in the `x-demo-role` header (`administrator`, `medical-specialist`, `astronaut`). The backend applies a permission map to that header.

| Role | Summary |
|---|---|
| Administrator | Full access: delete astronauts, missions, thresholds, settings |
| Medical Specialist | Clinical records, baselines, alert review and notes. Cannot delete astronauts or change thresholds |
| Astronaut | Read access and self-logged exercise records. Cannot review alerts or change analysis settings |

Limitations: anyone can switch roles, the header is not signed, and there are no passwords or sessions. Do not deploy this to a network you do not control. Real use would need a proper identity provider, server-side sessions, and a security review.

## 12. JSON storage

- Each collection is a JSON file in `DATA_DIR` (for example `astronauts.json`, `performanceAssessments.json`).
- **Atomic writes:** data is written to a temporary file, flushed with `fsync`, then renamed over the original.
- **Locking:** writes to one collection are serialised in-process, so concurrent requests do not interleave.
- **Corruption handling:** if a JSON file cannot be parsed, the API returns a storage error and **does not overwrite the file**. Missing files are created with empty defaults.
- **Limits:** this is single-process storage for a demonstration. It is not suitable for production load or multiple server instances.

## 13. Demo data

`npm run seed` deterministically regenerates the demo dataset:

- Fictional missions and four fictional astronauts (labelled as demonstration records)
- Baselines, performance assessments, exercise records and sensor measurements, tagged with their data source
- Deliberate changes so that insights and alerts appear (including one persistent change for escalation)
- Three demo users (one per role), default settings and a seed audit entry
- Generated report snapshots

Seeding overwrites the JSON collections in `DATA_DIR`.

## 14. AI analysis layers

- **Layer 1 (always active): rule-based engine.** Compares each astronaut with their own baseline. Percentage change is `((current − baseline) / baseline) × 100` and is invalid when the baseline is zero. Movement consistency uses point differences. Loading changes come from sensor records. Adherence is completed prescribed sessions divided by prescribed sessions. Persistent changes escalate to critical with a specialist-review alert. Alerts use a deduplication key so re-running analysis never duplicates them. Reviewed insights are kept.
- **Layer 2 (optional): narrative text.** With `AI_PROVIDER=openai` and a key, a model rewrites explanations. The system prompt forbids diagnosis and invented numbers. If the provider is not configured or fails, rule text is shown.

Every insight is labelled `ai-generated` and `unreviewed` until a specialist reviews it. Insights describe measurement differences only and do not identify a cause.

## 15. Sensor integration and limitations

- **Manual entry** (`dataSource: manual`): through the UI or the API.
- **Sample CSV import** and **simulated stream** (`dataSource: simulated`): labelled as simulated in every view and report.
- **Live hardware adapters** (IMU, force plates, pressure insoles) are **not implemented**. The adapter interface and its README in `backend/src/sensors/adapters/` describe how one would be added.
- Units and metric types are validated against the metric catalogue. Mismatches are rejected.

## 16. Report export

Eight report types are available: exercise history, exercise adherence, muscle performance, baseline comparison, sensor measurements, adaptive insights, alerts summary and mission phase summary.

Each report stores its scope, KPIs, sections (up to 500 rows per section), data-source summary and notes. Export options:

- **CSV**: UTF-8 with BOM, one block per section
- **PDF**: generated with pdfkit, with a footer stating it is a prototype output and not a clinical document
- **Print**: browser print view of the preview

## 17. Testing

```bash
npm test                 # backend tests (20 tests: calculations, rule engine and API integration)
npm run build            # frontend production build
npm run test:all         # both
```

Backend tests cover adherence and percentage rules, zero-baseline handling, rule-engine behaviour, validation errors, role permissions, equipment and unit mismatches, CSV import provenance, alert deduplication, report export, corrupt-file handling and persistence.

## 18. Troubleshooting and known limitations

**Troubleshooting**

- *Port in use:* set `PORT` in `backend/.env` and `VITE_API_PROXY_TARGET` to match.
- *API unreachable in the browser:* make sure the backend is running on the proxied port and that `CORS_ORIGINS` includes the frontend origin.
- *Storage error (corrupt JSON):* the API refuses to overwrite the file. Inspect or restore it from a backup, or run `npm run seed` to recreate the demo data.
- *Node version errors:* use Node 18.17 or newer.
- *Charts show blank space:* the selected filters may have no stored records. Clear the filters in the top bar.

**Known limitations**

- No real authentication or authorisation (see section 11).
- No live sensor hardware. Simulated and imported data are labelled.
- JSON storage is for single-process demonstration use only.
- Thresholds are sample logic, not clinical or regulatory limits.
- Dependency audits (`npm audit`) report advisories in development tooling that are not addressed in this prototype.
- Recharts 2 emits React `defaultProps` deprecation warnings in development with React 18.3. They do not affect behaviour.
- Not validated for clinical, regulatory or operational use.
