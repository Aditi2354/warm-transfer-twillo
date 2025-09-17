# backend/twilio_utils.py
import os
from urllib.parse import urlencode
from twilio.rest import Client

def get_client():
    return Client(os.environ.get("TWILIO_ACCOUNT_SID"), os.environ.get("TWILIO_AUTH_TOKEN"))

def outbound_call_for_transfer(transfer_id: str, to: str):
    """
    Create an outbound call (PSTN or SIP).
    Twilio will fetch TwiML from our backend, which speaks the LLM summary and dials through.
    """
    client = get_client()
    base = os.environ.get("TWILIO_VOICE_WEBHOOK_BASE", "").rstrip("/")
    if not base:
        raise RuntimeError("TWILIO_VOICE_WEBHOOK_BASE not configured (public https URL required)")

    twiml_url = f"{base}/twilio/twiml?{urlencode({'transfer_id': transfer_id, 'connect': to})}"
    status_url = f"{base}/twilio/status"
    from_ = os.environ.get("TWILIO_FROM_NUMBER")

    call = client.calls.create(
        to=to,
        from_=from_,
        url=twiml_url,
        status_callback=status_url,
        status_callback_method="POST",
        status_callback_event=["initiated", "ringing", "answered", "completed"],
    )
    return call.sid

# ----- Back-compat wrappers expected by main.py -----
def dial_out_to_number(transfer_id: str, number: str):
    """Dials a PSTN number like +1.../+91..."""
    return outbound_call_for_transfer(transfer_id, number)

def dial_out_to_sip(transfer_id: str, sip_uri: str):
    """Dials a SIP URI like sip:agent@example.com"""
    return outbound_call_for_transfer(transfer_id, sip_uri)
