from fastapi import FastAPI
from pydantic import BaseModel
from fastapi import UploadFile, File
from typing import List
from main import Context_engine
import logging
app = FastAPI()

context_engine = Context_engine()

import run_multi_video_analysis
from embedding_similarity_analysis import *

# Define a response model
class OutputData(BaseModel):
    result: dict

from open_ai_agent import call_openai

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
            logging.basicConfig(level=logging.INFO)
            logger = logging.getLogger(__name__)

            logger.info("Calling Pegasus for emotion analysis.")
            emotion = context_engine.call_pegasus(main_video_id, prompt)
            logger.info(f"Emotion analysis result: {emotion}")

            prompt = "What are the key frame timestamps of the video?"
            logger.info("Calling Pegasus for key frame timestamps.")
            emotion_objects = context_engine.call_pegasus(main_video_id, prompt)
            logger.info(f"Key frame timestamps result: {emotion_objects}")

            logger.info("Calling Gemini for ads category analysis.")
            gemini_ads_cat = context_engine.call_gemini(emotion_objects)
            logger.info(f"Gemini ads category result: {gemini_ads_cat}")

            logger.info("Calling Gemini for emotion CSV and graph generation.")
            emotion_csv, gemini_emotion_graph_loc = context_engine.call_gemini(emotion, "emotion")
            logger.info(f"Emotion CSV: {emotion_csv}, Emotion graph location: {gemini_emotion_graph_loc}")

            logger.info("Running multi-video analysis for persona matching.")
            run_multi_video_analysis.persona_main(main_video_id, ads_id)

            logger.info("Initializing EmbeddingSimilarityAnalyzer.")
            analyzer = EmbeddingSimilarityAnalyzer()
            logger.info("Generating analysis report.")
            report = analyzer.generate_analysis_report()
            logger.info(f"Analysis report: {report}")

            output_file = "embedding_similarity_results.json"
            logger.info(f"Output file for embedding similarity results: {output_file}")

            final_products = report["final_score"]
            final_ad_palcement = []
            logger.info("Generating final ad placement recommendations.")
            for i in range(len(final_products)):
                product = final_products[i]["product"]
                ad_placement = call_openai(product,emotion_csv, gemini_ads_cat)
                final_ad_palcement.append(ad_placement)
                logger.info(f"Ad placement for product {product}: {ad_placement}")

            return {"result": {"emotion": emotion, "emotion_graph": gemini_emotion_graph_loc, "ad_placement_report": final_ad_palcement}}

    else:
        return {"result": "No file or video_id provided. Either provide one of them"}


@app.get("/")
async def root():
    return {"message": "Welcome to advertisment placement API"}
