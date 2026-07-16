# start-dev.ps1
# ============================================================
#  ProcureTrack Enterprise — Local Development Runner
#  This script starts both the FastAPI backend and Next.js frontend
# ============================================================

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host " Starting ProcureTrack Enterprise Dev Stack" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

# 1. Start Python FastAPI Backend (Opens in a separate window)
Write-Host "[1/2] Launching Python FastAPI Backend on http://127.0.0.1:8000..." -ForegroundColor Yellow
Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-Command", "Write-Host 'Starting FastAPI Backend...' -ForegroundColor Green; cd backend; ..\venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

# 2. Start Next.js Frontend (Runs in current window)
Write-Host "[2/2] Launching Next.js Frontend on http://localhost:3000..." -ForegroundColor Yellow
npm run dev
