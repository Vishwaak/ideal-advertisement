import os
from dotenv import load_dotenv
import pandas as pd

from twelvelabs import TwelveLabs
from twelvelabs.types import VideoSegment
from twelvelabs.embed import TasksStatusResponse

from twelvelabs.indexes import IndexesCreateRequestModelsItem
from twelvelabs.tasks import TasksRetrieveResponse

# Load environment variables from a .env file
load_dotenv()

# Example: Access an environment variable
# my_variable = os.getenv("MY_VARIABLE")
twelve_API = os.getenv("twelve_API")

class Context_engine:
    def __init__(self):
        self.api_key = twelve_API
        # Initialize other components as needed

    def get_api_key(self):
        return self.api_key



    