import os


from pathlib import Path
from dotenv import load_dotenv
load_dotenv(dotenv_path=Path(__file__).parent / ".env")  # <- backend/.env ko force-load karega


from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict
from datetime import timedelta



from livekit_utils import create_access_token, ensure_room
from llm import summarize_text

app = FastAPI(title="Warm Transfer Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory transfer state (demo)
TRANSFERS: Dict[str, dict] = {}

class TokenReq(BaseModel):
    identity: str
    room: str
    role: str  # caller | agent

@app.post("/token")
def token(req: TokenReq):
    ensure_room(req.room)
    jwt = create_access_token(identity=req.identity, room=req.room, ttl=timedelta(hours=2))
    return {"token": jwt}

class InitTransferReq(BaseModel):
    transfer_id: str
    room_a: str
    agent_a: str
    agent_b: str

@app.post("/transfer/init")
def init_transfer(req: InitTransferReq):
    room_b = f"{req.transfer_id}-warm"
    ensure_room(room_b)
    TRANSFERS[req.transfer_id] = {
        "roomA": req.room_a, "roomB": room_b,
        "agentA": req.agent_a, "agentB": req.agent_b,
        "caller": None, "summary": None,
        "callerTokenB": None
    }

    tkn_a_roomb = create_access_token(identity=req.agent_a, room=room_b)
    tkn_b_roomb = create_access_token(identity=req.agent_b, room=room_b)

    return {
        "roomB": room_b,
        "agentATokenForRoomB": tkn_a_roomb,
        "agentBTokenForRoomB": tkn_b_roomb
    }


class SummaryReq(BaseModel):
    transfer_id: str
    transcript_or_notes: str

@app.post("/summary")
def summary(req: SummaryReq):
    if req.transfer_id not in TRANSFERS:
        raise HTTPException(404, "transfer not found")
    s = summarize_text(req.transcript_or_notes)
    TRANSFERS[req.transfer_id]["summary"] = s
    return {"summary": s}

class CompleteTransferReq(BaseModel):
    transfer_id: str
    caller_identity: str

@app.post("/transfer/complete")
def complete_transfer(req: CompleteTransferReq):
    t = TRANSFERS.get(req.transfer_id)
    if not t:
        raise HTTPException(404, "transfer not found")
    t["caller"] = req.caller_identity
    caller_token_roomb = create_access_token(identity=req.caller_identity, room=t["roomB"])
    t["callerTokenB"] = caller_token_roomb
    return {"roomB": t["roomB"], "callerTokenForRoomB": caller_token_roomb}

@app.get("/transfer/status")
def transfer_status(transfer_id: str):
    t = TRANSFERS.get(transfer_id)
    if not t:
        raise HTTPException(404, "transfer not found")
    return {
        "roomA": t["roomA"],
        "roomB": t["roomB"],
        "summary": t["summary"],
        "callerTokenB": t["callerTokenB"],
    }


from twilio_utils import dial_out_to_number, dial_out_to_sip

class TwilioDialRequest(BaseModel):
    target: str
    mode: str  # 'phone' or 'sip'
    caller_id: Optional[str] = None

@app.post("/twilio/dial-out")
def twilio_dial(req: TwilioDialRequest):
    if req.mode == 'phone':
        return dial_out_to_number(req.target, caller_id=req.caller_id)
    elif req.mode == 'sip':
        return dial_out_to_sip(req.target)
    else:
        raise HTTPException(400, "invalid mode")

from fastapi import Request
from fastapi.responses import PlainTextResponse
from pydantic import Field
from twilio.twiml.voice_response import VoiceResponse, Dial, Say
from twilio_utils import outbound_call_for_transfer

class DialReq(BaseModel):
    transfer_id: str = Field(..., description="Existing transfer id")
    to: str = Field(..., description="E.164 phone like +1... or sip:...")

@app.post("/twilio/dial")
def twilio_dial(req: DialReq):
    if req.transfer_id not in TRANSFERS:
        raise HTTPException(404, "transfer not found")
    try:
        sid = outbound_call_for_transfer(req.transfer_id, req.to)
        return {"call_sid": sid}
    except Exception as e:
        raise HTTPException(400, f"twilio dial failed: {e}")

@app.get("/twilio/twiml", response_class=PlainTextResponse)
async def twilio_twiml(transfer_id: str, connect: str = ""):
    """Generates TwiML:
    - Speaks the LLM summary (if present)
    - Then dials the same target (or a nested target) as a simple bridge stub.
    NOTE: This is a *stub* for the assignment. Full LiveKit <-> PSTN media bridge is a larger task.
    """
    t = TRANSFERS.get(transfer_id)
    vr = VoiceResponse()
    if not t:
        vr.say("Sorry. Transfer context not found.", voice="Polly.Matthew")
        return PlainTextResponse(content=str(vr), media_type="application/xml")
    summary = t.get("summary") or "Agent A will provide context."
    vr.say("Warm transfer context follows.", voice="Polly.Matthew")
    vr.say(summary, voice="Polly.Joanna")  # Twilio will map voices as available
    if connect:
        d = Dial(timeout=25, answer_on_bridge=True)
        # Auto-detect sip: vs phone
        if connect.startswith("sip:"):
            d.sip(connect)
        else:
            d.number(connect)
        vr.append(d)
    else:
        vr.say("No destination provided. Goodbye.", voice="Polly.Matthew")
    return PlainTextResponse(content=str(vr), media_type="application/xml")

@app.post("/twilio/status")
async def twilio_status(request: Request):
    form = await request.form()
    # You can persist or log these for debugging
    return {"ok": True, "status": form.get("CallStatus"), "sid": form.get("CallSid")}
