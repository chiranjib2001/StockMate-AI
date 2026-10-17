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

# Register routes
app.include_router(products.router, prefix=settings.API_PREFIX)
app.include_router(movements.router, prefix=settings.API_PREFIX)
app.include_router(analytics.router, prefix=settings.API_PREFIX)
app.include_router(ai.router, prefix=settings.API_PREFIX)

@app.get("/")
async def root():
    return {
        "status": "online",
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "database": "MongoDB" if db.is_mongodb_connected else "Local Engine (JSON)",
        "ai_model": settings.GEMMA_MODEL,
        "docs_url": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
