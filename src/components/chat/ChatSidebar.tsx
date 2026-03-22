'use client'

import { Chat, getChildren } from '@/lib/chatStore'
import React, { useState } from 'react'
import { useChatContext } from './ChatProvider'

function TreeNode({ chat, depth = 0 }: { chat: Chat; depth?: number }) {
  const { store, currentChatId, setCurrentChatId, deleteChat } = useChatContext()
  const children = getChildren(store, chat.id)
  const [expanded, setExpanded] = useState(true)
  const isActive = currentChatId === chat.id
  const hasChildren = children.length > 0

  return (
    <div>
      <div
        className={`tree-node ${isActive ? 'tree-node--active' : ''}`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        <button
          className="tree-toggle"
          onClick={() => setExpanded(!expanded)}
          style={{ visibility: hasChildren ? 'visible' : 'hidden' }}
        >
          {expanded ? '▾' : '▸'}
        </button>
        <button
          className="tree-label"
          onClick={() => setCurrentChatId(chat.id)}
          title={chat.title}
        >
          <span className="tree-icon">{chat.parentId ? '↳' : '◉'}</span>
          <span className="tree-title">{chat.title}</span>
        </button>
        {chat.parentId && (
          <button
            className="tree-delete"
            onClick={(e) => {
              e.stopPropagation()
              deleteChat(chat.id)
            }}
            title="Удалить"
          >
            ×
          </button>
        )}
      </div>
      {expanded &&
        children
          .sort((a, b) => a.createdAt - b.createdAt)
          .map((child) => (
            <TreeNode key={child.id} chat={child} depth={depth + 1} />
          ))}
    </div>
  )
}

export function ChatSidebar() {
  const { store, createNewChat, currentChatId } = useChatContext()
  const rootChat = store.chats[store.rootChatId]

  return (
    <div className="chat-sidebar">
      <div className="sidebar-header">
        <h2>Чаты</h2>
        <button
          className="new-chat-btn"
          onClick={() => createNewChat('Новый чат', currentChatId)}
          title="Новый дочерний чат"
        >
          +
        </button>
      </div>
      <div className="sidebar-tree">
        {rootChat && <TreeNode chat={rootChat} />}
      </div>
      <div className="sidebar-footer">
        <span className="sidebar-count">
          {Object.keys(store.chats).length} чатов
        </span>
      </div>
    </div>
  )
}
