import os
import requests
from dotenv import load_dotenv

load_dotenv()
url = os.environ.get("IDM_VTON_GRADIO_URL")
print("IDM_VTON_GRADIO_URL =", url)

if not url:
    raise SystemExit("NOT SET: add IDM_VTON_GRADIO_URL=https://xxxx.gradio.live to color-service/.env")

try:
    r = requests.get(url, timeout=15)
    print("HTTP status:", r.status_code)
    if r.status_code != 200:
        raise SystemExit("Link is not serving the app (expired). Restart the Kaggle notebook and put the NEW link in .env.")
except requests.RequestException as e:
    raise SystemExit(f"Cannot reach the link: {e}\nRestart the Kaggle notebook and put the NEW link in .env.")

from gradio_client import Client
try:
    client = Client(url)
    print("Connected to Gradio app OK.")
    client.view_api()
except Exception as e:
    raise SystemExit(f"Gradio client failed: {type(e).__name__}: {e}\nIf it mentions bool/schema, run: python patch_gradio_client.py")
