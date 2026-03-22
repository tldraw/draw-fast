import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Chat Links — Навигация по чатам',
  description: 'Прототип чат-оболочки с внутренними гиперссылками',
}

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`
        html, body {
          overflow: visible !important;
          touch-action: auto !important;
          overscroll-behavior: auto !important;
        }
      `}</style>
      {children}
    </>
  )
}
