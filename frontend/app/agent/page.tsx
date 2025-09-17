'use client';

import { useState } from 'react';
import LiveRoom from '../../components/LiveRoom';


const BK = process.env.NEXT_PUBLIC_BACKEND_URL!;
const LK = process.env.NEXT_PUBLIC_LIVEKIT_URL!;

export default function AgentA() {
  const [agentA, setAgentA]   = useState('agent-a');
  const [roomA, setRoomA]     = useState('room-a');
  const [tokenA, setTokenA]   = useState<string>();

  const [transferId, setTransferId] = useState('tx-1234');
  const [agentB, setAgentB]         = useState('agent-b');
  const [roomB, setRoomB]           = useState<string>();
  const [tokenAinB, setTokenAinB]   = useState<string>();
  const [tokenBinB, setTokenBinB]   = useState<string>();

  const [notes, setNotes]     = useState(
    'Customer reports intermittent connectivity drop since yesterday, modem rebooted twice, LOS blinking.'
  );
  const [summary, setSummary] = useState<string>();

  async function joinA() {
    try {
      const res = await fetch(`${BK}/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identity: agentA, room: roomA, role: 'agent' }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      console.log('tokenA len', data?.token?.length);
      setTokenA(data.token);
    } catch (e) {
      console.error('joinA failed:', e);
      alert('Join Room A failed. Check backend URL/env. See console for details.');
    }
  }

  async function initTransfer() {
  try {
    const res = await fetch(`${BK}/transfer/init`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transfer_id: transferId,
        room_a: roomA,
        agent_a: agentA,
        agent_b: agentB
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Failed to init transfer: ${res.status} - ${errText}`);
    }

    const data = await res.json();
    console.log("Transfer initialized:", data);

    setRoomB(data.roomB);
    setTokenAinB(data.agentATokenForRoomB);
    setTokenBinB(data.agentBTokenForRoomB);

  } catch (error) {
    console.error("Error initializing transfer:", error);
    alert("Failed to initialize transfer. Check backend logs.");
  }
}

  async function genSummary() {
    try {
      const res = await fetch(`${BK}/summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transfer_id: transferId,
          transcript_or_notes: notes,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setSummary(data.summary);
    } catch (e) {
      console.error('genSummary failed:', e);
      alert('Summary generation failed (see console).');
    }
  }

  async function complete() {
    try {
      const res = await fetch(`${BK}/transfer/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transfer_id: transferId,
          caller_identity: 'caller',
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      await res.json();
      alert('Transfer completed. Caller can now switch to Room B.');
    } catch (e) {
      console.error('complete failed:', e);
      alert('Complete Transfer failed (see console).');
    }
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div className="card rounded-2xl p-5 space-y-3">
          <div className="label">Agent A Name</div>
          <input className="input p-2 rounded-lg" value={agentA} onChange={e => setAgentA(e.target.value)} />
          <div className="label">Room A</div>
          <input className="input p-2 rounded-lg" value={roomA} onChange={e => setRoomA(e.target.value)} />
          <button className="btn px-4 py-2 rounded-lg" onClick={joinA}>Join Room A</button>
        </div>

        <div className="card rounded-2xl p-5 space-y-3">
          <h3 className="text-lg font-semibold">Warm Transfer</h3>

          <div className="label">Transfer ID (share with Caller)</div>
          <input className="input p-2 rounded-lg" value={transferId} onChange={e => setTransferId(e.target.value)} />

          <div className="label">Agent B Name</div>
          <input className="input p-2 rounded-lg" value={agentB} onChange={e => setAgentB(e.target.value)} />

          <button className="btn px-4 py-2 rounded-lg" onClick={initTransfer}>
            Initialize Transfer (Create Room B)
          </button>

          {roomB && (
            <div className="text-sm opacity-80">
              <div>Room B: <b>{roomB}</b></div>

              <div className="mt-2">
                <div className="label mb-1">LLM Brief Notes</div>
                <textarea
                  className="input p-2 rounded-lg w-full h-28"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
                <button className="btn px-3 py-2 rounded-lg mt-2" onClick={genSummary}>
                  Generate Summary
                </button>
              </div>

              <div className="mt-6 p-4 rounded-xl bg-[#0e1530] border border-[#22315f]">
                <h4 className="font-semibold mb-2">Optional: Twilio PSTN/SIP Dial-Out</h4>
                <p className="text-sm opacity-75 mb-2">
                  Dial a real phone number (E.164 like +1...) or a SIP URI (sip:agent@example.com).
                  Twilio will speak the summary, then connect.
                </p>
                <div className="grid gap-2 md:grid-cols-3">
                  <input id="twilioTarget" className="input p-2 rounded-lg md:col-span-2"
                         placeholder="+1XXXXXXXXXX or sip:agent@example.com" />
                  <button
                    className="btn px-3 py-2 rounded-lg"
                    onClick={async () => {
                      const to = (document.getElementById('twilioTarget') as HTMLInputElement)?.value;
                      if (!to) { alert('Enter destination'); return; }
                      try {
                        const r = await fetch(`${BK}/twilio/dial`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ transfer_id: transferId, to }),
                        });
                        if (r.ok) {
                          const d = await r.json();
                          alert('Dialing... Call SID: ' + d.call_sid);
                        } else {
                          const tx = await r.text();
                          alert('Dial failed: ' + tx);
                        }
                      } catch (e) {
                        console.error('twilio dial failed:', e);
                        alert('Dial failed (see console).');
                      }
                    }}
                  >
                    Dial via Twilio
                  </button>
                </div>
                <p className="text-xs opacity-60 mt-2">
                  Configure TWILIO_* vars in backend .env and expose your backend publicly (e.g., ngrok) for TwiML/status webhooks.
                </p>
              </div>

              {summary && (
                <div className="mt-3 p-3 rounded-lg bg-[#0c1430] border border-[#22315f]">
                  <div className="text-sm opacity-70 mb-1">LLM Summary</div>
                  <pre className="whitespace-pre-wrap">{summary}</pre>
                </div>
              )}

              <button className="btn px-3 py-2 rounded-lg mt-3" onClick={complete}>
                Complete Transfer (Move Caller)
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="card rounded-2xl p-5">
        {!tokenA ? (
          <p className="opacity-75">
            Join Room A to talk with the caller, then initialize a warm transfer.
          </p>
        ) : (
          <>
            <p className="mb-2">Connected to Room A.</p>
            <LiveRoom token={tokenA} serverUrl={LK} />
          </>
        )}
      </div>
    </div>
  );
}
