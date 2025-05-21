from fastapi import FastAPI, Request, UploadFile, File, Form
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import os
import openai
import uuid

app = FastAPI()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
templates = Jinja2Templates(directory=os.path.join(BASE_DIR, "templates"))

app.mount("/static", StaticFiles(directory=os.path.join(BASE_DIR, "static")), name="static")

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
openai.api_key = OPENAI_API_KEY

@app.get("/", response_class=HTMLResponse)
def index(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.post("/upload-audio", response_class=HTMLResponse)
async def upload_audio(request: Request, file: UploadFile = File(...)):
    temp_path = os.path.join(BASE_DIR, "temp_audio.wav")
    with open(temp_path, "wb") as f:
        f.write(await file.read())
    # Transcribe using OpenAI Whisper
    transcript = ""
    try:
        with open(temp_path, "rb") as audio_file:
            transcript_response = openai.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file
            )
            transcript = transcript_response.text
    except Exception as e:
        transcript = f"Transcription failed: {e}"
    # Remove temp file
    os.remove(temp_path)
    # Extract info with LLM (now also extract company)
    extraction_prompt = f"""
    Given the following user requirement, extract:
    1. Who is the user?
    2. What is the company (if mentioned)?
    3. What is the query/requirement?
    4. What action needs to be taken?
    
    Requirement: '''{transcript}'''
    
    Respond in JSON with keys: user, company, query, action.
    """
    extracted = {"user": "", "company": "", "query": "", "action": ""}
    try:
        response = openai.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": extraction_prompt}]
        )
        import json
        import re
        match = re.search(r'\{.*\}', response.choices[0].message.content, re.DOTALL)
        if match:
            extracted = json.loads(match.group(0))
    except Exception as e:
        extracted = {"user": "Extraction failed", "company": "", "query": str(e), "action": ""}
    return templates.TemplateResponse("index.html", {
        "request": request,
        "transcript": transcript,
        "extracted": extracted
    }) 