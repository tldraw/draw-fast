'use client'

import {
  Chat,
  ChatMessage,
  ChatStore,
  createChat,
  createInternalLink,
  createMessage,
  loadStore,
  saveStore,
} from '@/lib/chatStore'
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'

interface ChatContextType {
  store: ChatStore
  currentChatId: string
  setCurrentChatId: (id: string) => void
  currentChat: Chat | null
  addMessage: (role: ChatMessage['role'], content: string) => void
  forkChat: (messageIndex: number, title?: string) => string
  forkFromSelection: (selectedText: string, messageIndex: number, prompt: string) => string
  createNewChat: (title: string, parentId?: string | null) => string
  deleteChat: (chatId: string) => void
  renameChat: (chatId: string, title: string) => void
  simulateAssistant: (userMessage: string) => void
}

const ChatContext = createContext<ChatContextType | null>(null)

export function useChatContext() {
  const ctx = useContext(ChatContext)
  if (!ctx) throw new Error('useChatContext must be used within ChatProvider')
  return ctx
}

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [store, setStore] = useState<ChatStore>(() => loadStore())
  const [currentChatId, setCurrentChatId] = useState<string>(store.rootChatId)
  const storeRef = useRef(store)
  storeRef.current = store

  useEffect(() => {
    saveStore(store)
  }, [store])

  const updateStore = useCallback((updater: (s: ChatStore) => ChatStore) => {
    setStore((prev) => {
      const next = updater(prev)
      return next
    })
  }, [])

  const currentChat = store.chats[currentChatId] || null

  const addMessage = useCallback(
    (role: ChatMessage['role'], content: string) => {
      updateStore((s) => {
        const chat = s.chats[currentChatId]
        if (!chat) return s
        return {
          ...s,
          chats: {
            ...s.chats,
            [currentChatId]: {
              ...chat,
              messages: [...chat.messages, createMessage(role, content)],
            },
          },
        }
      })
    },
    [currentChatId, updateStore]
  )

  const forkChat = useCallback(
    (messageIndex: number, title?: string): string => {
      const parentChat = storeRef.current.chats[currentChatId]
      if (!parentChat) return currentChatId

      const inheritedMessages = parentChat.messages.slice(0, messageIndex + 1)
      const forkTitle = title || `Ветка: ${parentChat.title}`
      const newChat = createChat(forkTitle, currentChatId, messageIndex, inheritedMessages)

      // Add a system link message in the parent chat
      const linkMsg = createMessage(
        'system',
        `Создана ветка: ${createInternalLink(newChat.id, forkTitle)}`
      )

      updateStore((s) => ({
        ...s,
        chats: {
          ...s.chats,
          [newChat.id]: newChat,
          [currentChatId]: {
            ...s.chats[currentChatId],
            messages: [...s.chats[currentChatId].messages, linkMsg],
          },
        },
      }))

      setCurrentChatId(newChat.id)
      return newChat.id
    },
    [currentChatId, updateStore]
  )

  const forkFromSelection = useCallback(
    (selectedText: string, messageIndex: number, prompt: string): string => {
      const parentChat = storeRef.current.chats[currentChatId]
      if (!parentChat) return currentChatId

      const inheritedMessages = parentChat.messages.slice(0, messageIndex + 1)
      const newChat = createChat(selectedText, currentChatId, messageIndex, inheritedMessages)

      // Add the user's prompt as the first new message in the forked chat
      const userMsg = createMessage('user', prompt)
      newChat.messages.push(userMsg)

      const linkMsg = createMessage(
        'system',
        `Создана ветка: ${createInternalLink(newChat.id, selectedText)}`
      )

      const newChatId = newChat.id

      updateStore((s) => ({
        ...s,
        chats: {
          ...s.chats,
          [newChatId]: newChat,
          [currentChatId]: {
            ...s.chats[currentChatId],
            messages: [...s.chats[currentChatId].messages, linkMsg],
          },
        },
        keywords: {
          ...s.keywords,
          [selectedText]: newChatId,
        },
      }))

      setCurrentChatId(newChatId)

      // Simulate assistant response in the new chat
      setTimeout(() => {
        const response = `Вы спросили про "${selectedText}": "${prompt}"\n\nДавайте разберём это подробнее. Этот чат унаследовал контекст из родительского разговора, так что мы можем продолжить с того места, где остановились.`
        setStore((prev) => {
          const c = prev.chats[newChatId]
          if (!c) return prev
          return {
            ...prev,
            chats: {
              ...prev.chats,
              [newChatId]: {
                ...c,
                messages: [...c.messages, createMessage('assistant', response)],
              },
            },
          }
        })
      }, 500)

      return newChatId
    },
    [currentChatId, updateStore]
  )

  const createNewChat = useCallback(
    (title: string, parentId: string | null = null): string => {
      const newChat = createChat(title, parentId)

      // If parent, add link in parent
      if (parentId && storeRef.current.chats[parentId]) {
        const linkMsg = createMessage(
          'system',
          `Новый чат: ${createInternalLink(newChat.id, title)}`
        )
        updateStore((s) => ({
          ...s,
          chats: {
            ...s.chats,
            [newChat.id]: newChat,
            [parentId]: {
              ...s.chats[parentId],
              messages: [...s.chats[parentId].messages, linkMsg],
            },
          },
        }))
      } else {
        updateStore((s) => ({
          ...s,
          chats: { ...s.chats, [newChat.id]: newChat },
        }))
      }

      setCurrentChatId(newChat.id)
      return newChat.id
    },
    [updateStore]
  )

  const deleteChat = useCallback(
    (chatId: string) => {
      if (chatId === store.rootChatId) return
      updateStore((s) => {
        const newChats = { ...s.chats }
        // Delete chat and all descendants
        const toDelete = [chatId]
        while (toDelete.length > 0) {
          const id = toDelete.pop()!
          delete newChats[id]
          Object.values(s.chats)
            .filter((c) => c.parentId === id)
            .forEach((c) => toDelete.push(c.id))
        }
        return { ...s, chats: newChats }
      })
      if (currentChatId === chatId) {
        setCurrentChatId(store.rootChatId)
      }
    },
    [currentChatId, store.rootChatId, updateStore]
  )

  const renameChat = useCallback(
    (chatId: string, title: string) => {
      updateStore((s) => ({
        ...s,
        chats: {
          ...s.chats,
          [chatId]: { ...s.chats[chatId], title },
        },
      }))
    },
    [updateStore]
  )

  const simulateAssistant = useCallback(
    (userMessage: string) => {
      const chat = storeRef.current.chats[currentChatId]
      if (!chat) return

      const isForked = chat.parentId !== null
      const msgCount = chat.messages.length

      let response: string
      if (msgCount <= 1) {
        response = isForked
          ? `Это ветка от "${storeRef.current.chats[chat.parentId!]?.title || 'родительского чата'}". Контекст унаследован. Продолжим обсуждение "${chat.title}".\n\nО чём именно хотите поговорить в этой ветке?`
          : `Привет! Я готов обсуждать "${userMessage}". Вы можете в любой момент создать ветку разговора, нажав на кнопку форка рядом с любым сообщением, или вставить ссылку на другой чат.`
      } else {
        const tips = [
          'Кстати, вы можете форкнуть этот разговор в любом месте, чтобы исследовать альтернативную тему.',
          'Если хотите углубиться в эту тему — создайте ветку от этого сообщения.',
          'Интересная мысль! Можно создать отдельную ветку для детального обсуждения.',
          'Продолжаем. Помните, что все ветки доступны в дереве навигации слева.',
        ]
        response = `Вы написали: "${userMessage}"\n\n${tips[msgCount % tips.length]}`
      }

      // Delayed response to simulate thinking
      setTimeout(() => {
        setStore((prev) => {
          const c = prev.chats[currentChatId]
          if (!c) return prev
          return {
            ...prev,
            chats: {
              ...prev.chats,
              [currentChatId]: {
                ...c,
                messages: [...c.messages, createMessage('assistant', response)],
              },
            },
          }
        })
      }, 500)
    },
    [currentChatId]
  )

  return (
    <ChatContext.Provider
      value={{
        store,
        currentChatId,
        setCurrentChatId,
        currentChat,
        addMessage,
        forkChat,
        forkFromSelection,
        createNewChat,
        deleteChat,
        renameChat,
        simulateAssistant,
      }}
    >
      {children}
    </ChatContext.Provider>
  )
}
