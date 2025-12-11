"""Vercel entrypoint that exposes the FastAPI app."""

from main import app

# Vercel's Python runtime looks for an ASGI callable named `app`.
__all__ = ["app"]
