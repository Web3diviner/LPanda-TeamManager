import { useEffect, useState, type FormEvent } from 'react'
import api from '../api'

interface User { id: string; name: string }

interface Props {
  onClose: () => void
  onDelegated: () => void
}

export default function DelegateTaskModal({ onClose, onDelegated }: Props) {
  const [users, setUsers] = useState<User[]>([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [deadline, setDeadline] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.get('/auth/users').then(res => {
      const members = res.data.filter((u: User & { role: string }) => u.role === 'member')
      setUsers(members)
      if (members.length > 0) setAssignedTo(members[0].id)
    }).catch(() => setError('Failed to load users.'))
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (!title.trim() || !description.trim() || !deadline) {
      setError('All fields are required.')
      return
    }
    setLoading(true)
    try {
      await api.post('/delegated', { title, description, assigned_to: assignedTo, deadline })
      onDelegated()
      onClose()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to delegate task.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={overlay}>
      <div style={modal}>
        <div style={header}>
          <h2 style={{ margin: 0, fontSize: '1.1rem', color: '#fff' }}>🎯 Delegate Task</h2>
          <button onClick={onClose} style={closeBtn}>✕</button>
        </div>
        <div style={{ padding: '1.5rem' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            <div>
              <label style={label}>Title</label>
              <input value={title} onChange={e => setTitle(e.target.value)} required placeholder="Task title" style={input} />
            </div>
            <div>
              <label style={label}>Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} required rows={3}
                placeholder="Describe what needs to be done…" style={{ ...input, resize: 'vertical' }} />
            </div>
            <div>
              <label style={label}>Assign To</label>
              <select value={assignedTo} onChange={e => setAssignedTo(e.target.value)} style={input}>
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div>
              <label style={label}>Deadline</label>
              <input type="datetime-local" value={deadline} onChange={e => setDeadline(e.target.value)} required style={input} />
            </div>
            {error && <div style={errorBox}>⚠️ {error}</div>}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button type="button" onClick={onClose} style={cancelBtn}>Cancel</button>
              <button type="submit" disabled={loading} style={submitBtn}>
                {loading ? '⏳ Delegating…' : '🎯 Delegate Task'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

const overlay: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(76,29,149,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }
const modal: React.CSSProperties = { background: '#fff', borderRadius: '14px', width: '100%', maxWidth: '460px', boxShadow: '0 20px 60px rgba(0,0,0,0.25)', overflow: 'hidden' }
const header: React.CSSProperties = { background: 'linear-gradient(135deg,#4c1d95,#7c3aed)', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }
const closeBtn: React.CSSProperties = { background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', borderRadius: '6px', padding: '0.2rem 0.5rem', cursor: 'pointer' }
const label: React.CSSProperties = { display: 'block', marginBottom: '0.35rem', fontWeight: 600, fontSize: '0.85rem', color: '#374151' }
const input: React.CSSProperties = { width: '100%', padding: '0.65rem 0.85rem', border: '1.5px solid #e5e7eb', borderRadius: '8px', fontSize: '0.9rem', background: '#fafafa' }
const errorBox: React.CSSProperties = { background: '#fee2e2', color: '#b91c1c', padding: '0.6rem 0.85rem', borderRadius: '8px', fontSize: '0.875rem' }
const cancelBtn: React.CSSProperties = { padding: '0.55rem 1.1rem', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '8px', fontWeight: 500, cursor: 'pointer' }
const submitBtn: React.CSSProperties = { padding: '0.55rem 1.25rem', background: 'linear-gradient(135deg,#7c3aed,#a855f7)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 8px rgba(124,58,237,0.3)' }
