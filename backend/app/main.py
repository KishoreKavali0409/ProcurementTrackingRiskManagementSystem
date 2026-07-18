from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from .routers import cases, suppliers, quotations, risk, notifications

app = FastAPI(title="ProcureTrack Enterprise API", version="1.0.0")

@app.exception_handler(RuntimeError)
async def db_not_configured_handler(request: Request, exc: RuntimeError):
    if "Database connection is not configured" in str(exc):
        return JSONResponse(
            status_code=503,
            content={"detail": str(exc)},
        )
    raise exc

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
app.include_router(notifications.router, prefix="/api")

@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "ProcureTrack Enterprise API"}
