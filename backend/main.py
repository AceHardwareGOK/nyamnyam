from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from limiter import limiter
from routes import recipe_routes
from logging_config import setup_logging
import os
import logging

setup_logging()
logger = logging.getLogger(__name__)

app = FastAPI(title="NyamNyam Recipe API")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Configure CORS
origins = [
    "http://localhost:5173", # Vite default
    "http://127.0.0.1:5173",
]


# Read CORS origins from env if available
env_origins = os.getenv("CORS_ORIGINS")
if env_origins:
    origins.extend(env_origins.split(","))

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(recipe_routes.router, prefix="/api")

@app.get("/")
def read_root():
    return {"status": "ok", "message": "NyamNyam API is running"}
