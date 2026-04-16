from datetime import datetime

from pydantic import BaseModel, Field


class MetricOut(BaseModel):
    id: int
    timestamp: datetime
    cpu_percent: float = Field(ge=0, le=100)
    mem_percent: float = Field(ge=0, le=100)
    disk_percent: float = Field(ge=0, le=100)

    model_config = {"from_attributes": True}


class CollectResponse(BaseModel):
    metric: MetricOut
    alerts: list[str]

