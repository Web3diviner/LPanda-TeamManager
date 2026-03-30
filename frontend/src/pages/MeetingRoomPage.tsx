import { useEffect, useRef, useState } from 'react'
import api from '../api'
import { useAuth } from '../context/AuthContext'

interface Meeting {
  id: string
  title: string
  room_url: string | null
  transcript: string | null
  summary: string | null
  action_points: string | null
  created_by_name: string | null
  created_at: string
}

export default function MeetingRoomPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)
  const [activeRoom, setActiveRoom] = useState<Meeting | null>(null)
  const [newTitle, setNewTitle] = useState('')
  const [creating, setCreating] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [summarizing, setSummarizing] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  async function load() {
    try {
      const res = await api.get('/meetings')
      setMeetings(res.data)
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  async function createRoom() {
    if (!newTitle.trim()) return
    setCreating(true)
    try {
      const res = await api.post('/meetings/room', { title: newTitle })
      setMeetings(prev => [res.data, ...prev])
      setActiveRoom(res.data)
      setNewTitle('')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to create room'
      alert(msg)
    } finally { setCreating(false) }
  }

  async function summarize(meeting: Meeting) {
    if (!transcript.trim()) { alert('Please paste the meeting transcript first.'); return }
    setSummarizing(true)
    try {
      const res = await api.post(`/meetings/${meeting.id}/summarize`, { transcript })
      setMeetings(prev => prev.map(m => m.id === meeting.id ? res.data : m))
      setActiveRoom(res.data)
      setTranscript('')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to summarize'
      alert(msg)
    } finally { setSummarizing(false) }
  }

  async function deleteMeeting(id: string) {
    if (!confirm('Delete this meeting record?')) return
    try {
      await api.delete(`/meetings/${id}`)
      setMeetings(prev => prev.filter(m => m.id !== id))
      if (activeRoom?.id === id) setActiveRoom(null)
    } catch { alert('Failed to delete.') }
  }

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ marginBottom: '0.25rem' }}>🎥 Team Meeting Room</h2>
        <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>Host video calls, record sessions, and get AI-generated minutes & action points</p>
      </div>

      {/* Create room — admin only */}
      {isAdmin && (
        <div style={card}>
          <h3 style={cardTitle}>🚀 Start a New Meeting</h3>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <input
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="Meeting title (e.g. Weekly Sync)"
              style={{ ...inputStyle, flex: 1, minWidth: '200px' }}
              onKeyDown={e => e.key === 'Enter' && createRoom()}
            />
            <button onClick={createRoom} disabled={creating || !newTitle.trim()} style={primaryBtn}>
              {creating ? '⏳ Creating…' : '🎥 Create Room'}
            </button>
          </div>
          <p style={{ margin: '0.5rem 0 0', fontSize: '0.78rem', color: '#9ca3af' }}>
            Requires DAILY_API_KEY on the server. Rooms expire after 2 hours.
          </p>
        </div>
      )}

      {/* Active room embed */}
      {activeRoom?.room_url && (
        <div style={{ ...card, marginTop: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, color: '#4c1d95' }}>📹 {activeRoom.title}</h3>
            <button onClick={() => setActiveRoom(null)} style={ghostBtn}>✕ Close</button>
          </div>
          <iframe
            ref={iframeRef}
            src={activeRoom.room_url}
            allow="camera; microphone; fullscreen; speaker; display-capture"
            style={{ width: '100%', height: '500px', border: 'none', borderRadius: '10px', background: '#000' }}
            title="Meeting Room"
          />
          {isAdmin && (
            <div style={{ marginTop: '1rem' }}>
              <h4 style={{ margin: '0 0 0.5rem', color: '#4c1d95', fontSize: '0.9rem' }}>🤖 AI Meeting Summarizer</h4>
              <p style={{ margin: '0 0 0.5rem', fontSize: '0.82rem', color: '#6b7280' }}>
                After the meeting, paste the transcript below (from Daily.co recording or manual notes) and get AI-generated minutes.
              </p>
              <textarea
                value={transcript}
                onChange={e => setTranscript(e.target.value)}
                placeholder="Paste meeting transcript here..."
                style={{ ...inputStyle, width: '100%', height: '120px', resize: 'vertical', boxSizing: 'border-box' }}
              />
              <button onClick={() => summarize(activeRoom)} disabled={summarizing || !transcript.trim()} style={{ ...primaryBtn, marginTop: '0.5rem' }}>
                {summarizing ? '⏳ Summarizing…' : '✨ Generate Summary & Action Points'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Past meetings */}
      <div style={{ marginTop: '1.5rem' }}>
        <h3 style={{ color: '#4c1d95', marginBottom: '1rem' }}>📋 Meeting Records</h3>
        {loading ? (
          <p style={{ color: '#6b7280' }}>Loading…</p>
        ) : meetings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af', background: '#fff', borderRadius: '12px', border: '1px solid #ede9fe' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🎥</div>
            <p style={{ margin: 0 }}>No meetings yet. {isAdmin ? 'Create one above.' : 'Check back after a meeting.'}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {meetings.map(m => (
              <div key={m.id} style={meetingCard}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: '#1e1b4b' }}>{m.title}</div>
                    <div style={{ fontSize: '0.78rem', color: '#9ca3af', marginTop: '0.2rem' }}>
                      {new Date(m.created_at).toLocaleString()} {m.created_by_name && `· by ${m.created_by_name}`}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {m.room_url && (
                      <button onClick={() => setActiveRoom(m)} style={joinBtn}>🎥 Rejoin</button>
                    )}
                    {(m.summary || m.action_points) && (
                      <button onClick={() => setExpanded(expanded === m.id ? null : m.id)} style={ghostBtn}>
                        {expanded === m.id ? '▲ Hide' : '▼ View Summary'}
                      </button>
                    )}
                    {isAdmin && (
                      <button onClick={() => deleteMeeting(m.id)} style={dangerBtn}>🗑</button>
                    )}
                  </div>
                </div>

                {expanded === m.id && (
                  <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {m.summary && (
                      <div style={summaryBox}>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#4c1d95', marginBottom: '0.4rem' }}>📝 Summary</div>
                        <p style={{ margin: 0, fontSize: '0.875rem', color: '#374151', lineHeight: 1.6 }}>{m.summary}</p>
                      </div>
                    )}
                    {m.action_points && (
                      <div style={actionBox}>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#065f46', marginBottom: '0.4rem' }}>✅ Action Points</div>
                        <pre style={{ margin: 0, fontSize: '0.875rem', color: '#374151', whiteSpace: 'pre-wrap', fontFamily: 'inherit', lineHeight: 1.6 }}>{m.action_points}</pre>
                      </div>
                    )}
                    {isAdmin && !m.summary && (
                      <div>
                        <textarea
                          value={transcript}
                          onChange={e => setTranscript(e.target.value)}
                          placeholder="Paste transcript to generate summary..."
                          style={{ ...inputStyle, width: '100%', height: '100px', resize: 'vertical', boxSizing: 'border-box' }}
                        />
                        <button onClick={() => summarize(m)} disabled={summarizing} style={{ ...primaryBtn, marginTop: '0.5rem' }}>
                          {summarizing ? '⏳ Summarizing…' : '✨ Generate Summary'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const card: React.CSSProperties = { background: '#fff', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(124,58,237,0.08)', border: '1px solid #ede9fe' }
const cardTitle: React.CSSProperties = { fontSize: '1rem', fontWeight: 700, color: '#4c1d95', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '2px solid #ede9fe' }
const meetingCard: React.CSSProperties = { background: '#fff', borderRadius: '12px', padding: '1.25rem', boxShadow: '0 2px 8px rgba(124,58,237,0.08)', border: '1px solid #ede9fe' }
const inputStyle: React.CSSProperties = { padding: '0.6rem 0.85rem', border: '1.5px solid #e5e7eb', borderRadius: '8px', fontSize: '0.875rem', background: '#fafafa' }
const primaryBtn: React.CSSProperties = { padding: '0.6rem 1.2rem', background: 'linear-gradient(135deg,#7c3aed,#a855f7)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer' }
const ghostBtn: React.CSSProperties = { padding: '0.4rem 0.85rem', background: '#f5f3ff', color: '#5b21b6', border: '1px solid #c4b5fd', borderRadius: '6px', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }
const joinBtn: React.CSSProperties = { padding: '0.4rem 0.85rem', background: '#dbeafe', color: '#1e40af', border: '1px solid #93c5fd', borderRadius: '6px', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }
const dangerBtn: React.CSSProperties = { padding: '0.4rem 0.65rem', background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }
const summaryBox: React.CSSProperties = { background: '#f5f3ff', borderRadius: '8px', padding: '0.85rem', border: '1px solid #ede9fe' }
const actionBox: React.CSSProperties = { background: '#d1fae5', borderRadius: '8px', padding: '0.85rem', border: '1px solid #6ee7b7' }
