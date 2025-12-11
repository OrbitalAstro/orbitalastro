"""Shared Pydantic schemas for API endpoints."""

from typing import List, Optional
from pydantic import BaseModel, Field


class NarrativeConfig(BaseModel):
    """Narrative configuration for interpretation generation."""
    tone: Optional[str] = Field("mythic", description="Narrative tone: mythic, psychological, coaching, cinematic, soft_therapeutic")
    depth: Optional[str] = Field("standard", description="Narrative depth: short, standard, comprehensive")
    focus: Optional[List[str]] = Field([], description="Focus areas: e.g., ['career', 'relationships', 'family']")










