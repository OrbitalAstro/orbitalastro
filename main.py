"""Application entry point for Vercel / FastAPI deployments."""

from api.chart_svg import router as chart_svg_router
from api.natal import app
from api.progressions import router as progressions_router
from api.rectification import router as rectification_router
from api.solar_returns import router as solar_returns_router
from api.transits import router as transits_router
from api.ai import router as ai_router
from dotenv import load_dotenv
import os

# Load environment variables from .env file
load_dotenv()

# Include all routers
app.include_router(transits_router)
app.include_router(ai_router)
app.include_router(progressions_router)
app.include_router(solar_returns_router)
app.include_router(rectification_router)
app.include_router(chart_svg_router)

if __name__ == "__main__":
    import uvicorn
    # Use PORT env var if set (for Fly.io), otherwise default to 8000 for local dev
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
