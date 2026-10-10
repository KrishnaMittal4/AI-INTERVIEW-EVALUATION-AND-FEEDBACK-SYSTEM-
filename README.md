# 🎯 AI Interview Analyzer

> Full-stack AI system for real-time interview coaching: speech analysis, filler detection, NLP scoring, and HR feedback.

## Stack

| Layer | Tech |
|-------|------|
| Speech-to-Text | OpenAI Whisper (via Groq API) |
| LLM Evaluation | Groq · LLaMA 3.3-70B Versatile |
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
    │                         └── Groq API (LLaMA 3.3-70B → technical eval + HR feedback)
    │
    └── /analyze/audio ─→ FastAPI
                              ├── Whisper (via Groq) → transcript
                              ├── Local NLP
                              └── Groq LLM
```

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
# Edit .env → add your GROQ_API_KEY
# Get free key: https://console.groq.com

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
Full Whisper → NLP pipeline.

**Form data:**
- `audio` (file) — `.webm`, `.mp3`, `.wav`, `.m4a`
- `question`, `question_type`

**Response:** Same as `/analyze/text` plus `transcript` field.

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

### Groq Integration
Uses `llama-3.3-70b-versatile` for:
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
- **Speech Processing**: Whisper API integration via Groq, local fallback with `openai-whisper`
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
