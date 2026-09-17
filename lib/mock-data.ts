import { ChatMessage, ChatThread, Listing, Meetup, SellerProfile} from './types'

export const CURRENT_USER = {
  name: 'Akshata Shrivastava',
  initials: 'AS',
  role: 'Student · MCA · Pune',
  verified: true,
  phone: '+91 98765 43210',
  address: '104, Sadafuli, DSK Ranwara Society, Bavdhan, Pune, 411021',
  stats: { listings: 12, exchanges: 28, rating: 4.9 },
}

export const CATEGORIES: [string, string, string][] = [
  ['Textbooks', '📚', '82 listings'],
  ['Electronics', '⌨', '64 listings'],
  ['Furniture', '⌂', '41 listings'],
  ['Cycles', '♢', '28 listings'],
  ['Sports', '◌', '19 listings'],
  ['More', '•••', 'Explore all'],
]

export const LISTINGS: Listing[] = [
  { id: 1, title: 'Engineering Mechanics', category: 'Textbooks', price: 350, distance: '0.8 km away', image: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=800&q=80', seller: 'Aarav M.', initials: 'AM', time: '2 hours ago' },
  { id: 2, title: 'Mechanical Keyboard', category: 'Electronics', price: 2200, distance: '1.2 km away', image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&q=80', seller: 'Ishita R.', initials: 'IR', time: '5 hours ago' , clusterB: true, documentUrl: '/mock-documents/warranty-card.pdf' },
  { id: 3, title: 'Study Table', category: 'Furniture', price: 1800, distance: '2.4 km away', image: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800&q=80', seller: 'Kabir S.', initials: 'KS', time: 'Yesterday' },
  { id: 4, title: 'Firefox Road Bike', category: 'Cycles', price: 8500, distance: '3.1 km away', image: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=800&q=80', seller: 'Naina P.', initials: 'NP', time: 'Yesterday' },
  { id: 5, title: 'Calculus — Thomas', category: 'Textbooks', price: 280, distance: '1.8 km away', image: 'https://images.unsplash.com/photo-1526243741027-444d633d7365?w=800&q=80', seller: 'Rohan K.', initials: 'RK', time: '2 days ago' },
  { id: 6, title: 'Ikea Floor Lamp', category: 'Furniture', price: 900, distance: '2.0 km away', image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&q=80', seller: 'Meera J.', initials: 'MJ', time: '2 days ago' },
]

export const categories = CATEGORIES
export const listings = LISTINGS

export const THRESHOLDS: Record<string, number> = {
  Textbooks: 2000,
  Electronics: 8000,
  Furniture: 5000,
  Cycles: 6000,
  Sports: 4000,
}

export const LOCATION_RESULTS = [
  {
    name: 'Kothrud',
    addr: 'Rambaug Colony, Pune',
    lat: 18.5074,
    lng: 73.8077,
  },
  {
    name: 'Baner',
    addr: 'Vasant Vihar Bungalows, Baner, Pune',
    lat: 18.559,
    lng: 73.7868,
  },
  {
    name: 'Pashan',
    addr: 'Samruddhi Society, Pashan, Pune',
    lat: 18.5412,
    lng: 73.7925,
  },
  {
    name: 'Bavdhan',
    addr: 'LMD Estate, Bavdhan, Pune',
    lat: 18.5158,
    lng: 73.7813,
  },
]

export const CHAT_THREADS: ChatThread[] = [
  { id: '1', name: 'Ishita R.', initials: 'IR', preview: 'Is this still available?', time: '10:42', role: 'selling', listingId: 2, listingTitle: 'Mechanical Keyboard', listingImage: LISTINGS[1].image },
  { id: '3', name: 'Rohan K.', initials: 'RK', preview: 'Can you do 2000?', time: 'Mon', role: 'selling', listingId: 2, listingTitle: 'Mechanical Keyboard', listingImage: LISTINGS[1].image },
  { id: '2', name: 'Naina P.', initials: 'NP', preview: 'Thanks for the quick reply!', time: 'Tue', warm: true, role: 'selling', listingId: 6, listingTitle: 'Ikea Floor Lamp', listingImage: LISTINGS[5].image },
  { id: '4', name: 'Kabir S.', initials: 'KS', preview: 'See you Saturday then', time: 'Wed', role: 'buying', listingId: 3, listingTitle: 'Study Table', listingImage: LISTINGS[2].image },
]

export const CHAT_MESSAGES: Record<string, ChatMessage[]> = {
  '1': [
    { from: 'them', text: 'Hi! Is this still available?', time: '10:42' },
    { from: 'me', text: 'Hey Ishita, yes it is. Would you like to see it this weekend?', time: '10:44', status: 'read' },
  ],
  '3': [
    { from: 'them', text: 'Can you do 2000?', time: 'Mon' },
  ],
  '2': [
    { from: 'them', text: 'Hey, interested in the cycle!', time: 'Tue' },
    { from: 'me', text: 'Great! Let me know when you want to check it out.', time: 'Tue', status: 'delivered' },
  ],
  '4': [
    { from: 'them', text: 'See you Saturday then', time: 'Wed' },
  ],
}

export const SELLING = {
  active: [
    {
      id: 1, title: 'Mechanical Keyboard', price: 2200, sub: '2 interested buyers',
      image: LISTINGS[1].image, category: 'Electronics', condition: 'Gently used',
      description: 'Gently used and well cared for. Happy to share more photos or answer any questions. Open to a quick meetup nearby.',
      status: 'active' as const,
      interestedBuyers: [
        { threadId: '1', name: 'Ishita R.', initials: 'IR', interestedOn: '16 Sep 2026' },
        { threadId: '3', name: 'Rohan K.', initials: 'RK', interestedOn: '14 Sep 2026' },
      ],
    },
    {
      id: 2, title: 'Ikea Floor Lamp', price: 900, sub: 'No interest yet',
      image: LISTINGS[5].image, category: 'Furniture', condition: 'Like new',
      description: 'Compact floor lamp, works perfectly, selling as I am shifting.',
      status: 'active' as const,
      interestedBuyers: [],
    },
  ],
  sold: [
    {
      id: 3, title: 'Engineering Mechanics', price: 350, sub: 'Sold on 5 August 2026',
      image: LISTINGS[0].image, category: 'Textbooks', condition: 'Used, all pages intact',
      description: 'Engineering Mechanics textbook, second-hand, no markings.',
      status: 'sold' as const,
      interestedBuyers: [],
      buyer: { threadId: '', name: 'Priya N.', initials: 'PN', interestedOn: '2 August 2026', boughtOn: '5 August 2026' },
    },
  ],
}

export const BUYING = {
  ongoing: [
    { id: 1, listingId: 3, title: 'Study Table', price: 1800, sub: 'Kabir S.', pending: false, image: LISTINGS[2].image },
    { id: 2, listingId: 4, title: 'Firefox Road Bike', price: 8500, sub: 'Naina P.', pending: true, image: LISTINGS[3].image },
  ],
  completed: [
    { id: 3, listingId: 5, title: 'Calculus — Thomas', price: 280, sub: 'Bought on 3 July 2026', pending: false, image: LISTINGS[4].image },
  ],
}

export const MEETUPS: Record<string, Meetup> = {
  '1': { status: 'none' },
  '3': { status: 'none' },
  '2': { status: 'none' },
  '4': { status: 'pending', date: 'Sat, 13 Sep', time: '10:00 AM', place: 'Baner Road cafe', requestedBy: 'them' },
}

export const rupee = (n: number) => `₹${n.toLocaleString('en-IN')}`

export const SELLERS: Record<string, SellerProfile> = {
  'Ishita R.': {
    id: 'ishita-r',
    name: 'Ishita R.',
    initials: 'IR',
    role: 'Student · Pune',
    verified: true,
    stats: { listings: 6, exchanges: 14, rating: 4.9 },
    listings: [
      { id: 2, title: 'Mechanical Keyboard', price: 2200, image: LISTINGS[1].image, status: 'active' },
      { id: 101, title: 'Desk Lamp', price: 450, image: LISTINGS[5].image, status: 'sold', soldOn: '2 August 2026' },
      { id: 102, title: 'Bluetooth Speaker', price: 1200, image: LISTINGS[0].image, status: 'sold', soldOn: '19 July 2026' },
    ],
  },
  'Kabir S.': {
    id: 'kabir-s',
    name: 'Kabir S.',
    initials: 'KS',
    role: 'Student · Pune',
    verified: true,
    stats: { listings: 4, exchanges: 9, rating: 4.8 },
    listings: [
      { id: 3, title: 'Study Table', price: 1800, image: LISTINGS[2].image, status: 'active' },
      { id: 103, title: 'Office Chair', price: 2500, image: LISTINGS[3].image, status: 'sold', soldOn: '11 June 2026' },
    ],
  },
}