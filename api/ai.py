import os
import logging
import requests
from typing import Optional
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

# Configure logger
logger = logging.getLogger("orbitalastro")

router = APIRouter(prefix="/ai", tags=["ai"])

class InterpretationRequest(BaseModel):
    prompt: str
    system_instruction: Optional[str] = None
    temperature: Optional[float] = 0.7
    max_output_tokens: Optional[int] = None

class InterpretationResponse(BaseModel):
    content: str

def _normalize_referer(value: str) -> str:
    value = (value or "").strip()
    if not value:
        return value

    # If someone pastes an allowlist pattern like "https://example.com/*",
    # normalize it to a valid Referer value.
    if value.endswith("/*"):
        value = value[:-1]

    if value.endswith("*"):
        value = value[:-1]

    # Common referrer allowlist patterns include a trailing slash; add one when absent.
    if (value.startswith("http://") or value.startswith("https://")) and not value.endswith("/"):
        value = f"{value}/"

    return value

@router.post("/interpret", response_model=InterpretationResponse)
async def generate_interpretation(req: Request, request: InterpretationRequest):
    """
    Generate an astrological interpretation using Google's Gemini API.
    The API key is securely stored in the backend environment variables.
    """
    api_key = os.environ.get("GEMINI_API_KEY")
    
    if not api_key:
        logger.error("GEMINI_API_KEY environment variable is not set")
        raise HTTPException(
            status_code=500, 
            detail="Server configuration error: AI service not configured"
        )
    
    # Models to try in order of preference
    models = ["gemini-2.5-flash", "gemini-flash-latest", "gemini-pro"]
    
    last_error = None
    
    # If the user restricted their key by HTTP referrers, Gemini may require a Referer header.
    # Prefer a fixed server-side referer (GEMINI_REFERER) to avoid mirroring untrusted browser headers.
    #
    # Note: browsers send Origin like "https://example.com" (no trailing slash) while
    # Google API key referrer patterns are often configured as "https://example.com/*".
    # Add a trailing slash when we use Origin so it matches common patterns.
    referer: Optional[str] = None

    configured_referer = os.environ.get("GEMINI_REFERER")
    if configured_referer:
        referer = _normalize_referer(configured_referer)
    else:
        origin = req.headers.get("origin")
        referer_header = req.headers.get("referer")
        if origin:
            referer = _normalize_referer(origin)
        elif referer_header:
            referer = referer_header.strip()

    # Sensible defaults: long-form interpretations easily exceed 2k tokens.
    # Keep a ceiling to avoid excessively large responses.
    max_output_tokens = request.max_output_tokens or 8192
    max_output_tokens = max(256, min(int(max_output_tokens), 8192))

    temperature = request.temperature if request.temperature is not None else 0.7

    for model in models:
        try:
            return _call_gemini_api(
                api_key=api_key,
                model=model,
                prompt=request.prompt,
                system_instruction=request.system_instruction,
                referer=referer,
                temperature=float(temperature),
                max_output_tokens=max_output_tokens,
            )
        except Exception as e:
            logger.warning(f"Failed to call Gemini model {model}: {str(e)}")
            last_error = e
            continue
            
    # If all models fail
    logger.error(f"All Gemini models failed. Last error: {last_error}")
    raise HTTPException(
        status_code=503,
        detail=f"AI service currently unavailable: {str(last_error)}"
    )

def _call_gemini_api(
    api_key: str,
    model: str,
    prompt: str,
    system_instruction: Optional[str] = None,
    referer: Optional[str] = None,
    temperature: float = 0.7,
    max_output_tokens: int = 8192,
) -> InterpretationResponse:
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
    
    headers = {
        "Content-Type": "application/json",
    }

    if referer:
        headers["Referer"] = referer
    
    payload = {
        "contents": [
            {
                "parts": [
                    {"text": prompt}
                ]
            }
        ],
        "generationConfig": {
            "temperature": temperature,
            "maxOutputTokens": max_output_tokens,
        }
    }
    
    if system_instruction:
        payload["systemInstruction"] = {
            "parts": [
                {"text": system_instruction}
            ]
        }
        
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=30)
        
        # Handle specific HTTP errors
        if response.status_code == 429:
            raise Exception("Quota exceeded")
        
        if response.status_code != 200:
            error_data = response.json() if response.content else {}
            error_msg = error_data.get('error', {}).get('message', response.text)

            if response.status_code == 403 and isinstance(error_msg, str):
                lower = error_msg.lower()
                if "referer" in lower and "blocked" in lower:
                    error_msg = (
                        f"{error_msg} — Votre clé Gemini est probablement restreinte par 'HTTP referrers'. "
                        "Ajoutez ces valeurs dans la liste autorisée (exemples): "
                        "https://www.orbitalastro.ca/*, https://orbitalastro.ca/*, http://localhost:3000/* "
                        "ou retirez la restriction pour un usage serveur."
                    )
            raise Exception(f"API Error {response.status_code}: {error_msg}")
            
        data = response.json()
        
        # Extract text content
        if "candidates" in data and data["candidates"]:
            candidate = data["candidates"][0]
            if "content" in candidate and "parts" in candidate["content"]:
                text = candidate["content"]["parts"][0]["text"]
                return InterpretationResponse(content=text)
                
        # Handle safety blocks or empty responses
        if "promptFeedback" in data:
            block_reason = data["promptFeedback"].get("blockReason")
            if block_reason:
                raise Exception(f"Response blocked by safety filters: {block_reason}")
                
        raise Exception("Empty response from AI model")
        
    except requests.exceptions.Timeout:
        raise Exception("Request timed out")
    except requests.exceptions.ConnectionError:
        raise Exception("Connection failed")
