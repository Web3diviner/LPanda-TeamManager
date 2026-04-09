import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

function makeRoomName(title: string): string {
  const safe = title.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
  return `lpanda-${safe}-${Math.random().toString(36).slice(2, 7)}`
}

export default function MeetingRoomPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [newTitle, setNewTitle] = useState('')
  const [activeRoom, setActiveRoom] = useState<{ title: string; url: string } | null>(null)
  const [savedRooms, setSavedRooms] = useState<Array<{ title: string; url: string; date: string }>>(() => {
    try { return JSON.parse(localStorage.getItem('lpanda_meetings') ?? '[]') } catch { return [] }
  })

  function startMeeting() {
    if (!newTitle.trim()) return
    const roomName = makeRoomName(newTitle)
    const url = `https://meet.jit.si/${roomName}`
    const entry = { title: newTitle, url, date: new Date().toLocaleString() }
    const updated = [entry, ...savedRooms]
    setSavedRooms(updated)
    localStorage.setItem('lpanda_meetings', JSON.stringify(updated))
    setActiveRoom(entry)
    setNewTitle('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function deleteRoom(url: string) {
    const updated = savedRooms.filter(r => r.url !== url)
    setSavedRooms(updated)
    localStorage.setItem('lpanda_meetings', JSON.stringify(updated))
    if (activeRoom?.url === url) setActiveRoom(null)
  }

  function getIframeUrl(url: string): string {
    const name = encodeURIComponent(user?.name ?? 'Guest')
    return `${url}#userInfo.displayName="${name}"&config.startWithAudioMuted=false&config.prejoinPageEnabled=false`
  }

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ marginBottom: '0.25rem' }}>🎥 Team Meeting Room</h2>
        <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>
          Free video calls via Jitsi Meet — works instantly, no setup needed.
        </p>
      </div>

      {/* Start meeting — admin only */}
      {isAdmin && (
        <div style={card}>
          <h3 style={cardTitle}>🚀 Start a New Meeting</h3>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <input
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="Meeting title (e.g. Weekly Sync)"
              style={{ ...inputStyle, flex: 1, minWidth: '200px' }}
              onKeyDown={e => e.key === 'Enter' && startMeeting()}
            />
            <button onClick={startMeeting} disabled={!newTitle.trim()} style={primaryBtn}>
              🎥 Start Meeting
            </button>
          </div>
          <p style={{ margin: '0.5rem 0 0', fontSize: '0.78rem', color: '#9ca3af' }}>
            Powered by Jitsi Meet — 100% free, no account required. Share the room link with your team.
          </p>
        </div>
      )}

      {/* Active meeting embed */}
      {activeRoom && (
        <div style={{ ...card, marginTop: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h3 style={{ margin: 0, color: '#4c1d95' }}>📹 {activeRoom.title}</h3>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <a href={activeRoom.url} target="_blank" rel="noopener noreferrer" style={{ ...joinBtn, textDecoration: 'none' }}>
                ↗ Open in new tab
              </a>
              <button onClick={() => setActiveRoom(null)} style={ghostBtn}>✕ Close</button>
            </div>
          </div>
          <iframe
            src={getIframeUrl(activeRoom.url)}
            allow="camera; microphone; fullscreen; display-capture; autoplay"
            style={{ width: '100%', height: '560px', border: 'none', borderRadius: '12px', background: '#1a1035' }}
            title={activeRoom.title}
          />
          <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: '#f5f3ff', borderRadius: '10px', fontSize: '0.82rem', color: '#5b21b6' }}>
            💡 Share this link with your team to join: <a href={activeRoom.url} target="_blank" rel="noopener noreferrer" style={{ color: '#7c3aed', fontWeight: 600 }}>{activeRoom.url}</a>
          </div>
        </div>
      )}

      {/* Saved meetings */}
      <div style={{ marginTop: '1.5rem' }}>
        <h3 style={{ color: '#4c1d95', marginBottom: '1rem' }}>📋 Recent Meetings</h3>
        {savedRooms.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem', color: '#9ca3af', background: '#fff', borderRadius: '16px', border: '1px solid #ede9fe' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🎥</div>
            <p style={{ margin: 0 }}>{isAdmin ? 'Start a meeting above to get going.' : 'No meetings yet. Ask your admin to start one.'}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {savedRooms.map((m, i) => (
              <div key={i} style={meetingCard}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: '#1a1035' }}>{m.title}</div>
                    <div style={{ fontSize: '0.78rem', color: '#9ca3af', marginTop: '0.15rem' }}>{m.date}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button onClick={() => { setActiveRoom(m); window.scrollTo({ top: 0, behavior: 'smooth' }) }} style={joinBtn}>
                      🎥 Join
                    </button>
                    <a href={m.url} target="_blank" rel="noopener noreferrer" style={{ ...ghostBtn, textDecoration: 'none' }}>
                      ↗ Open
                    </a>
                    {isAdmin && (
                      <button onClick={() => deleteRoom(m.url)} style={dangerBtn}>🗑</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info for non-admins */}
      {!isAdmin && savedRooms.length === 0 && (
        <div style={{ marginTop: '1rem', padding: '1rem', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '12px', fontSize: '0.875rem', color: '#0369a1' }}>
          💡 When your admin starts a meeting, it will appear here and you can join with one click.
        </div>
      )}
    </div>
  )
}

const card: React.CSSProperties = { background: '#fff', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 2px 12px rgba(124,58,237,0.07)', border: '1px solid #ede9fe' }
const cardTitle: React.CSSProperties = { fontSize: '0.95rem', fontWeight: 700, color: '#4c1d95', marginBottom: '1rem', paddingBottom: '0.6rem', borderBottom: '2px solid #f0ebff' }
const meetingCard: React.CSSProperties = { background: '#fff', borderRadius: '14px', padding: '1.1rem 1.25rem', boxShadow: '0 2px 8px rgba(124,58,237,0.07)', border: '1px solid #ede9fe' }
const inputStyle: React.CSSProperties = { padding: '0.65rem 0.9rem', border: '1.5px solid #e5e7eb', borderRadius: '10px', fontSize: '0.875rem', background: '#fafafa' }
const primaryBtn: React.CSSProperties = { padding: '0.65rem 1.25rem', background: 'linear-gradient(135deg,#5b21b6,#7c3aed)', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(124,58,237,0.3)' }
const ghostBtn: React.CSSProperties = { padding: '0.4rem 0.85rem', background: '#f5f3ff', color: '#5b21b6', border: '1px solid #c4b5fd', borderRadius: '8px', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }
const joinBtn: React.CSSProperties = { padding: '0.4rem 0.85rem', background: 'linear-gradient(135deg,#dbeafe,#bfdbfe)', color: '#1e40af', border: '1px solid #93c5fd', borderRadius: '8px', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }
const dangerBtn: React.CSSProperties = { padding: '0.4rem 0.65rem', background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' }
