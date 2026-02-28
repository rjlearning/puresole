#!/usr/bin/env python3
"""
Startup script for PureSoul ML Service
This handles the Python path setup for proper module imports
"""
import sys
import os
from pathlib import Path

# Add the ml-service directory to Python path
ml_service_dir = Path(__file__).parent
sys.path.insert(0, str(ml_service_dir))

# Now we can import and run the app
if __name__ == "__main__":
    import uvicorn
    from app.config import config

    port = config.ML_SERVICE_PORT
    host = config.ML_SERVICE_HOST

    print(f"Starting ML Service on {host}:{port}")
    print(f"OpenAI API Key configured: {bool(config.OPENAI_API_KEY)}")

    # Use import string for reload to work properly
    uvicorn.run(
        "app.main:app",  # Import string instead of app object
        host=host,
        port=port,
        reload=True,
        log_level="info"
    )
