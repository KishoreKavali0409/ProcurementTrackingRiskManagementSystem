import os
from dotenv import load_dotenv
from supabase import create_client, Client

from pathlib import Path

# Resolve absolute paths to .env.local in root and backend directories
current_dir = Path(__file__).resolve().parent
project_root = current_dir.parent.parent

load_dotenv(dotenv_path=project_root / ".env.local")
load_dotenv(dotenv_path=current_dir.parent / ".env.local")
load_dotenv()

supabase_url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL") or os.environ.get("SUPABASE_URL") or ""
supabase_key = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY") or os.environ.get("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY") or os.environ.get("SUPABASE_KEY") or ""

# Resend configs
resend_api_key = os.environ.get("RESEND_API_KEY") or ""
resend_from = os.environ.get("RESEND_FROM_EMAIL") or "onboarding@resend.dev"
resend_to = os.environ.get("RESEND_TO_EMAIL") or ""

class DummyClient:
    def table(self, *args, **kwargs):
        raise RuntimeError(
            "Database connection is not configured. Please set your Supabase "
            "credentials in .env.local and restart the server."
        )

supabase = None

if not supabase_url or not supabase_key or "placeholder" in supabase_url or "placeholder" in supabase_key:
    print("==================================================================")
    print("WARNING: Supabase credentials are not configured in environment variables.")
    print("Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local")
    print("==================================================================")
    supabase = DummyClient()
else:
    try:
        supabase = create_client(supabase_url, supabase_key)
    except Exception as e:
        print("==================================================================")
        print(f"Error initializing Supabase client: {e}")
        print("Please verify the credentials in .env.local")
        print("==================================================================")
        supabase = DummyClient()


