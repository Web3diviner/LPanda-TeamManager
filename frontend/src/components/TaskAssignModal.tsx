import { useEffect, useState, type FormEvent } from 'react'
import api from '../api'

interface LeaderboardUser {
  id: string
  name: string
  points: number
}

interface Props {
  taskId: string
  onClose: () => void
  onAssigned: () => void
}

export default function TaskAssignModal({ taskId, onClose, onAssigned }: Props) {
  const [users, setUsers] = useState<LeaderboardUser[]>([])
  const [assignedTo, setAssignedTo] = useState('')
  const [deadline, setDeadline] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.get('/points/leaderboard').then(res => {
      setUsers(res.data)
      if (res.data.length > 0) setAssignedTo(res.data[0].id)
    }).catch(() => setError('Failed to load users.'))
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (!deadline) { setError('Deadline is required.'); return }
    setLoading(true)
    try {
      await api.patch(`/tasks/${taskId}/assign`, { assigned_to: assignedTo, deadline })
      onAssigned()
      onClose()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to assign task.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={overlay}>
      <div style={modal}>
        <div style={modalHeader}>
          <h2 style={{ margin: 0, fontSize: '1.1rem', color: '#fff' }}>📌 Assign Task</h2>
          <button onClick={onClose} style={closeBtn}>✕</button>
        </div>
        <div style={{ padding: '1.5rem' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>Assignee</label>
              <select value={assignedTo} onChange={e => setAssignedTo(e.target.value)} style={inputStyle}>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({Number(u.points).toFixed(1)} pts)</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Deadline</label>
              <input
                type="datetime-local"
                value={deadline}
                onChange={e => setDeadline(e.target.value)}
                required
                style={inputStyle}
              />
            </div>
            {error && <div style={errorBox}>⚠️ {error}</div>}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
              <button type="button" onClick={onClose} style={btnCancel}>Cancel</button>
              <button type="submit" disabled={loading} style={btnSubmit}>
                {loading ? '⏳ Assigning…' : '📌 Assign Task'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

const overlay: React.CSSProperties = {
  position: 'fixed', inset: 0,
  background: 'rgba(76,29,149,0.5)',
  backdropFilter: 'blur(4px)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
}
const modal: React.CSSProperties = {
  background: '#fff',
  borderRadius: '14px',
  width: '100%',
  maxWidth: '420px',
  boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
  overflow: 'hidden',
}
const modalHeader: React.CSSProperties = {
  background: 'linear-gradient(135deg, #4c1d95, #7c3aed)',
  padding: '1rem 1.5rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
}
const closeBtn: React.CSSProperties = {
  background: 'rgba(255,255,255,0.2)',
  border: 'none',
  color: '#fff',
  borderRadius: '6px',
  padding: '0.2rem 0.5rem',
  cursor: 'pointer',
  fontSize: '0.9rem',
}
const labelStyle: React.CSSProperties = { display: 'block', marginBottom: '0.35rem', fontWeight: 600, fontSize: '0.85rem', color: '#374151' }
const inputStyle: React.CSSProperties = { width: '100%', padding: '0.65rem 0.85rem', border: '1.5px solid #e5e7eb', borderRadius: '8px', fontSize: '0.9rem', background: '#fafafa' }
const errorBox: React.CSSProperties = { background: '#fee2e2', color: '#b91c1c', padding: '0.6rem 0.85rem', borderRadius: '8px', fontSize: '0.875rem' }
const btnCancel: React.CSSProperties = { padding: '0.55rem 1.1rem', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '8px', fontWeight: 500, cursor: 'pointer' }
const btnSubmit: React.CSSProperties = { padding: '0.55rem 1.25rem', background: 'linear-gradient(135deg, #7c3aed, #a855f7)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 8px rgba(124,58,237,0.3)' }
