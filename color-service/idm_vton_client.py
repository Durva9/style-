"""
Thin client for calling the IDM-VTON model running remotely via Gradio.

Right now this points at a Kaggle notebook's temporary public Gradio link
(printed when you run `python gradio_demo/app.py` there). That link:
  - changes every time the Kaggle notebook is restarted
  - expires after ~72 hours regardless

So: update IDM_VTON_GRADIO_URL in your .env every time you relaunch the
Kaggle notebook. When you move to a persistent host (HF Spaces, Modal,
Replicate, etc.), only this URL needs to change -- the calling code in
app.py stays the same.
"""

import os
from gradio_client import Client

try:
    from gradio_client import handle_file
except ImportError:
    # gradio_client 0.14.0 (and earlier) calls this helper `file()` instead
    from gradio_client import file as handle_file

IDM_VTON_GRADIO_URL = os.environ.get("IDM_VTON_GRADIO_URL")

_client = None


def get_client():
    global _client
    if not IDM_VTON_GRADIO_URL:
        raise RuntimeError(
            "IDM_VTON_GRADIO_URL is not set. Copy the public URL printed by "
            "the Kaggle notebook (e.g. https://xxxx.gradio.live) into your .env."
        )
    if _client is None:
        _client = Client(IDM_VTON_GRADIO_URL)
    return _client


def run_idm_vton(body_image_url, garment_image_url, garment_desc="a garment"):
    """
    Calls the remote IDM-VTON Gradio app's /tryon endpoint.

    NOTE: before relying on this in production, run once locally:
        from gradio_client import Client
        Client(IDM_VTON_GRADIO_URL).view_api()
    ...and confirm the exact parameter names/order below match what it
    prints, especially the human-image input (IDM-VTON's demo uses an
    ImageEditor component that expects a dict, not a plain file).
    """
    client = get_client()

    result = client.predict(
        {
            "background": handle_file(body_image_url),
            "layers": [],
            "composite": None,
        },
        handle_file(garment_image_url),
        garment_desc,
        True,   # is_checked -> auto-generate mask
        True,   # is_checked_crop -> auto-crop/resize
        30,     # denoise_steps
        42,     # seed
        api_name="/tryon",
    )

    # IDM-VTON's demo typically returns a tuple of (result_image_path, mask_image_path)
    if isinstance(result, (list, tuple)):
        return result[0]
    return result
