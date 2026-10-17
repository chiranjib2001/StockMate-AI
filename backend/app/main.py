from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.database import db
from app.api.routes import products, movements, analytics, ai

@asynccontextmanager
async def lifespan(app: FastAPI):
    print(f"[*] Starting {settings.PROJECT_NAME} v{settings.VERSION}...")
    await db.connect()
    yield
    print("[*] Shutting down StockMate AI...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="AI-powered, privacy-first inventory assistant for small businesses powered by Gemma 2 and MongoDB.",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes under canonical /api prefix and root fallback
for pfx in [settings.API_PREFIX, ""]:
    app.include_router(products.router, prefix=pfx)
    app.include_router(movements.router, prefix=pfx)
    app.include_router(analytics.router, prefix=pfx)
    app.include_router(ai.router, prefix=pfx)

def get_health_data():
    if settings.GROQ_API_KEY or (settings.GEMMA_API_KEY and settings.GEMMA_API_KEY.startswith("gsk_")):
        ai_info = "Google Gemma 2:9B (Groq Cloud)"
    elif settings.OPENROUTER_API_KEY:
        ai_info = "Google Gemma 2:9B (OpenRouter Cloud)"
    else:
        ai_info = f"Google {settings.GEMMA_MODEL} (Local Ollama)"

    return {
        "status": "online",
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "database": "MongoDB Atlas" if db.is_mongodb_connected else "Local Engine (JSON)",
        "ai_model": ai_info,
        "docs_url": "/docs"
    }

@app.get("/")
async def root():
    return get_health_data()

@app.get("/api/health")
async def health():
    return get_health_data()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
