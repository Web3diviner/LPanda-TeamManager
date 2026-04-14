import { useEffect, useState } from 'react'
import api from '../api'
import { useAuth } from '../context/AuthContext'

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']

interface ScheduleItem {
  id: string
  title: string
  description: string | null
  day_of_week: string
  time_slot: string
  created_by_name: string | null
}

export default function AmbassadorSchedulePage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [items, setItems] = useState<ScheduleItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', day_of_week: 'Monday', time_slot: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function load() {
    try {
      const res = await api.get('/schedule/ambassador')
      setItems(res.data)
    } catch { setError('Failed to load ambassador schedule.') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/schedule/ambassador', form)
      setForm({ title: '', description: '', day_of_week: 'Monday', time_slot: '' })
      setShowForm(false)
      load()
    } catch { setError('Failed to add item.') }
    finally { setSaving(false) }
  }

  async function handleDelete(id: string) {
    if (!confirm('Remove this schedule item?')) return
    try {
      await api.delete(`/schedule/ambassador/${id}`)
      setItems(prev => prev.filter(item => item.id !== id))
    } catch { setError('Failed to remove item.') }
  }

  if (loading) return <p style={{ color: '#6b7280' }}>Loading…</p>
  if (error) return <p style={{ color: '#dc2626' }}>{error}</p>

  const grouped = DAYS.reduce((acc, day) => {
    acc[day] = items.filter(item => item.day_of_week === day)
    return acc
  }, {} as Record<string, ScheduleItem[]>)

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2>🤝 Ambassador Schedule</h2>
        {isAdmin && (
          <button onClick={() => setShowForm(true)} style={addBtn}>
            ➕ Add Item
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleAdd} style={formStyle}>
          <h3>Add Schedule Item</h3>
          <input
            type="text"
            placeholder="Title"
            value={form.title}
            onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
            required
            style={inputStyle}
          />
          <textarea
            placeholder="Description (optional)"
            value={form.description}
            onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
            style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
          />
          <select
            value={form.day_of_week}
            onChange={e => setForm(prev => ({ ...prev, day_of_week: e.target.value }))}
            style={inputStyle}
          >
            {DAYS.map(day => <option key={day} value={day}>{day}</option>)}
          </select>
          <input
            type="text"
            placeholder="Time (e.g., 10:00 AM)"
            value={form.time_slot}
            onChange={e => setForm(prev => ({ ...prev, time_slot: e.target.value }))}
            required
            style={inputStyle}
          />
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="submit" disabled={saving} style={submitBtn}>
              {saving ? 'Adding...' : 'Add'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} style={cancelBtn}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {DAYS.map(day => (
          <div key={day} style={dayCard}>
            <h3 style={dayTitle}>{day}</h3>
            {grouped[day].length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📭</div>
                <p style={{ margin: 0 }}>No items scheduled</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {grouped[day].map(item => (
                  <div key={item.id} style={itemCard}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontWeight: 600, color: '#1e1b4b', marginBottom: '0.25rem' }}>{item.title}</div>
                        <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>{item.time_slot}</div>
                        {item.description && (
                          <div style={{ fontSize: '0.85rem', color: '#4b5563', marginTop: '0.5rem' }}>{item.description}</div>
                        )}
                        {item.created_by_name && (
                          <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '0.25rem' }}>by {item.created_by_name}</div>
                        )}
                      </div>
                      {isAdmin && (
                        <button onClick={() => handleDelete(item.id)} style={deleteBtn}>
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

const addBtn: React.CSSProperties = {
  background: '#7c3aed', color: '#fff', border: 'none', padding: '0.5rem 1rem',
  borderRadius: '8px', fontWeight: 600, cursor: 'pointer',
}
const formStyle: React.CSSProperties = {
  background: '#fff', border: '1px solid #ede9fe', borderRadius: '12px',
  padding: '1.5rem', marginBottom: '2rem', boxShadow: '0 4px 12px rgba(124,58,237,0.08)',
}
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '6px',
  fontSize: '0.9rem', marginBottom: '1rem', boxSizing: 'border-box',
}
const submitBtn: React.CSSProperties = {
  background: '#7c3aed', color: '#fff', border: 'none', padding: '0.5rem 1rem',
  borderRadius: '6px', fontWeight: 600, cursor: 'pointer',
}
const cancelBtn: React.CSSProperties = {
  background: '#6b7280', color: '#fff', border: 'none', padding: '0.5rem 1rem',
  borderRadius: '6px', fontWeight: 600, cursor: 'pointer',
}
const dayCard: React.CSSProperties = {
  background: '#fff', border: '1px solid #ede9fe', borderRadius: '12px',
  padding: '1.5rem', boxShadow: '0 2px 8px rgba(124,58,237,0.08)',
}
const dayTitle: React.CSSProperties = {
  margin: '0 0 1rem 0', color: '#4c1d95', fontSize: '1.1rem', fontWeight: 600,
}
const itemCard: React.CSSProperties = {
  background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1rem',
}
const deleteBtn: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem',
}