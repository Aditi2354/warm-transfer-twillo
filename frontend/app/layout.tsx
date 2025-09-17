import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Warm Transfer • LiveKit + LLM',
  description: 'Smooth warm handoffs with LiveKit and LLM summaries',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="max-w-6xl mx-auto p-6">
          <header className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">⚡ Warm Transfer</h1>
            <nav className="flex gap-4 text-sm text-blue-300">
              <a href="/" className="hover:underline">Home</a>
              <a href="/join" className="hover:underline">Caller</a>
              <a href="/agent" className="hover:underline">Agent A</a>
              <a href="/agent-b" className="hover:underline">Agent B</a>
            </nav>
          </header>
          {children}
        </div>
      </body>
    </html>
  )
}
