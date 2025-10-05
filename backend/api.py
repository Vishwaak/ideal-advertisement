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

@app.get("/")
async def root():
    return {"message": "Welcome to the FastAPI model API!"}
