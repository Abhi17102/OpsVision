from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db
from app.models.metric import Metric
from app.schemas.metric import CollectResponse, MetricOut
from app.services.collector import collect_sample


router = APIRouter(prefix="/api/metrics", tags=["metrics"])


def _alerts_for(metric: Metric) -> list[str]:
    alerts: list[str] = []
    if metric.cpu_percent >= settings.metrics_alert_cpu:
        alerts.append(f"CPU usage high: {metric.cpu_percent:.1f}% (>= {settings.metrics_alert_cpu:.0f}%)")
    if metric.mem_percent >= settings.metrics_alert_mem:
        alerts.append(f"Memory usage high: {metric.mem_percent:.1f}% (>= {settings.metrics_alert_mem:.0f}%)")
    if metric.disk_percent >= settings.metrics_alert_disk:
        alerts.append(f"Disk usage high: {metric.disk_percent:.1f}% (>= {settings.metrics_alert_disk:.0f}%)")
    return alerts


@router.post("/collect", response_model=CollectResponse)
def collect_and_store(db: Session = Depends(get_db)):
    sample = collect_sample()
    metric = Metric(
        timestamp=datetime.now(timezone.utc),
        cpu_percent=sample.cpu_percent,
        mem_percent=sample.mem_percent,
        disk_percent=sample.disk_percent,
    )
    db.add(metric)
    db.commit()
    db.refresh(metric)
    return CollectResponse(metric=metric, alerts=_alerts_for(metric))


@router.get("", response_model=list[MetricOut])
def list_metrics(
    limit: int = Query(200, ge=1, le=5000),
    db: Session = Depends(get_db),
):
    # Return oldest->newest for charting stability.
    rows = db.execute(select(Metric).order_by(Metric.timestamp.desc()).limit(limit)).scalars().all()
    return list(reversed(rows))


@router.get("/latest", response_model=MetricOut | None)
def latest_metric(db: Session = Depends(get_db)):
    row = db.execute(select(Metric).order_by(Metric.timestamp.desc()).limit(1)).scalars().first()
    return row

