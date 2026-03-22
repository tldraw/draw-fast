'use client'

import { getAncestors, parseLinks, splitByKeywords } from '@/lib/chatStore'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useChatContext } from './ChatProvider'

function MessageContent({ content }: { content: string }) {
  const { setCurrentChatId, store } = useChatContext()

  // First pass: parse [[chatId|title]] links
  const linkParts = parseLinks(content)

  return (
    <span>
      {linkParts.map((part, i) => {
        if (part.type === 'link' && part.chatId) {
          const exists = !!store.chats[part.chatId]
          return (
            <button
              key={i}
              className={`internal-link ${!exists ? 'internal-link--dead' : ''}`}
              onClick={() => exists && setCurrentChatId(part.chatId!)}
              title={exists ? `Перейти: ${part.value}` : 'Чат удалён'}
            >
              {part.value}
            </button>
          )
        }
        // Second pass: highlight keywords in plain text
        const keywordParts = splitByKeywords(part.value, store.keywords)
        return (
          <React.Fragment key={i}>
            {keywordParts.map((kp, j) => {
              if (kp.type === 'keyword' && kp.chatId) {
                const exists = !!store.chats[kp.chatId]
                return (
                  <button
                    key={j}
                    className={`internal-link ${!exists ? 'internal-link--dead' : ''}`}
                    onClick={() => exists && setCurrentChatId(kp.chatId!)}
                    title={exists ? `Перейти в чат: ${kp.value}` : 'Чат удалён'}
                  >
                    {kp.value}
                  </button>
                )
              }
              return <span key={j}>{kp.value}</span>
            })}
          </React.Fragment>
        )
      })}
    </span>
  )
}

function SelectionPopup({
  x,
  y,
  selectedText,
  onSubmit,
  onClose,
}: {
  x: number
  y: number
  selectedText: string
  onSubmit: (prompt: string) => void
  onClose: () => void
}) {
  const [prompt, setPrompt] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Focus after a tick so the selection doesn't get cleared
    const t = setTimeout(() => inputRef.current?.focus(), 50)
    return () => clearTimeout(t)
  }, [])

  return (
    <div
      className="selection-popup"
      style={{ left: x, top: y }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <span className="selection-popup-label">{selectedText}</span>
      <input
        ref={inputRef}
        className="selection-popup-input"
        type="text"
        placeholder="О чём спросить..."
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && prompt.trim()) {
            onSubmit(prompt.trim())
          }
          if (e.key === 'Escape') {
            onClose()
          }
        }}
      />
      <button
        className="selection-popup-send"
        onClick={() => prompt.trim() && onSubmit(prompt.trim())}
      >
        →
      </button>
    </div>
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
  const {
    store,
    currentChat,
    currentChatId,
    forkChat,
    forkFromSelection,
    setCurrentChatId,
    renameChat,
  } = useChatContext()
  const feedRef = useRef<HTMLDivElement>(null)
  const [forkingIndex, setForkingIndex] = useState<number | null>(null)
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleValue, setTitleValue] = useState('')

  // Selection popup state
  const [selectionPopup, setSelectionPopup] = useState<{
    x: number
    y: number
    text: string
    messageIndex: number
  } | null>(null)

  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight
    }
  }, [currentChat?.messages.length])

  // Detect text selection inside messages
  const handleMouseUp = useCallback(() => {
    const selection = window.getSelection()
    if (!selection || selection.isCollapsed || !selection.toString().trim()) {
      return
    }

    const text = selection.toString().trim()
    if (text.length < 2 || text.length > 100) {
      setSelectionPopup(null)
      return
    }

    // Find which message the selection is in
    const anchorNode = selection.anchorNode
    if (!anchorNode) return

    let messageEl: HTMLElement | null = null
    let node: Node | null = anchorNode
    while (node) {
      if (node instanceof HTMLElement && node.classList.contains('chat-message')) {
        messageEl = node
        break
      }
      node = node.parentNode
    }

    if (!messageEl) return

    const indexStr = messageEl.getAttribute('data-index')
    if (indexStr === null) return

    const range = selection.getRangeAt(0)
    const rect = range.getBoundingClientRect()

    setSelectionPopup({
      x: rect.left + rect.width / 2 - 25,
      y: rect.top - 40,
      text,
      messageIndex: parseInt(indexStr, 10),
    })
  }, [])

  const handleMouseDown = useCallback(() => {
    setSelectionPopup(null)
  }, [])

  useEffect(() => {
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [handleMouseDown])

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
            {i > 0 && <span className="breadcrumb-sep">/</span>}
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
      <div className="chat-feed" ref={feedRef} onMouseUp={handleMouseUp}>
        {currentChat.messages.length === 0 && (
          <div className="chat-empty">
            Начните разговор. Напишите сообщение ниже.
          </div>
        )}
        {currentChat.messages.map((msg, index) => (
          <div
            key={msg.id}
            className={`chat-message chat-message--${msg.role}`}
            data-index={index}
          >
            <div className="message-header">
              <span className="message-role">
                {msg.role === 'user'
                  ? 'Вы'
                  : msg.role === 'assistant'
                    ? 'Ассистент'
                    : 'Система'}
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

      {/* Selection popup */}
      {selectionPopup && (
        <SelectionPopup
          x={selectionPopup.x}
          y={selectionPopup.y}
          selectedText={selectionPopup.text}
          onSubmit={(prompt) => {
            forkFromSelection(selectionPopup.text, selectionPopup.messageIndex, prompt)
            setSelectionPopup(null)
            window.getSelection()?.removeAllRanges()
          }}
          onClose={() => {
            setSelectionPopup(null)
            window.getSelection()?.removeAllRanges()
          }}
        />
      )}
    </div>
  )
}
