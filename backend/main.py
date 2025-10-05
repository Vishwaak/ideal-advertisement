import os
from xmlrpc import client
from dotenv import load_dotenv

from twelvelabs import TwelveLabs
from twelvelabs.indexes import IndexesCreateRequestModelsItem
from twelvelabs.tasks import TasksRetrieveResponse


from persona_analyzer import *

import matplotlib.pyplot as plt

import requests

# from google import genai

import logging
import json
import csv
import io

# Load environment variables from a .env file
load_dotenv()

class Context_engine:
    def __init__(self):
        self.api_key = os.getenv("twelve_API")
        self.index_id = os.getenv("twelve_index_id")
        self.client = TwelveLabs(api_key=self.api_key)
        self.logging()
        self.logger.info("Context engine initialized.")

        # self.gemini_client = genai.Client(api_key=os.getenv("gemini_API"))
        self.logger.info("Gemini client initialized.")

        self.persona_analyzer = PersonaAnalyzer()

        # Initialize other components as needed

    def logging(self):
        self.logger = logging.getLogger(__name__)
        self.logger.setLevel(logging.DEBUG)
        file_handler = logging.FileHandler("log.txt")
        file_handler.setFormatter(
            logging.Formatter("%(asctime)s - %(levelname)s - %(message)s")
        )
        self.logger.addHandler(file_handler)

    def upload_vid(self, video_file):
        url = "https://api.twelvelabs.io/v1.3/tasks"
        files = {"video_file": video_file}
        payload = {"index_id": self.index_id}
        headers = {"x-api-key": self.api_key}
        response = requests.post(url, data=payload, files=files, headers=headers)

        return response.json().get("video_id")
    
    def generate_emotion_timeline(self, response):
        csv_file_path = "emotion_timeline.csv"
        with open(csv_file_path, mode="w", newline="") as csv_file:
            csv_writer = csv.writer(csv_file)
            csv_reader = csv.reader(io.StringIO(response.text))
            for row in csv_reader:
                csv_writer.writerow(row)

        # Read the CSV file
        timestamps = []
        emotions = []

        with open(csv_file_path, mode="r") as csv_file:
            csv_reader = csv.reader(csv_file)
            count =0
            for row in csv_reader:
                if count > 2:
                    if len(row) == 2:  # Ensure the row has two elements (timestamp and emotion value)
                        try:
                            timestamps.append(row[0])
                            emotions.append(float(row[1]))
                        except ValueError:
                            self.logger.warning(f"Skipping invalid emotion value: {row[1]}")

        # Plot the data
        plt.figure(figsize=(10, 6))
        plt.plot(timestamps, emotions, marker="o", linestyle="-", color="b")
        plt.title("Emotion Timeline")
        plt.xlabel("Timestamp")
        plt.ylabel("Emotion Value")
        plt.xticks(rotation=45)
        plt.grid(True)
        plt.tight_layout()

        # Save the graph
        graph_file_path = "asserts/emotion_timeline_graph.png"
        plt.savefig(graph_file_path)
        plt.close()

        return graph_file_path

    def call_pegasus(self, vid_id, query):

        # Replace with a valid video_id or index that supports the generate operation
        text_steam = self.client.analyze(
            video_id=vid_id,
            prompt=query,
            temperature=0.1,
            response_format={
                "type": "json_schema",
                "json_schema": {
                    "type": "object",
                    "properties": {
                        "timestamps": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "time": {
                                        "type": "string",
                                        "description": "The timestamp in the video.",
                                    },
                                    "description": {
                                        "type": "string",
                                        "description": "The description of the content at the timestamp.",
                                    },
                                },
                                "required": ["time", "description"],
                            },
                        }
                    },
                    "required": ["timestamps"],
                },
            },
        )
        self.logger.info(f"Received timestamps and descriptions: {text_steam.data}")

        return json.loads(text_steam.data)


    def call_gemini(self, data, prompt_type="ads"):
        data = str(data)
        prompt = "In a dict with a python list. What are the advertisments you can sell or linked? add the time stamps too. "
        
        if prompt_type =="ads":
            response_scehma = {
                "type": "object",
                "properties": {
                    "advertisements": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "time": {
                                    "type": "string",
                                    "description": "The timestamp in the video.",
                                },
                                "advertisement": {
                                    "type": "array",
                                    "items": {
                                        "type": "string"
                                    },  
                                    "description": "emotion at the timestamp.",
                                },
                            },
                            "required": ["time", "advertisement"],
                        },
                    }
                },
            }
            response = self.gemini_client.models.generate_content(model="gemini-2.5-flash", contents=prompt + data, config={
                "response_mime_type": "application/json",
                "response_schema": response_scehma,
            })
            self.logger.info(f"Received emotion graph: {response.text}")

            return response.text
        else:
            prompt ="let's say sad is 0 and happy and exicted is 10 with this metric can you create timeline with values.create an emotion graph for this timeline. Generate a csv file for every second. Just give me the csv file with just one header row"
            response = self.gemini_client.models.generate_content(model="gemini-2.5-flash", contents=prompt + data, config={"response_mime_type": "text/plain",})
            # Save the response text as a CSV file
            file_location = self.generate_emotion_timeline(response)
            return response.text, file_location
        
    def call_pegausus_for_emotion(self, vid_id, query):
        pass

        # Replace with a valid video_id or index that supports the generate operation
        text_steam = self.client.analyze(
            video_id=vid_id,
            prompt=query,
            temperature=0.1,
            response_format={
                "type": "json_schema",
                "json_schema": {
                    "type": "object",
                    "properties": {
                        "timestamps": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "time": {
                                        "type": "string",
                                        "description": "The timestamp in the video.",
                                    },
                                    "description": {
                                        "type": "string",
                                        "description": "The description of the content at the timestamp.",
                                    },
                                },
                                "required": ["time", "description"],
                            },
                        }
                    },
                    "required": ["timestamps"],
                },
            },
        )
        self.logger.info(f"Received timestamps and descriptions: {text_steam.data}")

        return json.loads(text_steam.data)

# if __name__ == "__main__":
#     context_engine = Context_engine()
#     data = {
#   "result": {
#     "data": {
#       "timestamps": [
#         {
#           "description": "Preparation and Tension, building up as the play is about to begin.",
#           "time": "0s (00:00)"
#         },
#         {
#           "description": "Execution of the Play, excitement as Barkley makes a significant run.",
#           "time": "4s (00:04)"
#         },
#         {
#           "description": "Successful Run, satisfaction and relief as Barkley gains substantial yardage.",
#           "time": "12s (00:12)"
#         },
#         {
#           "description": "Celebration, joy and triumph as Barkley celebrates with his teammates.",
#           "time": "17s (00:17)"
#         },
#         {
#           "description": "Replay and Reflection, appreciation and admiration as the play is shown from different angles.",
#           "time": "26s (00:26)"
#         }
#       ]
#     }
#   }
# }
    
#     data = {"timestamps":[{"description":"The initial chase creates tension as the player in black attempts to catch up with the player in red.","time":"0s (00:00) - 4s (00:04)"},{"description":"As the player in red skillfully maneuvers past the defender, excitement and thrill are evident.","time":"4s (00:04) - 8s (00:08)"},{"description":"The climax occurs when the player in red scores a goal, evoking joy and triumph.","time":"8s (00:08) - 11s (00:11)"},{"description":"The celebration phase begins, marked by the player's body language and the crowd's response, filled with happiness and satisfaction.","time":"11s (00:11) - 13s (00:13)"}]}
#     context_engine.call_gemini(data, prompt_type="emotion")
# #     vid_id = '68e17ba917b39f617835d2da'
# #     query = "chapterize the video for emotion timeline and time stamp it based on the video"
# #     response = context_engine.call_pegasus(vid_id, query)
# #     print("Response from Marengo:", response)
