from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.db.base import Base
from app.db.session import engine
from app.models import Metric  # noqa: F401  (ensures model is registered)
from app.routes.metrics import router as metrics_router
from sqlalchemy.exc import OperationalError


def create_app() -> FastAPI:
    app = FastAPI(title="OpsVision", version="1.0.0")

    # Create tables (MVP convenience) on startup so importing the app doesn't require DB connectivity.
    @app.on_event("startup")
    def _init_db() -> None:
        try:
            Base.metadata.create_all(bind=engine)
        except OperationalError as e:
            # Don't hard-fail app startup on DB connection/auth errors (UI can still show "offline").
            # You can fix DB credentials and restart the server.
            print(f"[OpsVision] DB init skipped: {e}")

    cors_origins = [o.strip() for o in settings.cors_origins.split(",")] if settings.cors_origins else ["*"]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins if cors_origins != ["*"] else ["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(metrics_router)

    frontend_dir = Path(__file__).resolve().parent.parent / "frontend"
    assets_dir = frontend_dir / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

    @app.get("/", include_in_schema=False)
    def landing():
        return FileResponse(str(frontend_dir / "index.html"))

    @app.get("/dashboard", include_in_schema=False)
    def dashboard():
        return FileResponse(str(frontend_dir / "dashboard.html"))

    return app


app = create_app()

