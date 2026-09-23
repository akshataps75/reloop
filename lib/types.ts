export type Screen = 'auth' | 'home' | 'browse' | 'detail' | 'activity' | 'messages' | 'create' | 'profile' | 'sellerProfile' | 'sellingDetail'

export type MeetupStatus = 'none' | 'pending' | 'confirmed' | 'declined'

export type Meetup = {
  status: MeetupStatus
  date?: string
  time?: string
  place?: string
  code?: string
  requestedBy?: 'me' | 'them'
  doneByMe?: boolean
  doneByThem?: boolean
}

export type Listing = {
  id: number
  sellerId: number
  title: string
  category: string
  price: number
  distance: string
  image: string
  images?: string[]
  seller: string
  initials: string
  time: string
  description?: string
  clusterB?: boolean
  documentUrl?: string
  status?: 'active' | 'sold'
  soldOn?: string
  alreadyInterested?: boolean
  sellerVerified?: boolean
}

export type ChatThread = {
  id: string
  name: string
  initials: string
  preview: string
  time: string
  warm?: boolean
  role: 'selling' | 'buying'
  listingId: number
  listingTitle: string
  listingImage: string
}

export type ChatMessage = {
  from: 'me' | 'them'
  text: string
  time: string
  status?: 'sent' | 'delivered' | 'read'
}

export type SellerListingItem = {
  id: number
  title: string
  price: number
  image: string
  status: 'active' | 'sold'
  soldOn?: string
}

export type SellerProfile = {
  id: string
  name: string
  initials: string
  role: string
  verified: boolean
  stats: { listings: number; exchanges: number; rating: number }
  listings: SellerListingItem[]
}

export type InterestedBuyer = {
  threadId: string
  name: string
  initials: string
  interestedOn: string
}

export type SellingListingItem = {
  id: number
  title: string
  price: number
  image: string
  sub: string
  category: string
  condition: string
  description: string
  status: 'active' | 'sold'
  interestedBuyers: InterestedBuyer[]
  buyer?: InterestedBuyer & { boughtOn: string }
}

export type BuyingListingItem = {
  id: number
  listingId: number
  title: string
  price: number
  image: string
  sub: string
  pending?: boolean
}