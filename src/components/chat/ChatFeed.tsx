'use client'

import { getAncestors, parseLinks } from '@/lib/chatStore'
import React, { useEffect, useRef, useState } from 'react'
import { useChatContext } from './ChatProvider'

function MessageContent({ content }: { content: string }) {
  const { setCurrentChatId, store } = useChatContext()
  const parts = parseLinks(content)

  return (
    <span>
      {parts.map((part, i) => {
        if (part.type === 'link' && part.chatId) {
          const exists = !!store.chats[part.chatId]
          return (
            <button
              key={i}
              className={`internal-link ${!exists ? 'internal-link--dead' : ''}`}
              onClick={() => exists && setCurrentChatId(part.chatId!)}
              title={exists ? `Перейти: ${part.value}` : 'Чат удалён'}
            >
              🔗 {part.value}
            </button>
          )
        }
        return <span key={i}>{part.value}</span>
      })}
    </span>
  )
}

function ForkDialog({
  onConfirm,
  onCancel,
}: {
  onConfirm: (title: string) => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState('')
  return (
    <div className="fork-dialog">
      <input
        className="fork-input"
        type="text"
        placeholder="Название ветки..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && title.trim()) onConfirm(title.trim())
          if (e.key === 'Escape') onCancel()
        }}
        autoFocus
      />
      <button
        className="fork-confirm"
        onClick={() => title.trim() && onConfirm(title.trim())}
      >
        Создать
      </button>
      <button className="fork-cancel" onClick={onCancel}>
        ✕
      </button>
    </div>
  )
}

export function ChatFeed() {
  const { store, currentChat, currentChatId, forkChat, setCurrentChatId, renameChat } =
    useChatContext()
  const feedRef = useRef<HTMLDivElement>(null)
  const [forkingIndex, setForkingIndex] = useState<number | null>(null)
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleValue, setTitleValue] = useState('')

  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight
    }
  }, [currentChat?.messages.length])

  if (!currentChat) {
    return <div className="chat-feed-empty">Выберите чат</div>
  }

  const ancestors = getAncestors(store, currentChatId)
  const breadcrumbs = [...ancestors, currentChat]

  return (
    <div className="chat-feed-container">
      {/* Breadcrumb navigation */}
      <div className="chat-breadcrumbs">
        {breadcrumbs.map((chat, i) => (
          <React.Fragment key={chat.id}>
            {i > 0 && <span className="breadcrumb-sep">→</span>}
            <button
              className={`breadcrumb-item ${
                chat.id === currentChatId ? 'breadcrumb-item--active' : ''
              }`}
              onClick={() => setCurrentChatId(chat.id)}
            >
              {chat.title}
            </button>
          </React.Fragment>
        ))}
      </div>

      {/* Chat title */}
      <div className="chat-title-bar">
        {editingTitle ? (
          <input
            className="chat-title-input"
            value={titleValue}
            onChange={(e) => setTitleValue(e.target.value)}
            onBlur={() => {
              if (titleValue.trim()) renameChat(currentChatId, titleValue.trim())
              setEditingTitle(false)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (titleValue.trim()) renameChat(currentChatId, titleValue.trim())
                setEditingTitle(false)
              }
            }}
            autoFocus
          />
        ) : (
          <h1
            className="chat-title"
            onDoubleClick={() => {
              setTitleValue(currentChat.title)
              setEditingTitle(true)
            }}
          >
            {currentChat.title}
            {currentChat.parentId && (
              <span className="chat-fork-badge">ветка</span>
            )}
          </h1>
        )}
        {currentChat.parentId && currentChat.parentMessageIndex !== null && (
          <span className="chat-fork-info">
            Форк от сообщения #{currentChat.parentMessageIndex + 1} в{' '}
            <button
              className="internal-link"
              onClick={() => setCurrentChatId(currentChat.parentId!)}
            >
              {store.chats[currentChat.parentId]?.title || 'родительский чат'}
            </button>
          </span>
        )}
      </div>

      {/* Messages */}
      <div className="chat-feed" ref={feedRef}>
        {currentChat.messages.length === 0 && (
          <div className="chat-empty">
            Начните разговор. Напишите сообщение ниже.
          </div>
        )}
        {currentChat.messages.map((msg, index) => (
          <div key={msg.id} className={`chat-message chat-message--${msg.role}`}>
            <div className="message-header">
              <span className="message-role">
                {msg.role === 'user'
                  ? '👤 Вы'
                  : msg.role === 'assistant'
                    ? '🤖 Ассистент'
                    : '🔔 Система'}
              </span>
              <span className="message-time">
                {new Date(msg.timestamp).toLocaleTimeString('ru-RU', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
              {msg.role !== 'system' && (
                <button
                  className="fork-btn"
                  onClick={() => setForkingIndex(index)}
                  title="Создать ветку от этого сообщения"
                >
                  ⑂
                </button>
              )}
            </div>
            <div className="message-content">
              <MessageContent content={msg.content} />
            </div>
            {forkingIndex === index && (
              <ForkDialog
                onConfirm={(title) => {
                  forkChat(index, title)
                  setForkingIndex(null)
                }}
                onCancel={() => setForkingIndex(null)}
              />
            )}
            {/* Show fork indicators */}
            {Object.values(store.chats)
              .filter(
                (c) =>
                  c.parentId === currentChatId &&
                  c.parentMessageIndex === index
              )
              .map((forkedChat) => (
                <button
                  key={forkedChat.id}
                  className="fork-indicator"
                  onClick={() => setCurrentChatId(forkedChat.id)}
                >
                  ↳ {forkedChat.title}
                </button>
              ))}
          </div>
        ))}
      </div>
    </div>
  )
}
