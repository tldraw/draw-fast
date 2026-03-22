'use client'

import React, { useState } from 'react'
import { useChatContext } from './ChatProvider'

export function ChatInput() {
  const [text, setText] = useState('')
  const { addMessage, simulateAssistant, currentChat } = useChatContext()

  if (!currentChat) return null

  const handleSend = () => {
    const trimmed = text.trim()
    if (!trimmed) return
    addMessage('user', trimmed)
    setText('')
    simulateAssistant(trimmed)
  }

  return (
    <div className="chat-input-container">
      <textarea
        className="chat-input"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
          }
        }}
        placeholder="Напишите сообщение... (Enter для отправки, Shift+Enter для переноса)"
        rows={2}
      />
      <button className="chat-send-btn" onClick={handleSend}>
        Отправить
      </button>
    </div>
  )
}
