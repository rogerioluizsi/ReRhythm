from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine
from app.models import Base  # Import Base from models to ensure all models are registered
from app.routers import auth, llm, wearable, journaling, counseling, library

# Create database tables (checkfirst=True is default, but explicit for clarity)
# This safely handles the case where tables already exist
Base.metadata.create_all(bind=engine, checkfirst=True)

# Initialize FastAPI app
app = FastAPI(
    title="Dora Project API",
    description="Backend API for the Dora mental health intervention app",
    version="1.0.0"
)

# Configure CORS
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://rerhythm.app",
    "https://www.rerhythm.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(llm.router)
app.include_router(wearable.router)
app.include_router(journaling.router)
app.include_router(counseling.router)
app.include_router(library.router)


@app.get("/")
def root():
    return {"message": "Dora Project API is running"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}
