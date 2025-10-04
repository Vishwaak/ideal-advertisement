import os
from dotenv import load_dotenv

from twelvelabs import TwelveLabs
from twelvelabs.indexes import IndexesCreateRequestModelsItem
from twelvelabs.tasks import TasksRetrieveResponse

import logging

# Load environment variables from a .env file
load_dotenv()

class Context_engine:
    def __init__(self):
        self.marengo_key = os.getenv("twelve_API")
        self.logging()
        self.logger.info("Context engine initialized.")        

        # Initialize other components as needed

    def logging(self):
        self.logger = logging.getLogger(__name__)
        self.logger.setLevel(logging.DEBUG)
        file_handler = logging.FileHandler('log.txt')
        file_handler.setFormatter(logging.Formatter('%(asctime)s - %(levelname)s - %(message)s'))
        self.logger.addHandler(file_handler)



    def call_pegasus(self, vid_id, query):
        client = TwelveLabs(api_key=self.marengo_key)
        # Replace with a valid video_id or index that supports the generate operation
        text_steam = client.analyze(video_id=vid_id, prompt=query, temperature=0.1, response_format={"type": "json_schema", "json_schema": {
            "type": "object",
            "properties": {
            "emotion_timestamps": {
                "type": "array",
                "items": {
                "type": "object",
                "properties": {
                    "time": {
                    "type": "string",
                    "description": "The timestamp in the video."
                    },
                    "description": {
                    "type": "string",
                    "description": "The description of the content at the timestamp."
                    }
                },
                "required": ["time", "description"]
                }
            }
            },
            "required": ["timestamps"]
        }})
        self.logger.info(f"Received timestamps and descriptions: {text_steam.data}")

        return text_steam.data

if __name__ == "__main__":
    context_engine = Context_engine()
    vid_id = '68e17ba917b39f617835d2da'
    query = "chapterize the video for emotion timeline and time stamp it based on the video"
    response = context_engine.call_pegasus(vid_id, query)
    print("Response from Marengo:", response)

    