import os
from dotenv import load_dotenv

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

    