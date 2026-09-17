'use client'

import { useMemo, useState } from 'react'
import { Check, Home, MessageCircle, Plus, Search, UserRound } from 'lucide-react'
import type { Listing, Screen, SellerProfile as SellerProfileType, SellingListingItem } from '../lib/types'
import { LISTINGS, SELLERS } from '../lib/mock-data'

import { Header } from '../components/reloop/Header'
import { NavItem } from '../components/reloop/NavItem'
import { Home as HomeScreen } from '../components/reloop/Home'
import { Browse } from '../components/reloop/Browse'
import { ListingDetail } from '../components/reloop/ListingDetail'
import { MyActivity } from '../components/reloop/MyActivity'
import { Messaging } from '../components/reloop/Messaging'
import { CreateListing } from '../components/reloop/CreateListing'
import { Profile } from '../components/reloop/Profile'
import { LocationModal } from '../components/reloop/LocationModal'
import { EditProfileModal, type EditableProfile } from '../components/reloop/EditProfileModal'
import { SellerProfile as SellerProfileScreen } from '../components/reloop/SellerProfile'
import { SellingListingDetail } from '../components/reloop/SellingListingDetail'

export default function ReLoop() {
  const [screen, setScreen] = useState<Screen>('home')
  const [selected, setSelected] = useState<Listing>(LISTINGS[0])
  const [search, setSearch] = useState('')
  const [interested, setInterested] = useState(false)
  const [toast, setToast] = useState('')
  const [viewingSeller, setViewingSeller] = useState<SellerProfileType | null>(null)
  const [sellingItem, setSellingItem] = useState<SellingListingItem | null>(null)
  const [pendingThreadId, setPendingThreadId] = useState<string | null>(null)

  const [locationOpen, setLocationOpen] = useState(false)
  const [location, setLocation] = useState('Bavdhan, Pune 411021')

  const [editProfileOpen, setEditProfileOpen] = useState(false)
  const [profile, setProfile] = useState<EditableProfile>({
    name: 'Akshata Shrivastava',
    phone: '+91 98765 43210',
    address: '104, Sadafuli, DSK Ranwara Society, Bavdhan, Pune, 411021',
    initials: 'AS',
  })

  const [everVerified, setEverVerified] = useState(false)

  const filtered = useMemo(
    () => LISTINGS.filter(l => `${l.title} ${l.category}`.toLowerCase().includes(search.toLowerCase())),
    [search],
  )

  const notify = (m: string) => {
    setToast(m)
    window.setTimeout(() => setToast(''), 2500)
  }

  const openDetail = (l: Listing) => {
    setSelected(l)
    setInterested(false)
    setScreen('detail')
  }

  return (
    <div className="app-shell">
      <Header
        location={location}
        onOpenLocation={() => setLocationOpen(true)}
        onGoHome={() => setScreen('home')}
        onGoProfile={() => setScreen('profile')}
        onNotify={notify}
      />

      <main>
        {screen === 'home' && (
          <HomeScreen
            search={search}
            setSearch={setSearch}
            onBrowse={() => setScreen('browse')}
            onDetail={openDetail}
            onCategory={c => { setSearch(c); setScreen('browse') }}
          />
        )}

        {screen === 'browse' && (
          <Browse initialSearch={search} onSelectListing={openDetail} onBack={() => setScreen('home')} />
        )}

        {screen === 'detail' && (
          <ListingDetail
            listing={selected}
            interested={interested}
            onInterested={() => { setInterested(true); notify('Interest sent to seller') }}
            onBack={() => setScreen('browse')}
            onMessage={() => { setScreen('messages'); notify('Conversation started') }}
            onSellerProfile={() => {
              const seller = SELLERS[selected.seller]
              if (seller) { setViewingSeller(seller); setScreen('sellerProfile') }
            }}
          />
        )}

        {screen === 'sellerProfile' && viewingSeller && (
          <SellerProfileScreen
            seller={viewingSeller}
            onBack={() => setScreen('detail')}
            onSelectListing={(id) => {
              const listing = LISTINGS.find(l => l.id === id)
              if (listing) openDetail(listing)
            }}
          />
        )}

        {screen === 'activity' && (
          <MyActivity
            onBack={() => setScreen('home')}
            onSelectSellingItem={item => { setSellingItem(item); setScreen('sellingDetail') }}
            onSelectBuyingListing={listingId => {
              const listing = LISTINGS.find(l => l.id === listingId)
              if (listing) openDetail(listing)
            }}
          />
        )}

        {screen === 'sellingDetail' && sellingItem && (
          <SellingListingDetail
            item={sellingItem}
            onBack={() => setScreen('activity')}
            onMessageBuyer={threadId => {
              setPendingThreadId(threadId)
              setScreen('messages')
            }}
          />
        )}

        {screen === 'messages' && <Messaging onBack={() => setScreen('home')} initialThreadId={pendingThreadId} />}

        {screen === 'create' && (
          <CreateListing
            onBack={() => setScreen('home')}
            everVerified={everVerified}
            onVerified={() => setEverVerified(true)}
            onCreated={() => { setScreen('activity'); notify('Listing published') }}
          />
        )}

        {screen === 'profile' && (
          <Profile
            onBack={() => setScreen('home')}
            onActivity={() => setScreen('activity')}
            onEdit={() => setEditProfileOpen(true)}
          />
        )}
      </main>

      <nav className="bottom-nav">
        <NavItem icon={<Home />} label="Home" active={screen === 'home'} onClick={() => setScreen('home')} />
        <NavItem icon={<Search />} label="Browse" active={screen === 'browse'} onClick={() => setScreen('browse')} />
        <button className="sell-button" onClick={() => setScreen('create')}><Plus /><span>Sell</span></button>
        <NavItem icon={<MessageCircle />} label="Messages" active={screen === 'messages'} onClick={() => setScreen('messages')} />
        <NavItem icon={<UserRound />} label="Profile" active={screen === 'profile'} onClick={() => setScreen('profile')} />
      </nav>

      {toast && <div className="toast"><Check size={16} />{toast}</div>}

      <LocationModal
        isOpen={locationOpen}
        onClose={() => setLocationOpen(false)}
        onSelectLocation={loc => { setLocation(loc); notify('Location updated') }}
      />

      {editProfileOpen && (
        <EditProfileModal
          profile={profile}
          onClose={() => setEditProfileOpen(false)}
          onEditAddress={() => { setEditProfileOpen(false); setLocationOpen(true) }}
          onSave={updated => { setProfile(updated); setEditProfileOpen(false); notify('Profile updated') }}
        />
      )}
    </div>
  )
}