'use client'

import { ChatFeed } from '@/components/chat/ChatFeed'
import { ChatInput } from '@/components/chat/ChatInput'
import { ChatProvider } from '@/components/chat/ChatProvider'
import { ChatSidebar } from '@/components/chat/ChatSidebar'
import './chat.css'

export default function ChatPage() {
  return (
    <ChatProvider>
      <div className="chat-app">
        <ChatSidebar />
        <div className="chat-main">
          <ChatFeed />
          <ChatInput />
        </div>
      </div>
    </ChatProvider>
  )
}
