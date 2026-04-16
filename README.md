# OpsVision – Intelligent System Monitoring, Prediction & Automation Platform (MVP)

OpsVision is a lightweight system monitoring dashboard that collects CPU/memory/disk metrics from the host, stores them in PostgreSQL, and visualizes them in a real-time Chart.js dashboard with basic threshold alerts.

## Project structure

- `app/`: FastAPI backend (REST API, DB models, services)
- `frontend/`: HTML/CSS/JS frontend (landing + dashboard)

## Prerequisites

- Python 3.10+
- PostgreSQL 13+

## Configure environment

### Option A (recommended): use a local `.env` file

Create a file at `E:\OpsVision\.env` (this repo ignores it via `.gitignore`) with:

```env
DATABASE_URL=postgresql+psycopg2://postgres:abhi1710@localhost:5432/opsvision
CORS_ORIGINS=*
METRICS_ALERT_CPU=85
METRICS_ALERT_MEM=85
METRICS_ALERT_DISK=90
```

Then just run the server (it will load `.env` automatically).

### Option B: set environment variables in PowerShell

Set `DATABASE_URL`, e.g.:

- Windows PowerShell:

```powershell
$env:DATABASE_URL="postgresql+psycopg2://postgres:postgres@localhost:5432/opsvision"
```

Optional:

- `CORS_ORIGINS` (comma-separated), default `*`
- `METRICS_ALERT_CPU`, `METRICS_ALERT_MEM`, `METRICS_ALERT_DISK` (defaults: 85, 85, 90)

## Create database

Create a DB named `opsvision` (or match your `DATABASE_URL`).

## Install & run (dev)

```powershell
Set-Location E:\OpsVision
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Then open:

- Backend docs: `http://127.0.0.1:8000/docs`
- UI landing page: `http://127.0.0.1:8000/`
- Dashboard: `http://127.0.0.1:8000/dashboard`

## API overview

- `POST /api/metrics/collect`: Collect current CPU/mem/disk and store in DB.
- `GET /api/metrics?limit=200`: Return recent metrics (newest last) for charting.
- `GET /api/metrics/latest`: Return the most recent metric point.

## Notes

- The DB table is auto-created on startup for the MVP.
- The dashboard auto-collects new samples by calling `POST /api/metrics/collect` and then refreshes charts.

