"""
Minimal entrypoint pointing to the Flatlib API (api/index.py).

Legacy: the old file used a native Swiss Ephemeris binding. We replace it so
local runs or autodetected entrypoints use the Flatlib version without native
deps.
"""

from api.index import app  # pragma: no cover


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=10000)
