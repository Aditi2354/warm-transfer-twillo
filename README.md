# Warm Transfer (LiveKit + LLM) with optional Twilio Dial-out

A minimal but complete warm-transfer demo:
- **Caller ↔ Agent A** (Room A)  
- Agent A initializes **Warm Transfer** → creates **Room B** with Agent B  
- Agent A generates & speaks a **call summary** (LLM) to Agent B  
- Agent A exits; **Caller ↔ Agent B** continue in Room B  
- *(Optional)* Twilio PSTN/SIP dial-out stub to call real numbers/SIP

> Built with **Next.js (frontend)** + **FastAPI (backend)**. LiveKit tokens are minted in backend via JWT.  
> Twilio is optional and only used for a dial-out stub (summary TTS + bridge).

---

## 🎥 Demo Videos (Loom)

1. **Code Walkthrough (UI + Flow):**  
   https://www.loom.com/share/e398ded80b314a6785010d5786f93d19?sid=7f59a7ba-9f3e-4c82-9fc7-aff1cb4b84b5

2. **Localhost Run (E2E warm transfer):**  
   https://www.loom.com/share/3aa63ebe3a8645a5b944c47f81423f10?t=29&sid=bd13e4cc-1056-4c7f-ad9c-e605c0e62cbb

---

## 🧭 Features

- LiveKit rooms (A & B), low-latency audio/video
- LLM summary generation (pluggable provider)
- Simple, clean **Next.js** UI for Caller / Agent A / Agent B
- JWT-based **token endpoint** in FastAPI
- **Warm transfer flow** with state tracked in backend
- **Twilio dial-out stub** (optional): speak summary, then dial phone/SIP

---

## 🏗️ Architecture

frontend/ (Next.js 14)
├─ app/join → Caller UI (Room A, auto-switch to Room B)
├─ app/agent-a → Agent A UI (init transfer, summary, complete)
├─ app/agent-b → Agent B UI (join Room B, view summary)
└─ components/LiveRoom.tsx → LiveKit UI wrapper

backend/ (FastAPI)
├─ main.py → API routes
├─ livekit_utils.py → JWT token generation (HS256)
├─ llm.py → summarize_text(...) provider
├─ twilio_utils.py → optional dial-out stubs
└─ requirements.txt

yaml
Copy code

---

## 📦 Tech Stack

- **Frontend:** Next.js 14, `@livekit/components-react`, TypeScript
- **Backend:** FastAPI, Uvicorn, PyJWT, `python-dotenv`
- **RTC:** LiveKit Cloud (WebRTC)
- **Optional Telephony:** Twilio Programmable Voice (trial is fine)

---

## 🔑 Environment Variables

### `backend/.env`
```env
LK_API_KEY=your_livekit_api_key
LK_API_SECRET=your_livekit_api_secret
LIVEKIT_URL=wss://your-subdomain.livekit.cloud

# Optional Twilio (only if you use dial-out)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_FROM=+1XXXXXXXXXX          # your Twilio number
PUBLIC_BASE_URL=https://<your-ngrok-or-host>/    # for webhook/TwiML
frontend/.env.local
env
Copy code
NEXT_PUBLIC_LIVEKIT_URL=wss://your-subdomain.livekit.cloud
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
Do NOT commit real secrets. Commit .env.example files only.

▶️ Local Setup
1) Backend (Python 3.12 recommended)
bash
Copy code
cd backend

# create & activate venv (Windows PowerShell)
py -3.12 -m venv .venv312
.\.venv312\Scripts\Activate.ps1

# install deps
pip install -U pip
pip install -r requirements.txt

# run API
uvicorn main:app --reload --host 0.0.0.0 --port 8000
Verify:

bash
Copy code
# should return {"token":"..."}
curl -X POST http://localhost:8000/token \
  -H "Content-Type: application/json" \
  -d '{"identity":"test","room":"room-a","role":"caller"}'
2) Frontend (Node 18+ / 20+)
bash
Copy code
cd ../frontend
npm install
npm run dev
# open http://localhost:3000
🧪 How to Use (Manual Flow)
Caller → /join

Name = e.g. caller-1234

Room A = room-a

Note the Transfer ID (auto-generated or edit), share with Agent A

Click Join Room A

Agent A → /agent-a

Agent A = agent-a, Room A = room-a → Join Room A

Transfer ID = paste from caller (e.g., tx-7950)

Agent B = agent-b → Initialize Transfer

(Optional) type brief notes → Generate Summary

Complete Transfer → Caller switches to Room B automatically

Agent B → /agent-b

Agent B = agent-b

Transfer ID = same (e.g., tx-7950) → Join Room B

See summary, talk to caller in Room B

☎️ (Optional) Twilio Dial-out Stub
Only needed if you want to dial a real phone number or SIP URI and play the summary.

Add Twilio vars in backend/.env (see above).

Expose backend publicly (for Twilio webhooks):

bash
Copy code
# from backend/
ngrok http 8000
# set PUBLIC_BASE_URL=https://<ngrok-id>.ngrok-free.app/
In Agent A UI (Room B created), enter +1... or sip:user@domain and click Dial via Twilio.

Twilio will hit /twilio/twiml?transfer_id=... → speaks summary → dials target.

This is a stub for the assignment; full LiveKit↔PSTN media bridge is a larger task.

🔌 API Endpoints (Backend)
POST /token → { token }

POST /transfer/init → create Room B, pre-issue tokens

POST /summary → LLM summary from notes/transcript

POST /transfer/complete → issues caller token for Room B

GET /transfer/status?transfer_id=... → current state

POST /twilio/dial (optional) → outbound call (PSTN/SIP)

GET /twilio/twiml (optional) → TwiML response for TTS + dial

🧰 Troubleshooting
401 / LiveKit connect failed → check LK_API_KEY/SECRET and NEXT_PUBLIC_LIVEKIT_URL.

404 transfer/status → you must init transfer first.

CORS → backend enables allow_origins=["*"].

Python build issues → use Python 3.12 (not 3.13), and a clean venv.

📄 Notes
Commit history shows logical steps (not a single bulk upload).

Clean UI + clear separation of concerns (frontend/backend).

LLM provider is pluggable in backend/llm.py.iveKit↔PSTN media bridge requires LiveKit Telephony/SIP interop or a media gateway—out of scope for this MVP but this shows the warm-transfer briefing to a real endpoint.
