import os
import json
import tempfile
from typing import Optional, Dict, Any
from fastapi import FastAPI, File, UploadFile, Form, HTTPException, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from persona_analyzer import PersonaAnalyzer

# Load environment variables from a .env file
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="Ideal Advertisement Persona Analysis API",
    description="Analyze video content from different persona perspectives using TwelveLabs AI",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize persona analyzer
twelve_API = os.getenv("TWELVELABS_API_KEY")
if not twelve_API:
    twelve_API = "tlk_1DK4XGE3Z8EJTT231YZHB09ZR6G3"  # Use directly for testing

persona_analyzer = PersonaAnalyzer(twelve_API)

# Allowed video/audio file extensions
ALLOWED_EXTENSIONS = {'mp4', 'avi', 'mov', 'mkv', 'webm', 'flv', 'wmv', 'mp3', 'wav', 'm4a', 'aac'}

def allowed_file(filename: str) -> bool:
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.get("/")
async def home():
    """Home endpoint with API information"""
    return {
        "message": "Ideal Advertisement Persona Analysis API",
        "version": "1.0.0",
        "docs": "/docs",
        "endpoints": {
            "/": "API information",
            "/analyze": "POST - Analyze video for all personas",
            "/personas": "GET - List available personas",
            "/health": "GET - Health check",
            "/analyze-persona/{persona_name}": "POST - Analyze for specific persona"
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "personas_loaded": len(persona_analyzer.personas),
        "api_configured": bool(twelve_API),
        "index_id": persona_analyzer.index_id
    }

@app.get("/personas")
async def get_personas():
    """Get list of available personas"""
    return {
        "personas": [
            {
                "name": persona["name"],
                "category": persona["category"],
                "motto": persona["motto"],
                "summary": persona["summary"]
            }
            for persona in persona_analyzer.personas
        ]
    }

@app.post("/analyze-video-id")
async def analyze_video_by_id(data: Dict[str, Any]):
    """Analyze existing video by ID for all personas"""
    try:
        video_id = data.get("video_id")
        if not video_id:
            raise HTTPException(status_code=400, detail="video_id is required")
        
        # Analyze for all personas
        results = persona_analyzer.analyze_video_for_all_personas(video_id)
        
        return results
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze")
async def analyze_video(
    video: UploadFile = File(..., description="Video or audio file to analyze"),
    transcript: Optional[UploadFile] = File(None, description="Optional transcript file"),
    metadata: Optional[str] = Form(None, description="Optional JSON metadata")
):
    """Analyze uploaded video/audio for all personas"""
    try:
        # Validate video file
        if not video.filename:
            raise HTTPException(status_code=400, detail="No video/audio file selected")
        
        if not allowed_file(video.filename):
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid file type. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
            )
        
        # Parse metadata if provided
        parsed_metadata = None
        if metadata:
            try:
                parsed_metadata = json.loads(metadata)
            except json.JSONDecodeError:
                raise HTTPException(status_code=400, detail="Invalid JSON in metadata field")
        
        # Create temporary files
        with tempfile.NamedTemporaryFile(delete=False, suffix=f".{video.filename.split('.')[-1]}") as video_temp:
            # Save video file
            content = await video.read()
            video_temp.write(content)
            video_path = video_temp.name
        
        transcript_path = None
        if transcript and transcript.filename:
            with tempfile.NamedTemporaryFile(delete=False, suffix=f".{transcript.filename.split('.')[-1]}") as transcript_temp:
                transcript_content = await transcript.read()
                transcript_temp.write(transcript_content)
                transcript_path = transcript_temp.name
        
        try:
            # Perform analysis
            results = persona_engine.analyze_video_for_all_personas(
                video_path, 
                transcript_path, 
                parsed_metadata
            )
            return results
        finally:
            # Clean up temporary files
            try:
                os.unlink(video_path)
                if transcript_path and os.path.exists(transcript_path):
                    os.unlink(transcript_path)
            except OSError:
                pass  # Ignore cleanup errors
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/analyze-persona/{persona_name}")
async def analyze_for_specific_persona(
    persona_name: str,
    video: UploadFile = File(..., description="Video file to analyze")
):
    """Analyze video for a specific persona"""
    try:
        # Find the persona
        persona = None
        for p in persona_engine.personas:
            if p['name'].lower().replace(' ', '_') == persona_name.lower():
                persona = p
                break
        
        if not persona:
            raise HTTPException(status_code=404, detail=f"Persona '{persona_name}' not found")
        
        # Validate video file
        if not video.filename:
            raise HTTPException(status_code=400, detail="No video/audio file selected")
        
        if not allowed_file(video.filename):
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid file type. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
            )
        
        # Create temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=f".{video.filename.split('.')[-1]}") as video_temp:
            content = await video.read()
            video_temp.write(content)
            video_path = video_temp.name
        
        try:
            # Setup index and upload video
            if not persona_engine.index_id:
                persona_engine.setup_index()
            
            video_id = persona_engine.upload_and_process_video(video_path)
            
            # Analyze for specific persona
            results = persona_engine.analyze_for_persona(persona, video_id)
            return results
        finally:
            # Clean up uploaded file
            try:
                os.unlink(video_path)
            except OSError:
                pass  # Ignore cleanup errors
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == '__main__':
    import uvicorn
    
    print("Starting Ideal Advertisement Persona Analysis API...")
    print(f"Loaded {len(persona_analyzer.personas)} personas")
    print(f"Using index: {persona_analyzer.index_id}")
    print("Available personas:")
    for persona in persona_analyzer.personas:
        print(f"  - {persona['name']} ({persona['category']})")
    
    print("\nStarting FastAPI server...")
    print("API Documentation available at: http://localhost:8000/docs")
    print("Alternative docs at: http://localhost:8000/redoc")
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )

    