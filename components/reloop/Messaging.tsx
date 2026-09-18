'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft, Send, Check, CheckCheck, CalendarClock } from 'lucide-react'
import type { ChatMessage, ChatThread, Meetup } from '../../lib/types'
import { getChatMessages, getChatThreads, sendMessage } from '../../lib/api'
import { CHAT_MESSAGES, MEETUPS } from '../../lib/mock-data'
import { MeetupScheduler } from './MeetupScheduler'
import { MeetupCard } from './MeetupCard'

function lastMessage(threadId: string): ChatMessage | undefined {
  const msgs = CHAT_MESSAGES[threadId]
  return msgs && msgs.length ? msgs[msgs.length - 1] : undefined
}

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
  const [meetups, setMeetups] = useState<Record<string, Meetup>>(MEETUPS)

  useEffect(() => {
    getChatThreads().then(data => {
      setThreads(data)
      const first = initialThreadId ?? data.find(t => t.role === 'selling')?.id ?? data[0]?.id ?? null
      setActiveId(first)
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (!activeId) return
    getChatMessages(activeId).then(setMessages)
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

  const updateMeetup = (id: string, patch: Partial<Meetup>) => {
    setMeetups(prev => ({ ...prev, [id]: { ...prev[id], ...patch } }))
  }

  // dateIso is what will go to the API once this screen is wired to the real
  // backend (POST /threads/:id/meetup expects a DATE-typed value); dateLabel
  // is the human-readable string ("Sat, 20 Sep") used for local display until then.
  const handleSendRequest = (dateIso: string, dateLabel: string, time: string, place: string) => {
    if (!activeId) return
    updateMeetup(activeId, { status: 'pending', date: dateLabel, time, place, requestedBy: 'me', doneByMe: false, doneByThem: false })
  }

  const activeMeetup = activeId ? meetups[activeId] ?? { status: 'none' as const } : { status: 'none' as const }

  const renderThreadRow = (t: ChatThread) => {
    const last = lastMessage(t.id)
    return (
      <div
        key={t.id}
        className={`thread ${t.id === activeId ? 'active' : ''}`}
        onClick={() => setActiveId(t.id)}
        style={{ cursor: 'pointer' }}
      >
        <span className={`profile-avatar ${t.warm ? 'warm' : ''}`}>{t.initials}</span>
        <div>
          <strong>{t.name}</strong>
          <p>
            {last?.from === 'me' && <Ticks status={last.status} />}
            {t.role === 'buying' ? `${relLabel(t)} · ${last?.text ?? t.preview}` : (last?.text ?? t.preview)}
          </p>
        </div>
        <small>{last?.time ?? t.time}</small>
      </div>
    )
  }

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
                    onAccept={() => updateMeetup(active.id, { status: 'confirmed', code: String(Math.floor(1000 + Math.random() * 9000)), doneByMe: false, doneByThem: false })}
                    onDecline={() => updateMeetup(active.id, { status: 'declined' })}
                    onConfirmDone={() => updateMeetup(active.id, { doneByMe: true })}
                    onSimulateThem={() => updateMeetup(active.id, { doneByThem: true })}
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