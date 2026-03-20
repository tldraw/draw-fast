export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
}

export interface Chat {
  id: string
  title: string
  parentId: string | null
  parentMessageIndex: number | null // fork point in parent chat
  messages: ChatMessage[]
  createdAt: number
}

export interface ChatStore {
  chats: Record<string, Chat>
  rootChatId: string
}

const STORAGE_KEY = 'chat-links-store'

function generateId(): string {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36)
}

export function createMessage(
  role: ChatMessage['role'],
  content: string
): ChatMessage {
  return {
    id: generateId(),
    role,
    content,
    timestamp: Date.now(),
  }
}

export function createChat(
  title: string,
  parentId: string | null = null,
  parentMessageIndex: number | null = null,
  inheritedMessages: ChatMessage[] = []
): Chat {
  return {
    id: generateId(),
    title,
    parentId,
    parentMessageIndex,
    messages: inheritedMessages.map((m) => ({ ...m, id: generateId() })),
    createdAt: Date.now(),
  }
}

export function loadStore(): ChatStore {
  if (typeof window === 'undefined') {
    const rootChat = createChat('Главный чат')
    return { chats: { [rootChat.id]: rootChat }, rootChatId: rootChat.id }
  }
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (data) {
      return JSON.parse(data)
    }
  } catch {
    // ignore
  }
  const rootChat = createChat('Главный чат')
  return { chats: { [rootChat.id]: rootChat }, rootChatId: rootChat.id }
}

export function saveStore(store: ChatStore): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

export function getChildren(
  store: ChatStore,
  chatId: string
): Chat[] {
  return Object.values(store.chats).filter((c) => c.parentId === chatId)
}

export function getAncestors(store: ChatStore, chatId: string): Chat[] {
  const ancestors: Chat[] = []
  let current = store.chats[chatId]
  while (current?.parentId) {
    current = store.chats[current.parentId]
    if (current) ancestors.unshift(current)
  }
  return ancestors
}

// Parse internal links: [[chatId|display text]]
export function parseLinks(
  content: string
): Array<{ type: 'text' | 'link'; value: string; chatId?: string }> {
  const parts: Array<{ type: 'text' | 'link'; value: string; chatId?: string }> = []
  const regex = /\[\[([^\]|]+)\|([^\]]+)\]\]/g
  let lastIndex = 0
  let match

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', value: content.slice(lastIndex, match.index) })
    }
    parts.push({ type: 'link', value: match[2], chatId: match[1] })
    lastIndex = regex.lastIndex
  }

  if (lastIndex < content.length) {
    parts.push({ type: 'text', value: content.slice(lastIndex) })
  }

  return parts
}

export function createInternalLink(chatId: string, title: string): string {
  return `[[${chatId}|${title}]]`
}
