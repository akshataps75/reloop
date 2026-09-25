'use client'

import { useEffect, useMemo, useState } from 'react'
import { Check, Home, MessageCircle, Plus, Search, UserRound } from 'lucide-react'
import type { Listing, Screen, SellerProfile as SellerProfileType } from '../lib/types'
import { getStoredUser, saveAuth, getToken, type AuthUser } from '../lib/auth'
import { expressInterest, createThread, getListingById, getSellerProfile, updateProfile } from '../lib/api'

import { Header } from '../components/reloop/Header'
import { NavItem } from '../components/reloop/NavItem'
import { Auth } from '../components/reloop/Auth'
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
import { DigiLockerGate } from '../components/reloop/DigiLockerGate'

export default function ReLoop() {
  const [screen, setScreen] = useState<Screen>('auth')
  const [checkedAuth, setCheckedAuth] = useState(false)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [selected, setSelected] = useState<Listing | null>(null)
  const [search, setSearch] = useState('')
  const [interested, setInterested] = useState(false)
  const [toast, setToast] = useState('')
  const [viewingSeller, setViewingSeller] = useState<SellerProfileType | null>(null)
  const [sellingListingId, setSellingListingId] = useState<number | null>(null)
  const [pendingThreadId, setPendingThreadId] = useState<string | null>(null)
  const [locationOpen, setLocationOpen] = useState(false)
  const [location, setLocation] = useState('Set your location')
  const [editProfileOpen, setEditProfileOpen] = useState(false)
  const [everVerified, setEverVerified] = useState(false)
  const [interestGateOpen, setInterestGateOpen] = useState(false)
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)

  // On mount, check localStorage for an existing session
  useEffect(() => {
    const stored = getStoredUser()
    if (stored) {
      setUser(stored)
      setEverVerified(stored.verified)
      if (stored.address) setLocation(stored.address)
      setScreen('home')
    } else {
      setScreen('auth')
    }
    setCheckedAuth(true)
  }, [])

  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      pos => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => { }, // denied/unavailable — distance just won't show, no crash
      { timeout: 5000 }
    )
  }, [])

  const notify = (m: string) => {
    setToast(m)
    window.setTimeout(() => setToast(''), 2500)
  }

  const openDetail = async (l: Listing) => {
    if (user && l.sellerId === user.id) {
      setSellingListingId(l.id)
      setScreen('sellingDetail')
      return
    }
    setSelected(l)
    setInterested(false)
    setScreen('detail')
    const full = await getListingById(l.id, coords ?? undefined)
    if (full) {
      setSelected(full)
      setInterested(Boolean(full.alreadyInterested))
    }
  }

  const openDetailById = async (listingId: number) => {
    const l = await getListingById(listingId, coords ?? undefined)
    if (l) openDetail(l)
  }

  // Avoid a flash of the auth screen while we check localStorage
  if (!checkedAuth) return null

  if (screen === 'auth') {
    return (
      <div className="app-shell">
        <Auth
          onAuthed={u => {
            setUser(u)
            setEverVerified(u.verified)
            if (u.address) setLocation(u.address)
            setScreen('home')
          }}
        />
      </div>
    )
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
            coords={coords}
          />
        )}

        {screen === 'browse' && (
          <Browse initialSearch={search} onSelectListing={openDetail} onBack={() => setScreen('home')} coords={coords}/>
        )}

        {screen === 'detail' && selected && (
          <ListingDetail
            listing={selected}
            interested={interested}
            onInterested={async () => {
              try {
                await expressInterest(selected.id)
                await createThread(selected.id)
                setInterested(true)
                notify('Interest sent to seller')
              } catch (err: any) {
                if (err.message === 'verification_required') {
                  setInterestGateOpen(true)
                } else {
                  notify(err.message || 'Something went wrong')
                }
              }
            }}
            onBack={() => setScreen('browse')}
            onMessage={async () => {
              const thread = await createThread(selected.id)
              setPendingThreadId(thread.id)
              setScreen('messages')
              notify('Conversation started')
            }}
            onSellerProfile={async () => {
              const seller = await getSellerProfile(selected.sellerId)
              setViewingSeller(seller)
              setScreen('sellerProfile')
            }}
          />
        )}

        {screen === 'sellerProfile' && viewingSeller && (
          <SellerProfileScreen
            seller={viewingSeller}
            onBack={() => setScreen('detail')}
            onSelectListing={id => openDetailById(id)}
          />
        )}

        {screen === 'activity' && (
          <MyActivity
            onBack={() => setScreen('home')}
            onSelectSellingItem={id => { setSellingListingId(id); setScreen('sellingDetail') }}
            onSelectBuyingListing={listingId => openDetailById(listingId)}
          />
        )}

        {screen === 'sellingDetail' && sellingListingId !== null && (
          <SellingListingDetail
            listingId={sellingListingId}
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
            onVerified={() => {
              setEverVerified(true)
              if (user) {
                const updatedUser = { ...user, verified: true }
                saveAuth(getToken()!, updatedUser)
                setUser(updatedUser)
              }
            }}
            onCreated={() => { setScreen('activity'); notify('Listing published') }}
          />
        )}

        {screen === 'profile' && (
          <Profile
            onBack={() => setScreen('home')}
            onActivity={() => setScreen('activity')}
            onEdit={() => setEditProfileOpen(true)}
            onLogout={() => {
              setUser(null)
              setScreen('auth')
            }}
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
        onSelectLocation={async loc => {
          setLocation(loc.name)
          try {
            const savedUser = await updateProfile({ address: loc.addr, lat: loc.lat, lng: loc.lng })
            saveAuth(getToken()!, savedUser)
            setUser(savedUser)
            notify('Location updated')
          } catch (err: any) {
            notify(err.message || 'Could not save location')
          }
        }}
      />

      {editProfileOpen && user && (
        <EditProfileModal
          profile={{
            name: user.name,
            phone: user.phone_number || '',
            address: user.address || '',
            initials: user.initials,
          }}
          onClose={() => setEditProfileOpen(false)}
          onEditAddress={() => { setEditProfileOpen(false); setLocationOpen(true) }}
          onSave={async updated => {
            const savedUser = await updateProfile({ phone: updated.phone, address: updated.address })
            saveAuth(getToken()!, savedUser)
            setUser(savedUser)
            setEditProfileOpen(false)
            notify('Profile updated')
          }}
        />
      )}

      {interestGateOpen && selected && (
        <DigiLockerGate
          onClose={() => setInterestGateOpen(false)}
          onDone={async () => {
            setEverVerified(true)
            if (user) {
              const updatedUser = { ...user, verified: true }
              saveAuth(getToken()!, updatedUser)
              setUser(updatedUser)
            }
            setInterestGateOpen(false)
            await expressInterest(selected.id)
            await createThread(selected.id)
            setInterested(true)
            notify('Interest sent to seller')
          }}
        />
      )}
    </div>
  )
}