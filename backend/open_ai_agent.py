import boto3
import os
from dotenv import load_dotenv
import json
# Load environment variables from a .env file
load_dotenv()

api_key = os.getenv('AWS_BEARER_TOKEN_BEDROCK')
# Set the API key as an environment variable
os.environ['AWS_BEARER_TOKEN_BEDROCK'] =  api_key

# Create the Bedrock client
client = boto3.client(
    service_name="bedrock-runtime",
    region_name="us-east-1"
)


def call_openai(product, data, emotion_graph):
    # Define the model and message
    model_id = "openai.gpt-oss-120b-1:0"
    messages = [{"role": "user", "content": [{"text": f"would {product} Products fit  any of the segments  {data} and give the transition as well make sure it matches with {emotion_graph}. Give the answer in a Answer in JSON format with keys and make sure nothing is outside the dict"}]}]

    # Make the API call
    response = client.converse(
        modelId=model_id,
        messages=messages,
        
    )

    sample_dict = response['output']['message']['content'][1]['text']

    return sample_dict