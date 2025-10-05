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
async def upload_video(file: UploadFile = File(None), main_video_id: str = "" ):
    # Mock function to simulate video processing
    ads_id = ['68e1f22c830688fe0b91eb9b','68e1ed5d17b39f617835dd41','68e1a0e164ff05606e15297c']

    def process_video(file: UploadFile) -> List[dict]:
        # Replace this with actual video processing logic
        main_video_id = context_engine.upload_vid(file.file)
        result = context_engine.call_pegasus(
            main_video_id,
            "chapterize the video for emotion timeline and time stamp it based on the video",
        )

        return result

    if file:
        # Process the uploaded video file
        result = process_video(file)

        return {"result": result}

    elif main_video_id:
        
            prompt = "chapterize the video for emotion timeline and time stamp it based on the video"
            emotion = context_engine.call_pegasus(main_video_id,prompt)
       
            prompt = "What are the key frame timestamps of the video?"
            emotion_objects = context_engine.call_pegasus(main_video_id,prompt)

            #open_ai
            gemini_ads_cat = context_engine.call_gemini(emotion)
            emotion_csv, gemini_emotion_graph_loc = context_engine.call_gemini(emotion,"emotion")


            return {"result": {"emotion": emotion, "emotion_graph": gemini_emotion_graph_loc}}

    else:
        return {"result": "No file or video_id provided. Either provide one of them"}


@app.get("/")
async def root():
    return {"message": "Welcome to advertisment placement API"}
