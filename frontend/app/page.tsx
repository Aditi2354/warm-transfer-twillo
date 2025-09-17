export default function Home() {
  return (
    <main className="grid md:grid-cols-3 gap-6">
      <div className="card rounded-2xl p-6 shadow-lg">
        <h2 className="text-xl font-semibold mb-2">Caller</h2>
        <p className="text-sm opacity-80 mb-4">Join Room A and wait for a warm transfer to Room B.</p>
        <a className="btn inline-block px-4 py-2 rounded-lg" href="/join">Open Caller</a>
      </div>
      <div className="card rounded-2xl p-6 shadow-lg">
        <h2 className="text-xl font-semibold mb-2">Agent A</h2>
        <p className="text-sm opacity-80 mb-4">Talk to caller in Room A, generate LLM summary, then warm transfer to Agent B.</p>
        <a className="btn inline-block px-4 py-2 rounded-lg" href="/agent">Open Agent A</a>
      </div>
      <div className="card rounded-2xl p-6 shadow-lg">
        <h2 className="text-xl font-semibold mb-2">Agent B</h2>
        <p className="text-sm opacity-80 mb-4">Receive context in Room B and continue the call with caller.</p>
        <a className="btn inline-block px-4 py-2 rounded-lg" href="/agent-b">Open Agent B</a>
      </div>
    </main>
  )
}
