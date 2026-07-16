from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import cases, suppliers, quotations, risk

app = FastAPI(title="ProcureTrack Enterprise API", version="1.0.0")

# Enable CORS for Next.js app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(cases.router, prefix="/api")
app.include_router(suppliers.router, prefix="/api")
app.include_router(quotations.router, prefix="/api")
app.include_router(risk.router, prefix="/api")

@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "ProcureTrack Enterprise API"}
