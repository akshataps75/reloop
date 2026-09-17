import { CHAT_MESSAGES, CHAT_THREADS, LISTINGS } from './mock-data'
import { ChatMessage, ChatThread, Listing } from './types'

// Helper to simulate network latency
const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms))

export async function getListings(): Promise<Listing[]> {
  await delay()
  return [...LISTINGS]
}

export async function getListingById(id: number): Promise<Listing | undefined> {
  await delay()
  return LISTINGS.find((item) => item.id === id)
}

export async function createListing(newListing: Omit<Listing, 'id' | 'time'>): Promise<Listing> {
  await delay(500)
  const created: Listing = {
    ...newListing,
    id: Date.now(),
    time: 'Just now',
  }
  LISTINGS.unshift(created)
  return created
}

export async function getChatThreads(): Promise<ChatThread[]> {
  await delay()
  return [...CHAT_THREADS]
}

export async function getChatMessages(threadId: string): Promise<ChatMessage[]> {
  await delay()
  return CHAT_MESSAGES[threadId] || []
}

export async function sendMessage(threadId: string, text: string): Promise<ChatMessage> {
  await delay(200)
  const message: ChatMessage = {
    from: 'me',
    text,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    status: 'sent',
  }
  if (!CHAT_MESSAGES[threadId]) CHAT_MESSAGES[threadId] = []
  CHAT_MESSAGES[threadId].push(message)
  return message
}