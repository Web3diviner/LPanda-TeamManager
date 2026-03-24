import { useEffect, useState } from 'react'
import api from '../api'
import { useAuth } from '../context/AuthContext'

interface Timer {
  id: string
  label: string
  ends_at: string
  created_by_name: string
}

function useCountdown(endsAt: string) {
  const [remaining, setRemaining] = useState(0)

  useEffect(() => {
    function calc() {
      setRemaining(Math.max(0, new Date(endsAt).getTime() - Date.now()))
    }
    calc()
    const t = setInterval(calc, 1000)
    return () => clearInterval(t)
  }, [endsAt])

  const total = remaining
  const h = Math.floor(total / 3_600_000)
  const m = Math.floor((total % 3_600_000) / 60_000)
  const s = Math.floor((total % 60_000) / 1_000)
  const d = Math.floor(total / 86_400_000)
  const expired = total === 0

  return { d, h, m, s, expired }
}

function Countdown({ endsAt }: { endsAt: string }) {
  const { d, h, m, s, expired } = useCountdown(endsAt)
  if (expired) return <span style={{ color: '#ef4444', fontWeight: 700 }}>⏰ Expired</span>
  return (
    <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '1rem', color: '#4c1d95' }}>
      {d > 0 && `${d}d `}{String(h).padStart(2,'0')}:{String(m).padStart(2,'0')}:{String(s).padStart(2,'0')}
    </span>
  )
}

export default function TimerWidget() {
  const { user } = useAuth()
  const [timers, setTimers] = useState<Timer[]>([])
  const [label, setLabel] = useState('')
  const [endsAt, setEndsAt] = useState('')
  const [adding, setAdding] = useState(false)
  const [loading, setLoading] = useState(false)

  async function fetchTimers() {
    try {
      const res = await api.get('/timers')
      setTimers(res.data)
    } catch { /* ignore */ }
  }

  useEffect(() => {
    fetchTimers()
    const t = setInterval(fetchTimers, 60_000)
    return () => clearInterval(t)
  }, [])

  async function handleAdd() {
    if (!label.trim() || !endsAt) return
    setLoading(true)
    try {
      await api.post('/timers', { label, ends_at: endsAt })
      setLabel('')
      setEndsAt('')
      setAdding(false)
      fetchTimers()
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }

  async function handleDelete(id: string) {
    try {
      await api.delete(`/timers/${id}`)
      fetchTimers()
    } catch { /* ignore */ }
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <h3 style={sectionTitle}>⏱️ Task Timers</h3>
        {user?.role === 'admin' && !adding && (
          <button onClick={() => setAdding(true)} style={addBtn}>+ Add Timer</button>
        )}
      </div>

      {adding && (
        <div style={addForm}>
          <input
            placeholder="Timer label (e.g. Sprint deadline)"
            value={label}
            onChange={e => setLabel(e.target.value)}
            style={inputStyle}
          />
          <input
            type="datetime-local"
            value={endsAt}
            onChange={e => setEndsAt(e.target.value)}
            style={inputStyle}
          />
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={handleAdd} disabled={loading} style={saveBtn}>
              {loading ? '⏳' : '✅ Save'}
            </button>
            <button onClick={() => setAdding(false)} style={cancelBtn}>Cancel</button>
          </div>
        </div>
      )}

      {timers.length === 0 && !adding && (
        <p style={{ color: '#9ca3af', fontSize: '0.875rem', margin: 0 }}>No active timers.</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {timers.map(t => (
          <div key={t.id} style={timerRow}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#1e1b4b', marginBottom: '0.2rem' }}>
                {t.label}
              </div>
              <Countdown endsAt={t.ends_at} />
              <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: '0.15rem' }}>
                Ends {new Date(t.ends_at).toLocaleString()}
              </div>
            </div>
            {user?.role === 'admin' && (
              <button onClick={() => handleDelete(t.id)} style={deleteBtn} title="Remove timer">✕</button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

const sectionTitle: React.CSSProperties = { fontSize: '1rem', fontWeight: 700, color: '#4c1d95', margin: 0 }
const addBtn: React.CSSProperties = { background: '#ede9fe', color: '#5b21b6', border: '1px solid #c4b5fd', borderRadius: '6px', padding: '0.3rem 0.7rem', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer' }
const addForm: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.75rem', padding: '0.75rem', background: '#f5f3ff', borderRadius: '8px', border: '1px solid #ddd6fe' }
const inputStyle: React.CSSProperties = { padding: '0.55rem 0.75rem', border: '1.5px solid #e5e7eb', borderRadius: '7px', fontSize: '0.875rem', background: '#fff' }
const saveBtn: React.CSSProperties = { padding: '0.45rem 1rem', background: 'linear-gradient(135deg,#7c3aed,#a855f7)', color: '#fff', border: 'none', borderRadius: '7px', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }
const cancelBtn: React.CSSProperties = { padding: '0.45rem 0.9rem', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '7px', cursor: 'pointer', fontSize: '0.85rem' }
const timerRow: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.65rem 0.85rem', background: 'linear-gradient(135deg,#f5f3ff,#ede9fe)', borderRadius: '8px', border: '1px solid #ddd6fe' }
const deleteBtn: React.CSSProperties = { background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.9rem', padding: '0.2rem 0.4rem', borderRadius: '4px' }
