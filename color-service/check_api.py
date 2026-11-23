import os
from dotenv import load_dotenv
from gradio_client import Client

load_dotenv()

url = os.environ.get("IDM_VTON_GRADIO_URL")
if not url:
    raise SystemExit("IDM_VTON_GRADIO_URL is not set in color-service/.env")

print(f"Connecting to {url} ...")
client = Client(url)
client.view_api()