from __future__ import annotations

from dataclasses import dataclass

import psutil


@dataclass(frozen=True)
class Sample:
    cpu_percent: float
    mem_percent: float
    disk_percent: float


def collect_sample() -> Sample:
    # cpu_percent(None) uses a cached interval; call with interval=0 for non-blocking
    cpu = float(psutil.cpu_percent(interval=0))
    mem = float(psutil.virtual_memory().percent)
    # On Windows "/" works in most cases with psutil, but be defensive.
    try:
        disk = float(psutil.disk_usage("/").percent)
    except Exception:
        disk = float(psutil.disk_usage(psutil.disk_partitions(all=False)[0].mountpoint).percent)
    return Sample(cpu_percent=cpu, mem_percent=mem, disk_percent=disk)

