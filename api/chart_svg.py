"""FastAPI endpoint for SVG chart rendering."""

from __future__ import annotations

from typing import Dict, Optional

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import Response
from pydantic import BaseModel

from astro.chart_svg import generate_chart_svg

router = APIRouter(prefix="/api", tags=["chart"])


class ChartSVGRequest(BaseModel):
    natal_chart: Dict
    aspects: Optional[list] = None
    config: Optional[Dict] = None


@router.get("/chart-svg")
async def get_chart_svg(
    natal_chart: str = Query(..., description="JSON string of natal chart data"),
    aspects: Optional[str] = Query(None, description="JSON string of aspects"),
    style: str = Query("traditional", description="Chart style: traditional or modern"),
    size: int = Query(600, description="Chart size in pixels"),
):
    """Generate SVG chart wheel."""
    import json

    try:
        chart_data = json.loads(natal_chart)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid natal_chart JSON")

    aspects_data = None
    if aspects:
        try:
            aspects_data = json.loads(aspects)
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid aspects JSON")

    config = {
        "style": style,
        "size": size,
    }

    try:
        svg_content = generate_chart_svg(chart_data, aspects_data, config)
    except Exception as e:
        import traceback
        raise HTTPException(status_code=500, detail=f"500: {str(e)}\n{traceback.format_exc()}")

    return Response(content=svg_content, media_type="image/svg+xml")


@router.post("/chart-svg")
async def post_chart_svg(request: ChartSVGRequest):
    """Generate SVG chart wheel from POST request."""
    svg_content = generate_chart_svg(
        request.natal_chart, request.aspects, request.config
    )

    return Response(content=svg_content, media_type="image/svg+xml")


