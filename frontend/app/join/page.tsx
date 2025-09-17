'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import LiveRoom from '../../components/LiveRoom';


const BK = process.env.NEXT_PUBLIC_BACKEND_URL!;
const LK = process.env.NEXT_PUBLIC_LIVEKIT_URL!;

export default function JoinCaller() {
  const [name, setName] = useState('caller-' + Math.floor(Math.random() * 9999));
  const [roomA, setRoomA] = useState('room-a');
  const [transferId, setTransferId] = useState('tx-' + Math.floor(Math.random() * 9999));

  const [tokenA, setTokenA] = useState<string>();
  const [tokenB, setTokenB] = useState<string>();
  const [roomB, setRoomB] = useState<string>();

  const pollTimer = useRef<NodeJS.Timeout | null>(null);

  async function joinA() {
    try {
      const res = await fetch(`${BK}/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identity: name, room: roomA, role: 'caller' }),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Token error: ${res.status} ${txt}`);
      }
      const data = await res.json();
      setTokenA(data.token);
    } catch (e: any) {
      alert(e?.message ?? 'Failed to join Room A');
    }
  }

  // 🔄 Poll ONLY after caller is in Room A, and ignore 404 silently
  useEffect(() => {
    // clear on unmount / id change
    const clear = () => {
      if (pollTimer.current) {
        clearInterval(pollTimer.current);
        pollTimer.current = null;
      }
    };

    if (!tokenA) {
      clear();
      return;
    }

    // start polling
    pollTimer.current = setInterval(async () => {
      try {
        const r = await fetch(`${BK}/transfer/status?transfer_id=${encodeURIComponent(transferId)}`);
        if (r.status === 404) {
          // transfer abhi init nahi hua — ignore
          return;
        }
        if (!r.ok) {
          // koi aur server error — optionally console me log kar do, UI pe toast mat dikhana
          // console.warn('status poll error', r.status);
          return;
        }
        const d = await r.json();
        if (d?.callerTokenB && d?.roomB) {
          setTokenB(d.callerTokenB);
          setRoomB(d.roomB);
          clear(); // stop polling once we have Room B
        }
      } catch {
        // network hiccup — silently ignore
      }
    }, 2000);

    return clear;
  }, [tokenA, transferId]);

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="card rounded-2xl p-5 space-y-3">
        <div className="label">Your Name</div>
        <input className="input p-2 rounded-lg" value={name} onChange={(e) => setName(e.target.value)} />
        <div className="label">Room A</div>
        <input className="input p-2 rounded-lg" value={roomA} onChange={(e) => setRoomA(e.target.value)} />
        <div className="label">Transfer ID (share this with Agent A)</div>
        <input className="input p-2 rounded-lg" value={transferId} onChange={(e) => setTransferId(e.target.value)} />
        <button onClick={joinA} className="btn px-4 py-2 rounded-lg">Join Room A</button>
        <p className="text-xs opacity-70">Tip: Share Transfer ID <b>{transferId}</b> with Agent A.</p>
      </div>

      <div className="card rounded-2xl p-5">
        {!tokenA ? (
          <p className="opacity-75">Join Room A to begin the call.</p>
        ) : tokenB ? (
          <>
            <p className="mb-2">Warm transfer ready. Switching to <b>{roomB}</b>…</p>
            <LiveRoom token={tokenB} serverUrl={LK} />
          </>
        ) : (
          <>
            <p className="mb-2">Connected to Room A. If Agent A completes the transfer, you will automatically join Room B.</p>
            <LiveRoom token={tokenA} serverUrl={LK} />
          </>
        )}
      </div>
    </div>
  );
}
