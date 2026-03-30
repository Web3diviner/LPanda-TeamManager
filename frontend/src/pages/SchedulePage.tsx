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

export default function SchedulePage() {
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
      const res = await api.get('/schedule')
      setItems(res.data)
    } catch { setError('Failed to load schedule.') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/schedule', form)
      setForm({ title: '', description: '', day_of_week: 'Monday', time_slot: '' })
      setShowForm(false)
      load()
    } catch { setError('Failed to add item.') }
    finally { setSaving(false) }
  }

  async function handleDelete(id: string) {
    if (!confirm('Remove this schedule item?')) return
    try {
      await api.delete(`/schedule/${id}`)
      setItems(prev => prev.filter(i => i.id !== id))
    } catch { alert('Failed to delete.') }
  }

  const byDay = DAYS.reduce<Record<string, ScheduleItem[]>>((acc, d) => {
    acc[d] = items.filter(i => i.day_of_week === d)
    return acc
  }, {})

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ marginBottom: '0.25rem' }}>📅 Weekly Schedule</h2>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>Shared team activity board for the week</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowForm(s => !s)} style={addBtn}>
            {showForm ? '✕ Cancel' : '➕ Add Activity'}
          </button>
        )}
      </div>

      {error && <p style={{ color: '#dc2626' }}>{error}</p>}

      {isAdmin && showForm && (
        <div style={formCard}>
          <h3 style={{ margin: '0 0 1rem', color: '#4c1d95', fontSize: '1rem' }}>New Activity</h3>
          <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={row}>
              <div style={{ flex: 2 }}>
                <label style={label}>Title *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required style={input} placeholder="e.g. Team Standup" />
              </div>
              <div style={{ flex: 1 }}>
                <label style={label}>Day *</label>
                <select value={form.day_of_week} onChange={e => setForm(f => ({ ...f, day_of_week: e.target.value }))} style={input}>
                  {DAYS.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={label}>Time *</label>
                <input value={form.time_slot} onChange={e => setForm(f => ({ ...f, time_slot: e.target.value }))} required style={input} placeholder="e.g. 9:00 AM" />
              </div>
            </div>
            <div>
              <label style={label}>Description (optional)</label>
              <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={input} placeholder="Brief description..." />
            </div>
            <button type="submit" disabled={saving} style={saveBtn}>{saving ? 'Saving…' : '✅ Save Activity'}</button>
          </form>
        </div>
      )}

      {loading ? (
        <p style={{ color: '#6b7280' }}>Loading…</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {DAYS.map(day => (
            <div key={day} style={dayCard}>
              <div style={dayHeader}>{day}</div>
              {byDay[day].length === 0 ? (
                <p style={{ color: '#9ca3af', fontSize: '0.82rem', margin: '0.5rem 0 0' }}>No activities</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                  {byDay[day].map(item => (
                    <div key={item.id} style={activityItem}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#1e1b4b' }}>{item.title}</div>
                          <div style={{ fontSize: '0.78rem', color: '#7c3aed', fontWeight: 500 }}>🕐 {item.time_slot}</div>
                          {item.description && <div style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: '0.2rem' }}>{item.description}</div>}
                        </div>
                        {isAdmin && (
                          <button onClick={() => handleDelete(item.id)} style={delBtn} title="Remove">✕</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const addBtn: React.CSSProperties = { padding: '0.6rem 1.2rem', background: 'linear-gradient(135deg,#7c3aed,#a855f7)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' }
const formCard: React.CSSProperties = { background: '#fff', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(124,58,237,0.08)', border: '1px solid #ede9fe', marginBottom: '1.5rem' }
const row: React.CSSProperties = { display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }
const label: React.CSSProperties = { display: 'block', marginBottom: '0.25rem', fontWeight: 600, fontSize: '0.82rem', color: '#374151' }
const input: React.CSSProperties = { width: '100%', padding: '0.5rem 0.75rem', border: '1.5px solid #e5e7eb', borderRadius: '8px', fontSize: '0.875rem', background: '#fafafa', boxSizing: 'border-box' }
const saveBtn: React.CSSProperties = { padding: '0.6rem 1.2rem', background: 'linear-gradient(135deg,#7c3aed,#a855f7)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', alignSelf: 'flex-start' }
const dayCard: React.CSSProperties = { background: '#fff', borderRadius: '12px', padding: '1rem', boxShadow: '0 2px 8px rgba(124,58,237,0.08)', border: '1px solid #ede9fe' }
const dayHeader: React.CSSProperties = { fontWeight: 800, fontSize: '0.9rem', color: '#4c1d95', paddingBottom: '0.5rem', borderBottom: '2px solid #ede9fe' }
const activityItem: React.CSSProperties = { background: '#f5f3ff', borderRadius: '8px', padding: '0.6rem 0.75rem', border: '1px solid #ede9fe' }
const delBtn: React.CSSProperties = { background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '0.8rem', padding: '0.1rem 0.3rem', flexShrink: 0 }
