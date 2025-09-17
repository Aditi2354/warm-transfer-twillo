'use client';

import { useState } from 'react';
import LiveRoom from '../../components/LiveRoom';


const BK = process.env.NEXT_PUBLIC_BACKEND_URL!;
const LK = process.env.NEXT_PUBLIC_LIVEKIT_URL!;

export default function AgentB() {
  const [agentB, setAgentB] = useState('agent-b');
  const [transferId, setTransferId] = useState('tx-1234');

  const [roomB, setRoomB] = useState<string>('');
  const [summary, setSummary] = useState<string>('');
  const [tokenB, setTokenB] = useState<string>();
  const [loading, setLoading] = useState(false);

  async function joinB() {
    try {
      setLoading(true);

      // 1) transfer status lao (Agent A ne init kiya hoga)
      const r = await fetch(`${BK}/transfer/status?transfer_id=${encodeURIComponent(transferId)}`);
      if (!r.ok) {
        const msg = await r.text();
        throw new Error(msg || 'transfer not found');
      }
      const d = await r.json();
      if (!d?.roomB) throw new Error('Room B not ready yet. Ask Agent A to initialize.');

      setRoomB(d.roomB);
      setSummary(d.summary || '');

      // 2) Agent B ke liye token
      const t = await fetch(`${BK}/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identity: agentB, room: d.roomB, role: 'agent' }),
      });
      if (!t.ok) throw new Error(await t.text());
      const tj = await t.json();
      setTokenB(tj.token);
      console.log('AgentB token len:', tj?.token?.length);
    } catch (e: any) {
      console.error('joinB failed:', e);
      alert(`Join Room B failed: ${e?.message || e}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="card rounded-2xl p-5 space-y-3">
        <div className="label">Agent B Name</div>
        <input
          className="input p-2 rounded-lg"
          value={agentB}
          onChange={(e) => setAgentB(e.target.value)}
        />

        <div className="label">Transfer ID</div>
        <input
          className="input p-2 rounded-lg"
          value={transferId}
          onChange={(e) => setTransferId(e.target.value)}
        />

        <button className="btn px-4 py-2 rounded-lg" onClick={joinB} disabled={loading}>
          {loading ? 'Joining…' : 'Join Room B'}
        </button>

        {summary && (
          <div className="mt-3 p-3 rounded-lg bg-[#0c1430] border border-[#22315f]">
            <div className="text-sm opacity-70 mb-1">Agent A Briefing Summary</div>
            <pre className="whitespace-pre-wrap">{summary}</pre>
          </div>
        )}
      </div>

      <div className="card rounded-2xl p-5">
        {!tokenB ? (
          <p className="opacity-75">
            Enter the Transfer ID shared by Agent A, then join Room B to receive the context and continue the call.
          </p>
        ) : (
          <>
            <p className="mb-2">
              Connected to Room B: <b>{roomB}</b>
            </p>
            <LiveRoom token={tokenB} serverUrl={LK} />
          </>
        )}
      </div>
    </div>
  );
}
