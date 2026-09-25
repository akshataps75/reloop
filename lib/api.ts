import { ChatMessage, ChatThread, Listing } from './types'
import { getToken } from './auth'
import type { Meetup } from './types'
import { getStoredUser } from './auth'
import type { AuthUser } from './auth'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
const delay = (ms = 200) => new Promise((resolve) => setTimeout(resolve, ms))

function authHeaders(): Record<string, string> {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function timeAgoShort(iso: string): string {
  return iso ? timeAgo(iso) : ''
}

function formatDistance(km: number | null | undefined): string {
  if (km === null || km === undefined) return ''
  if (km < 1) return `${Math.round(km * 1000)} m away`
  return `${km.toFixed(1)} km away`
}

// Maps a raw backend listing row (snake_case, DB-shaped) to the frontend Listing type.
function adaptListing(row: any): Listing {
  return {
    id: row.id,
    sellerId: row.seller_id,
    title: row.title,
    category: row.category,
    price: Number(row.price),
    distance: formatDistance(row.distance_km !== null && row.distance_km !== undefined ? Number(row.distance_km) : null),    image: row.image || '',
    images: Array.isArray(row.images) && row.images.length > 0 ? row.images : undefined,
    seller: row.seller,
    initials: row.seller_initials,
    time: row.created_at ? timeAgo(row.created_at) : '',
    description: row.description ?? undefined,
    condition: row.condition ?? undefined,
    clusterB: row.cluster === 'B',
    documentUrl: row.document_url ?? undefined,
    status: row.status,
    soldOn: row.sold_on ?? undefined,
    alreadyInterested: Boolean(row.alreadyInterested),
    sellerVerified: Boolean(row.seller_verified),
  }
}

// --- Threads / messages ---
function adaptThread(row: any): ChatThread {
  return {
    id: String(row.id),
    name: row.name,
    initials: row.initials,
    preview: row.preview ?? '',
    time: row.last_message_at ? timeAgo(row.last_message_at) : '',
    role: row.role,
    listingId: row.listing_id,
    listingTitle: row.listing_title,
    listingImage: row.listing_image,
  }
}

function adaptMessage(row: any, currentUserId: number): ChatMessage {
  return {
    from: row.sender_id === currentUserId ? 'me' : 'them',
    text: row.text,
    time: new Date(row.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    status: row.status,
  }
}

async function handle(res: Response) {
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || data.message || 'Request failed')
  return data
}

export async function getClusterThresholds(): Promise<Record<string, number>> {
  const res = await fetch(`${API_BASE}/api/listings/thresholds`)
  return handle(res)
}

export async function getCategoryCounts(): Promise<Record<string, number>> {
  const res = await fetch(`${API_BASE}/api/listings/category-counts`)
  return handle(res)
}

export async function getListings(opts?: { lat?: number; lng?: number }): Promise<Listing[]> {
  const params = new URLSearchParams()
  if (opts?.lat !== undefined && opts?.lng !== undefined) {
    params.set('lat', String(opts.lat))
    params.set('lng', String(opts.lng))
  }
  const qs = params.toString()
  const res = await fetch(`${API_BASE}/api/listings${qs ? `?${qs}` : ''}`, { headers: authHeaders() })
  const rows = await handle(res)
  return rows.map(adaptListing)
}

export async function getListingById(id: number, opts?: { lat?: number; lng?: number }): Promise<Listing | undefined> {
  const params = new URLSearchParams()
  if (opts?.lat !== undefined && opts?.lng !== undefined) {
    params.set('lat', String(opts.lat))
    params.set('lng', String(opts.lng))
  }
  const qs = params.toString()
  const res = await fetch(`${API_BASE}/api/listings/${id}${qs ? `?${qs}` : ''}`, { headers: authHeaders() })
  if (res.status === 404) return undefined
  const row = await handle(res)
  return adaptListing(row)
}

export async function createListing(newListing: {
  title: string
  category: string
  price: number
  description?: string
  condition?: string
  image?: string
  images?: string[]
  documentType?: string
  documentUrl?: string
  lat?: number
  lng?: number
}): Promise<Listing> {
  const res = await fetch(`${API_BASE}/api/listings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(newListing),
  })
  const row = await handle(res)
  return adaptListing(row)
}

export async function uploadFiles(files: File[]): Promise<string[]> {
  const formData = new FormData()
  files.forEach(file => formData.append('files', file))

  const res = await fetch(`${API_BASE}/api/uploads`, {
    method: 'POST',
    headers: authHeaders(), // no Content-Type here — the browser sets the correct
                             // multipart boundary automatically when body is FormData
    body: formData,
  })
  const data = await handle(res)
  return data.urls
}

// --- Verification (mock DigiLocker) ---
export async function startVerification(): Promise<void> {
  const res = await fetch(`${API_BASE}/api/verification/start`, {
    method: 'POST',
    headers: authHeaders(),
  })
  await handle(res)
}

export async function completeVerification(): Promise<void> {
  const res = await fetch(`${API_BASE}/api/verification/callback`, {
    method: 'POST',
    headers: authHeaders(),
  })
  await handle(res)
}

export async function updateProfile(updates: { phone?: string; address?: string; lat?: number; lng?: number }): Promise<AuthUser> {
  const res = await fetch(`${API_BASE}/api/auth/me`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(updates),
  })
  const data = await handle(res)
  return data.user
}

export async function getChatThreads(): Promise<ChatThread[]> {
  const res = await fetch(`${API_BASE}/api/threads`, { headers: authHeaders() })
  const rows = await handle(res)
  return rows.map(adaptThread)
}

export async function getChatMessages(threadId: string): Promise<ChatMessage[]> {
  const user = getStoredUser()
  const res = await fetch(`${API_BASE}/api/threads/${threadId}/messages`, { headers: authHeaders() })
  const rows = await handle(res)
  return rows.map((r: any) => adaptMessage(r, user?.id ?? -1))
}

export async function sendMessage(threadId: string, text: string): Promise<ChatMessage> {
  const user = getStoredUser()
  const res = await fetch(`${API_BASE}/api/threads/${threadId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ text }),
  })
  const row = await handle(res)
  return adaptMessage(row, user?.id ?? -1)
}

// listingId -> thread. Backend requires an existing interest record first.
export async function createThread(listingId: number): Promise<{ id: string }> {
  const res = await fetch(`${API_BASE}/api/threads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ listingId }),
  })
  const row = await handle(res)
  return { id: String(row.id) }
}

export async function expressInterest(listingId: number): Promise<void> {
  const res = await fetch(`${API_BASE}/api/listings/${listingId}/interest`, {
    method: 'POST',
    headers: authHeaders(),
  })
  await handle(res)
}

// --- Meetups ---
export async function getMeetup(threadId: string): Promise<Meetup> {
  const res = await fetch(`${API_BASE}/api/threads/${threadId}/meetup`, { headers: authHeaders() })
  return handle(res)
}

export async function proposeMeetup(threadId: string, date: string, time: string, place: string): Promise<Meetup> {
  const res = await fetch(`${API_BASE}/api/threads/${threadId}/meetup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ date, time, place }),
  })
  return handle(res)
}

export async function acceptMeetup(threadId: string): Promise<Meetup> {
  const res = await fetch(`${API_BASE}/api/threads/${threadId}/meetup/accept`, { method: 'POST', headers: authHeaders() })
  return handle(res)
}

export async function declineMeetup(threadId: string): Promise<Meetup> {
  const res = await fetch(`${API_BASE}/api/threads/${threadId}/meetup/decline`, { method: 'POST', headers: authHeaders() })
  return handle(res)
}

export async function confirmMeetupDone(threadId: string): Promise<Meetup> {
  const res = await fetch(`${API_BASE}/api/threads/${threadId}/meetup/confirm-done`, { method: 'POST', headers: authHeaders() })
  return handle(res)
}

export async function getMyActivity() {
  const res = await fetch(`${API_BASE}/api/me/activity`, { headers: authHeaders() })
  const data = await handle(res)
  return {
    selling: {
      active: data.selling.active.map((r: any) => ({
        id: r.id, title: r.title, price: Number(r.price), image: r.image || '', sub: 'Active',
      })),
      sold: data.selling.sold.map((r: any) => ({
        id: r.id, title: r.title, price: Number(r.price), image: r.image || '', sub: `Sold ${timeAgoShort(r.sold_on)}`,
      })),
    },
    buying: {
      ongoing: data.buying.ongoing.map((r: any) => ({
        id: r.listing_id, listingId: r.listing_id, title: r.title, price: Number(r.price),
        image: r.image || '', sub: `Interested ${timeAgoShort(r.interested_on)}`,
      })),
      completed: data.buying.completed.map((r: any) => ({
        id: r.listing_id, listingId: r.listing_id, title: r.title, price: Number(r.price),
        image: r.image || '', sub: `Bought ${timeAgoShort(r.sold_on)}`,
      })),
    },
  }
}

export async function getSellerProfile(userId: number) {
  const res = await fetch(`${API_BASE}/api/users/${userId}`)
  const row = await handle(res)
  const sold = row.listings.filter((l: any) => l.status === 'sold').length
  return {
    id: String(row.id),
    name: row.name,
    initials: row.initials,
    role: row.role ?? '',
    verified: row.verified,
    stats: { listings: row.listings.length, exchanges: sold, rating: 0 }, // rating has no backend source — see note
    listings: row.listings.map((l: any) => ({
      id: l.id, title: l.title, price: Number(l.price), image: l.image || '', status: l.status, soldOn: l.sold_on,
    })),
  }
}

export async function getInterestedBuyers(listingId: number) {
  const res = await fetch(`${API_BASE}/api/listings/${listingId}/interested`, { headers: authHeaders() })
  const rows = await handle(res)
  return rows.map((r: any) => ({
    threadId: String(r.thread_id),
    name: r.name,
    initials: r.initials,
    interestedOn: r.interested_on ? new Date(r.interested_on).toLocaleDateString() : '',
  }))
}

export async function searchLocations(query: string): Promise<{ name: string; addr: string; lat: number; lng: number }[]> {
  const res = await fetch(`${API_BASE}/api/geocode/search?q=${encodeURIComponent(query)}`)
  return handle(res)
}