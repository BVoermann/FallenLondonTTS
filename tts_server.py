from flask import Flask, request, send_file
from flask_cors import CORS
from TTS.api import TTS
import tempfile

app = Flask(__name__)
CORS(app)  # <<< This allows all origins to access the server

# Load model once
tts = TTS("tts_models/en/jenny/jenny")

@app.route("/speak", methods=["POST"])
def speak():
    data = request.json
    text = data.get("text", "")
    if not text:
        return {"error": "No text provided"}, 400

    # Generate audio to temp file
    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as f:
        tts.tts_to_file(text=text, file_path=f.name)
        return send_file(f.name, mimetype="audio/wav")

if __name__ == "__main__":
    app.run(port=5002)
