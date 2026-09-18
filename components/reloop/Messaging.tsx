'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft, Send, Check, CheckCheck, CalendarClock } from 'lucide-react'
import type { ChatMessage, ChatThread, Meetup } from '../../lib/types'
import {
  getChatMessages, getChatThreads, sendMessage,
  getMeetup, proposeMeetup, acceptMeetup, declineMeetup, confirmMeetupDone,
} from '../../lib/api'
import { MeetupScheduler } from './MeetupScheduler'
import { MeetupCard } from './MeetupCard'

function relLabel(t: ChatThread) {
  return t.role === 'selling' ? `Interested in ${t.listingTitle}` : `Selling ${t.listingTitle}`
}

function Ticks({ status }: { status?: ChatMessage['status'] }) {
  if (!status) return null
  const Icon = status === 'sent' ? Check : CheckCheck
  return <Icon size={14} className={`thread-ticks ${status}`} />
}

export function Messaging({ onBack, initialThreadId }: { onBack: () => void; initialThreadId?: string | null }) {
  const [tab, setTab] = useState<'selling' | 'buying'>('selling')
  const [threads, setThreads] = useState<ChatThread[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(true)
  const [schedulerOpen, setSchedulerOpen] = useState(false)
  const [activeMeetup, setActiveMeetup] = useState<Meetup>({ status: 'none' })

  useEffect(() => {
    getChatThreads().then(data => {
      setThreads(data)
      const first = initialThreadId ?? data.find(t => t.role === 'selling')?.id ?? data[0]?.id ?? null
      setActiveId(first)
      if (first) setTab(data.find(t => t.id === first)?.role ?? 'selling')
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (!activeId) return
    getChatMessages(activeId).then(setMessages)
    getMeetup(activeId).then(setActiveMeetup)
  }, [activeId])

  const switchTab = (next: 'selling' | 'buying') => {
    setTab(next)
    const first = threads.find(t => t.role === next)?.id ?? null
    setActiveId(first)
  }

  const active = threads.find(t => t.id === activeId)
  const visible = threads.filter(t => t.role === tab)

  const groups = tab === 'selling'
    ? Array.from(new Set(visible.map(t => t.listingId))).map(listingId => ({
        listingId,
        listingTitle: visible.find(t => t.listingId === listingId)!.listingTitle,
        threads: visible.filter(t => t.listingId === listingId),
      }))
    : null

  const send = async () => {
    if (!activeId || !draft.trim()) return
    const message = await sendMessage(activeId, draft)
    setMessages(prev => [...prev, message])
    setDraft('')
  }

  const handleSendRequest = async (dateIso: string, _dateLabel: string, time: string, place: string) => {
    if (!activeId) return
    const meetup = await proposeMeetup(activeId, dateIso, time, place)
    setActiveMeetup(meetup)
  }

  const renderThreadRow = (t: ChatThread) => (
    <div
      key={t.id}
      className={`thread ${t.id === activeId ? 'active' : ''}`}
      onClick={() => setActiveId(t.id)}
      style={{ cursor: 'pointer' }}
    >
      <span className={`profile-avatar ${t.warm ? 'warm' : ''}`}>{t.initials}</span>
      <div>
        <strong>{t.name}</strong>
        <p>{t.role === 'buying' ? `${relLabel(t)} · ${t.preview}` : t.preview}</p>
      </div>
      <small>{t.time}</small>
    </div>
  )

  return (
    <div className="page messages">
      <div className="page-head">
        <button className="back" onClick={onBack}><ArrowLeft size={18} /></button>
        <div><p className="eyebrow">Connect</p><h1>Messages</h1></div>
      </div>

      {loading ? (
        <div className="empty"><h2>Loading conversations…</h2></div>
      ) : (
        <div className="message-layout">
          <div className="thread-list">
            <div style={{ padding: 14 }}>
              <div className="switcher">
                <button className={tab === 'selling' ? 'active' : ''} onClick={() => switchTab('selling')}>Selling</button>
                <button className={tab === 'buying' ? 'active' : ''} onClick={() => switchTab('buying')}>Buying</button>
              </div>
            </div>

            {tab === 'selling'
              ? groups!.map(g => (
                  <div className="thread-group" key={g.listingId}>
                    <div className="thread-group-label">{g.listingTitle}</div>
                    {g.threads.map(renderThreadRow)}
                  </div>
                ))
              : visible.map(renderThreadRow)}
          </div>
          <div className="chat-panel">
            {active && (
              <>
                <div className="chat-head">
                  <span className="profile-avatar">{active.initials}</span>
                  <div><strong>{active.name}</strong><small>{relLabel(active)}</small></div>
                </div>
                <div className="chat-body">
                  <div className="day-label">Today</div>
                  {messages.map((m, i) => (
                    <div key={i} className={`bubble ${m.from === 'me' ? 'outgoing' : 'incoming'}`}>
                      {m.text}
                      <small>{m.time} {m.from === 'me' && <Ticks status={m.status} />}</small>
                    </div>
                  ))}
                  <MeetupCard
                    meetup={activeMeetup}
                    otherInitials={active.initials}
                    otherName={active.name}
                    onAccept={async () => setActiveMeetup(await acceptMeetup(active.id))}
                    onDecline={async () => setActiveMeetup(await declineMeetup(active.id))}
                    onConfirmDone={async () => setActiveMeetup(await confirmMeetupDone(active.id))}
                  />
                </div>
                <div className="composer">
                  <button className="icon-btn" onClick={() => setSchedulerOpen(true)} aria-label="Schedule meetup">
                    <CalendarClock size={18} />
                  </button>
                  <input
                    placeholder="Write a message..."
                    value={draft}
                    onChange={e => setDraft(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && send()}
                  />
                  <button onClick={send}><Send size={17} /></button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {schedulerOpen && active && (
        <MeetupScheduler
          listingTitle={active.listingTitle}
          otherName={active.name}
          onClose={() => setSchedulerOpen(false)}
          onSend={handleSendRequest}
        />
      )}
    </div>
  )
}