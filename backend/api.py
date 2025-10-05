from fastapi import FastAPI
from pydantic import BaseModel
from fastapi import UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from main import Context_engine
import uuid
import time
import os

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # Frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

context_engine = Context_engine()


# Define response models
class OutputData(BaseModel):
    result: dict

class VideoSegment(BaseModel):
    id: str
    start: float
    end: float
    duration: float
    description: str
    type: str

class AdSegment(BaseModel):
    id: str
    adData: dict
    duration: float
    description: str
    confidence: Optional[float]
    type: str

class SequenceItem(BaseModel):
    id: str
    order: int
    type: str
    startTime: float
    endTime: float

class StitchingRequest(BaseModel):
    mainVideo: dict
    adSegments: List[AdSegment]
    sequence: List[SequenceItem]
    metadata: dict

class StitchingResponse(BaseModel):
    success: bool
    stitchedVideoId: str
    stitchedVideoUrl: str
    sequence: List[dict]
    metadata: dict
    processingResults: dict


@app.post("/ad_placement", response_model=OutputData)
async def upload_video(file: UploadFile = File(None), video_id: str = ""):
    # Mock function to simulate video processing
    def process_video(file: UploadFile) -> List[dict]:
        # Replace this with actual video processing logic
        video_id = context_engine.upload_vid(file.file)
        result = context_engine.call_pegasus(
            video_id,
            "chapterize the video for emotion timeline and time stamp it based on the video",
        )

        return result

    if file:
        # Process the uploaded video file
        result = process_video(file)

        return {"result": result}
    
    elif video_id:
        return {
            "result": {
            "segments": [
                {"start_time": 0, "end_time": 3, "description": "hits a goal"},
                {"start_time": 3, "end_time": 4, "description": "goal celebration"},
                {"start_time": 4, "end_time": 8, "description": "celebration"}
            ]
            }
        }
        return {"result": {"data": 'lololo'}}
        result = context_engine.call_pegasus(
            video_id,
            "chapterize the video for emotion timeline and time stamp it based on the video",
        )
        return {"result": {"data": result}}

    else:
        return {"result": "No file or video_id provided. Either provide one of them"}

@app.post("/get_file_ad", response_model=OutputData)
async def get_file_ad(file: UploadFile = File(...)):
    def process_ad(file: UploadFile) -> List[dict]:
        print(UploadFile)
        ad_id = context_engine.upload_ad(file.file)
        return {"ad_id": ad_id}

    result = process_ad(file)
    return {"result": result}

@app.post("/create-stitched-video", response_model=StitchingResponse)
async def create_stitched_video(request: StitchingRequest):
    """
    Create a stitched video from main video segments and ad segments
    """
    try:
        start_time = time.time()
        
        # Generate unique video ID
        stitched_video_id = f"stitched_{int(time.time())}_{str(uuid.uuid4())[:8]}"
        
        print(f"=== STITCHING REQUEST RECEIVED ===")
        print(f"Creating stitched video: {stitched_video_id}")
        print(f"Main video: {request.mainVideo.get('url', 'No URL')}")
        print(f"Ad segments: {len(request.adSegments)}")
        print(f"Sequence items: {len(request.sequence)}")
        print(f"Metadata: {request.metadata}")
        
        # Debug: Print sequence details
        for i, seq in enumerate(request.sequence):
            print(f"  Sequence {i}: {seq.id} ({seq.type}) - {seq.startTime}s to {seq.endTime}s")
        
        # Validate input data
        if not request.mainVideo or not request.sequence:
            return StitchingResponse(
                success=False,
                stitchedVideoId="",
                stitchedVideoUrl="",
                sequence=[],
                metadata={},
                processingResults={}
            )
        
        # Process the stitching logic
        processed_sequence = []
        total_duration = 0
        
        for i, seq_item in enumerate(request.sequence):
            # Calculate actual timing for each segment
            start_time_seg = total_duration
            end_time_seg = start_time_seg + (seq_item.endTime - seq_item.startTime)
            
            processed_item = {
                "id": seq_item.id,
                "order": i,
                "type": seq_item.type,
                "startTime": start_time_seg,
                "endTime": end_time_seg,
                "duration": end_time_seg - start_time_seg,
                "processed": True
            }
            
            processed_sequence.append(processed_item)
            total_duration = end_time_seg
        
        # Simulate video processing time
        processing_time = time.time() - start_time
        
        # Create stitched video URL (in production, this would be the actual processed video)
        stitched_video_url = request.mainVideo.get('url', '')
        
        # Prepare processing results
        processing_results = {
            "videoSegments": len([s for s in request.sequence if s.type == 'video']),
            "adSegments": len([s for s in request.sequence if s.type == 'ad']),
            "transitions": len(request.sequence) - 1,
            "quality": "1080p",
            "format": "mp4",
            "codec": "h264",
            "totalDuration": total_duration,
            "processingTime": f"{processing_time:.2f}s"
        }
        
        # Update metadata
        updated_metadata = {
            **request.metadata,
            "totalDuration": total_duration,
            "processingTime": f"{processing_time:.2f}s",
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S.000Z", time.gmtime()),
            "stitchedVideoId": stitched_video_id
        }
        
        print(f"Stitched video created successfully: {stitched_video_id}")
        print(f"Total duration: {total_duration:.2f}s")
        print(f"Processing time: {processing_time:.2f}s")
        
        return StitchingResponse(
            success=True,
            stitchedVideoId=stitched_video_id,
            stitchedVideoUrl=stitched_video_url,
            sequence=processed_sequence,
            metadata=updated_metadata,
            processingResults=processing_results
        )
        
    except Exception as e:
        print(f"Error creating stitched video: {str(e)}")
        return StitchingResponse(
            success=False,
            stitchedVideoId="",
            stitchedVideoUrl="",
            sequence=[],
            metadata={"error": str(e)},
            processingResults={}
        )

@app.get("/")
async def root():
    return {"message": "Welcome to the FastAPI model API!"}

@app.get("/test-stitching")
async def test_stitching():
    """Test endpoint to verify stitching API is working"""
    return {
        "message": "Stitching API is working!",
        "endpoint": "/create-stitched-video",
        "method": "POST",
        "status": "ready"
    }
