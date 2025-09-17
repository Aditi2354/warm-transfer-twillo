# Warm Transfer • LiveKit + LLM (Next.js + FastAPI)

A polished demo that implements **Warm Transfer**:
- Caller joins **Room A** with **Agent A**.
- Agent A initializes a warm transfer and joins **Room B** with **Agent B**.
- Agent A generates an **LLM call summary** and briefs Agent B.
- Caller is moved to **Room B** without dropping the call.
- Agent A exits, leaving **Caller + Agent B** connected.

https://livekit.io • https://docs.livekit.io

---

## Architecture
- **Frontend:** Next.js 14 (App Router), `@livekit/components-react`, Tailwind
- **Backend:** FastAPI (Python), LiveKit Server SDK, pluggable LLM (OpenAI / Groq / OpenRouter)
- **State:** In‑memory transfer map (for demo).

```txt
[Next.js UI]
  /join (Caller)   /agent (Agent A)   /agent-b (Agent B)
         |             |                   |
         |  /token     | /transfer/*       | /transfer/status
         v             v                   v
                 [FastAPI backend]
     - POST /token
     - POST /transfer/init
     - POST /summary
     - POST /transfer/complete
     - GET  /transfer/status
         |
         v
    [LiveKit Cloud/SFU]
```

---

## Setup

### 1) LiveKit + Keys
Create a LiveKit Cloud project (or self-host). Put keys in `backend/.env`:

```env
LIVEKIT_URL=wss://your-livekit-host
LK_API_KEY=your_key
LK_API_SECRET=your_secret
```

### 2) LLM Provider (choose one)
In `backend/.env` set:
```env
LLM_PROVIDER=openai   # or groq or openrouter
# and its API key:
OPENAI_API_KEY=...
# GROQ_API_KEY=...
# OPENROUTER_API_KEY=...
```

### 3) Backend
```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env && edit .env
bash run.sh   # or: uvicorn main:app --reload --port 8000
```

### 4) Frontend
```bash
cd frontend
npm i
cp .env.example .env.local && edit .env.local
npm run dev
```

---

## Demo Script

**1) Caller (/join)**  
- Set a name, Room A (default: `room-a`), and note the **Transfer ID** (e.g., `tx-1234`).  
- Click **Join Room A**. Caller now talks to Agent A.

**2) Agent A (/agent)**  
- Join Room A.  
- Enter the same **Transfer ID** and Agent B's name. Click **Initialize Transfer** → Room B is created and tokens are issued.  
- Type quick notes and click **Generate Summary** → LLM briefing appears.  
- Click **Complete Transfer** → backend issues Caller token for Room B.

**3) Agent B (/agent-b)**  
- Enter the **Transfer ID** and click **Join Room B** → Agent B joins and sees the briefing summary.

**4) Caller**  
- The Caller tab auto-detects transfer status and switches to **Room B** without hanging up.

**5) Agent A exits**  
- Agent A can close Room A tab or simply not join Room B further. Caller and Agent B continue.

---

## Notes
- For a production flow, swap in a DB (Redis) for transfer state and add auth.
- Add Twilio PSTN/SIP dial-out as an optional extension calling Twilio Voice API during `/transfer/init`.
- You can turn the summary into TTS and play it in Room B (e.g., LiveKit Agents or browser TTS).

---

## Commands Quick Ref
```bash
# backend
cd backend && uvicorn main:app --reload --port 8000

# frontend
cd frontend && npm run dev
```

---

## License
MIT

---

## Optional: Twilio PSTN/SIP Dial-Out

This repo includes **stubs** to dial a real phone number or SIP URI and have Twilio **speak the LLM summary** before bridging to the destination.

### Configure
In `backend/.env`:
```env
TWILIO_ACCOUNT_SID=ACxxxxxxxx
TWILIO_AUTH_TOKEN=your_token
TWILIO_FROM_NUMBER=+1XXXXXXXXXX
TWILIO_VOICE_WEBHOOK_BASE=https://your-public-host   # e.g., https://abcd.ngrok.app
```

Expose backend publicly (ngrok/Render/etc.), so Twilio can reach:
- `GET  /twilio/twiml?transfer_id=...&connect=...` (TwiML generator)
- `POST /twilio/status` (status callbacks)

### Use (Agent A panel)
- After generating the LLM summary, enter a **phone number** (`+1...`) or **SIP URI** (`sip:...`) and click **Dial via Twilio**.
- Twilio will call the destination, **read the summary**, then attempt a simple bridge.

> Note: This is a **demo stub**. Full LiveKit↔PSTN media bridge requires LiveKit Telephony/SIP interop or a media gateway—out of scope for this MVP but this shows the warm-transfer briefing to a real endpoint.
