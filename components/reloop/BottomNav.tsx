'use client'

import { Home, MessageCircle, Plus, Search, UserRound } from 'lucide-react'
import type { Screen } from '@/lib/types'
import { NavItem } from './NavItem'

export function BottomNav({ screen, setScreen }: { screen: Screen; setScreen: (s: Screen) => void }) {
  return (
    <nav className="bottom-nav">
      <NavItem icon={<Home />} label="Home" active={screen === 'home'} onClick={() => setScreen('home')} />
      <NavItem icon={<Search />} label="Browse" active={screen === 'browse'} onClick={() => setScreen('browse')} />
      <button className="sell-button" onClick={() => setScreen('create')}>
        <Plus />
        <span>Sell</span>
      </button>
      <NavItem icon={<MessageCircle />} label="Messages" active={screen === 'messages'} onClick={() => setScreen('messages')} />
      <NavItem icon={<UserRound />} label="Profile" active={screen === 'profile'} onClick={() => setScreen('profile')} />
    </nav>
  )
}