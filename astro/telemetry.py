"""Simple telemetry collector for request and cache metrics."""

from __future__ import annotations

from threading import Lock


class Telemetry:
    def __init__(self) -> None:
        self._lock = Lock()
        self.request_count = 0
        self.error_count = 0
        self.total_latency = 0.0
        self.cache_hits = 0
        self.cache_misses = 0

    def record_request(self) -> None:
        with self._lock:
            self.request_count += 1

    def record_error(self) -> None:
        with self._lock:
            self.error_count += 1

    def record_latency(self, seconds: float) -> None:
        with self._lock:
            self.total_latency += seconds

    def record_cache_hit(self) -> None:
        with self._lock:
            self.cache_hits += 1

    def record_cache_miss(self) -> None:
        with self._lock:
            self.cache_misses += 1

    def snapshot(self) -> dict:
        with self._lock:
            avg_latency = (
                self.total_latency / self.request_count if self.request_count else 0.0
            )
            return {
                "requests": self.request_count,
                "errors": self.error_count,
                "average_latency_seconds": round(avg_latency, 4),
                "cache_hits": self.cache_hits,
                "cache_misses": self.cache_misses,
            }


telemetry = Telemetry()
