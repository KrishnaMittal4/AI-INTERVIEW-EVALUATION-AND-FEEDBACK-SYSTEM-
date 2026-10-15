# 🎯 AI Interview Evaluation And Feedback System 
https://ai-interview-evaluation-and-feedbac.vercel.app/
> Full-stack AI system for real-time interview coaching: speech analysis, filler detection, NLP scoring, and HR feedback.

## Stack

| Layer | Tech |
|-------|------|
| Speech-to-Text | Gemini audio, with Groq Whisper fallback |
| LLM Evaluation | Groq · `openai/gpt-oss-120b` |
| Backend | FastAPI (Python 3.11) |
| NLP Pipeline | Custom regex + heuristics |
| Frontend | React 18 + Vite |
| Containerization | Docker + docker-compose |

---

## Architecture

```
Browser (React)
    │
    ├── /analyze/text ──→ FastAPI
    │                         ├── Local NLP (filler words, confidence markers, structure)
    │                         └── Groq API (GPT-OSS-120B → evaluation + HR feedback)
    │
    └── /analyze/audio ─→ FastAPI
                              ├── Gemini audio → transcript (Groq Whisper fallback)
                              ├── Local NLP
                              └── Groq LLM
```

## Interview Preparation

- The standard AI interview is the interview preparation flow. Resume upload is optional and can be skipped.
- Full interview sessions continue to use the webcam, voice, and answer evaluation flow.
- Resume details can be sent to the configured AI provider to tailor questions.

## Quick Start

### 1. Clone & Configure

```bash
git clone https://github.com/yourname/ai-interview-analyzer
cd ai-interview-analyzer
```

### 2. Backend Setup

```bash
cd backend
cp .env.example .env
# Add GROQ_API_KEY and GEMINI_API_KEY to .env
# Get keys at https://console.groq.com and https://aistudio.google.com/apikey

python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

uvicorn main:app --reload --port 8000
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
# Open http://localhost:5173
```

### 4. Docker (Full Stack)

```bash
# From project root:
echo "GROQ_API_KEY=your_key_here" > .env
docker-compose up --build
# Backend: http://localhost:8000
# Frontend: http://localhost:3000
```

---

## Deploy to Render and Vercel

The frontend and backend deploy separately. Render hosts the FastAPI service; Vercel
hosts the React/Vite app and needs the Render URL at build time.

### 1. Push the changes to GitHub

From the repository root, review and stage the intended files, then commit and push:

```bash
git status
git add README.md backend/.env.example backend/analyzer.py backend/dialogic_feedback.py backend/llm_router.py backend/main.py backend/model_comparison.py backend/multi_agent_scorer.py backend/resume_rephraser_api.py backend/tests/test_llm_router.py frontend/src/App.jsx
git diff --cached --check
git diff --cached --name-only
git commit -m "Fix evaluation and cloud transcription"
git push origin main
```

Check the staged-file list before committing. Do not stage `backend/.env` or put API
keys in GitHub. Keep secrets in the Render environment settings.

### 2. Deploy the backend on Render

- Create or update a Web Service from this GitHub repository. Set the root directory
  to `backend`, build command to `pip install -r requirements.txt`, and start command
  to `uvicorn main:app --host 0.0.0.0 --port $PORT`.
- Set `GROQ_API_KEY`, `GEMINI_API_KEY`, `GROQ_MODEL=openai/gpt-oss-120b`, and
  `ALLOWED_ORIGINS=https://ai-interview-evaluation-and-feedbac.vercel.app` in the
  Render dashboard. Set a strong `JWT_SECRET` there too (or let Render generate it).
  Never use the example placeholder API keys.
- Deploy, then check `https://<your-render-service>.onrender.com/health`.

### 3. Deploy the frontend on Vercel

- Import the same GitHub repository and set the project root directory to `frontend`.
  Use `npm run build` as the build command and `dist` as the output directory.
- Add `VITE_API_URL=https://<your-render-service>.onrender.com` in the Vercel
  project’s environment variables. Do not add a trailing slash or provider API keys.
- Redeploy after setting the variable; Vite embeds it during the build. The current
  deployed Vercel site must be rebuilt from the updated GitHub branch to receive these
  code and UI changes.

To host the frontend on Render instead, create a **Static Site** from the same
repository, set the root directory to `frontend`, build command to `npm run build`,
and publish directory to `dist`. Set `VITE_API_URL` to the backend's public Render
URL and ensure the backend's `ALLOWED_ORIGINS` includes the frontend's Render URL.

The live face-visibility check runs in the visitor's browser and does not add a
MediaPipe/Python dependency to the backend service. The browser loads the face model
from Google Cloud Storage and MediaPipe's WASM runtime from jsDelivr, so the deployed
site must use HTTPS and visitors need access to those asset hosts. If these downloads
are blocked or unavailable, the interview and camera preview remain usable and the
face check displays an unavailable notice.

After both deploys, launch an interview and test typed evaluation and recorded
transcription. Check the browser Network panel and Render logs if either request fails.

---

## API Reference

### `POST /analyze/text`
Analyze a typed/pasted transcript.

**Form data:**
- `answer` (str) — the candidate's answer
- `question` (str) — the interview question
- `question_type` (str) — `behavioral | technical | situational`

**Response:**
```json
{
  "success": true,
  "scores": {
    "overall": 74,
    "confidence": 68,
    "clarity": 80,
    "structure": 75,
    "technical": 82,
    "relevance": 78
  },
  "grade": "B",
  "nlp": {
    "fillers": { "total_count": 4, "filler_rate_percent": 2.8 },
    "confidence_markers": { "strong_count": 6, "weak_count": 2 },
    "structure": { "framework": "STAR", "score": 75 }
  },
  "ai_evaluation": {
    "technical_evaluation": "...",
    "key_strengths": ["..."],
    "improvement_areas": ["..."],
    "coaching_tip": "..."
  },
  "hr_feedback": {
    "recommendation": "Yes",
    "reasoning": "..."
  },
  "annotated_transcript": "I [FILLER]basically[/FILLER] [STRONG]implemented[/STRONG] a system..."
}
```

### `POST /analyze/audio`
Full cloud transcription → NLP pipeline.

**Form data:**
- `audio` (file) — `.webm`, `.mp3`, `.wav`, `.m4a`
- `question`, `question_type`

**Response:** Same as `/analyze/text` plus `transcript` field.

### `POST /evaluate`
Evaluates an interview answer and returns the score breakdown used by the live
interview results.

**Timing and score fields:**
- `answer_time_sec` is the measured answer duration in seconds. Send `0` when
  the duration is unavailable; WPM is then `null` rather than estimated. For
  spoken modes, WPM uses the whole measured response duration, including pauses.
  `answer_mode` is `recorded`, `browser_stt`, or `typed`; typed-answer time is
  excluded from speaking-pace and time scoring.
- `scores.answer_quality_1_5` is the type-aware answer composite (relevance,
  depth, fluency, grammar, keywords, and STAR where applicable). The legacy
  `scores.knowledge_1_5` field is retained as an equivalent alias.
- `grade` is derived from the overall score: A ≥ 4.5, B ≥ 3.5, C ≥ 2.5,
  D ≥ 1.5, and F below 1.5. Session recommendations use the session average:
  Strong Yes ≥ 4.0, Yes ≥ 3.2, Maybe ≥ 2.5, otherwise No.
- `star_coverage` is the fraction of STAR components detected. STAR quality is
  reported separately as `scores.star_quality_1_5`; the relevance-adjusted STAR
  contribution used by the composite score is `scores.star_effective_1_5`.
- `scores.grammar_0_5` is the grammar estimate on a 0–5 scale.
  `grammar_score` is its normalized 0–1 value for skill-gap reports.
- `evaluation_mode` indicates whether AI reviewer feedback was available;
  `score_sources` describes the source of heuristic and behavioral metrics.

### `GET /questions`
Returns the question bank by category.

### `GET /health`
Returns API health + Groq connection status.

---

## NLP Pipeline Details

### Filler Word Detection
Three categories detected via regex:
- **Hesitation**: um, uh, er, ah, hmm
- **Vague**: like, you know, sort of, kind of, basically, literally
- **Filler phrases**: I mean, you see, right, okay so

Filler rate = `(total fillers / word count) × 100`

### Confidence Scoring
Matches positive markers (achieved, led, built, demonstrated, increased) vs. negative markers (I think, maybe, I guess, kind of). Penalizes heavily for high filler rate.

### Structure Analysis
- **Behavioral**: STAR method (Situation, Task, Action, Result) via keyword matching
- **Technical**: Problem-Solution-Trade-offs framework

### LLM Integration
Uses Groq with `openai/gpt-oss-120b` by default for:
- Technical accuracy evaluation
- Contextualized strengths/weaknesses
- HR recommendation (Strong Yes → No)
- Annotated transcript with [FILLER] and [STRONG] tags

---

## Running Tests

```bash
cd backend
pytest tests/ -v
```

---

## Skills Learned (Implementation)

- **NLP**: Regex-based filler detection, confidence marker classification, STAR method detection
- **Speech Processing**: Gemini audio transcription with Groq Whisper fallback
- **Full-Stack AI Systems**: FastAPI async endpoints, parallel NLP + LLM inference with `asyncio.gather`
- **API Integration**: Groq SDK (streaming + non-streaming), FormData audio uploads, CORS setup

---

## Project Structure

```
ai-interview-analyzer/
├── backend/
│   ├── main.py          # FastAPI routes
│   ├── analyzer.py      # NLP engine + Groq integration
│   ├── requirements.txt
│   ├── .env.example
│   ├── Dockerfile
│   └── tests/
│       └── test_analyzer.py
├── frontend/
│   ├── src/
│   │   ├── App.jsx      # Main UI
│   │   └── api.js       # API client
│   └── package.json
└── docker-compose.yml
```
