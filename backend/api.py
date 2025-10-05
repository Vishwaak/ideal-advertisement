from fastapi import FastAPI
from pydantic import BaseModel
from fastapi import UploadFile, File
from typing import List
from main import Context_engine

app = FastAPI()

context_engine = Context_engine()


# Define a response model
class OutputData(BaseModel):
    result: dict


@app.post("/ad_placement", response_model=OutputData)
async def upload_video(file: UploadFile = File(None), video_id: str = "" , analysis_type: str = "emotion"):
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
        if analysis_type == "emotion":
            prompt = "chapterize the video for emotion timeline and time stamp it based on the video"
        elif analysis_type == "scene":
            prompt = "What are the key frame timestamps of the video?"
        else:
            prompt = "chapterize the video for emotion timeline and time stamp it based on the video"
            
        result = context_engine.call_pegasus(
            video_id,
            "chapterize the video for emotion timeline and time stamp it based on the video",
        )
        return {"result": {"data": result}}

    else:
        return {"result": "No file or video_id provided. Either provide one of them"}


@app.get("/")
async def root():
    return {"message": "Welcome to advertisment placement API"}
