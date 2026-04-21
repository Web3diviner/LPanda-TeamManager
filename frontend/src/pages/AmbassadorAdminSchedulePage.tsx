import { useEffect, useState } from 'react'
import ambassadorAdminApi from '../ambassadorAdminApi'

interface ScheduleItem {
  id: string; title: string; description: string | null
  day_of_week: string; time_slot: string; created_by_name: string | null
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export default function AmbassadorAdminSchedulePage() {
  const [items, setItems] = useState<ScheduleItem[]>([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [day, setDay] = useState('Monday')
  const [time, setTime] = useState('')
  const [saving, setSaving] = useState(false)

  async function load() {
    try {
      const res = await ambassadorAdminApi.get('/ambassador-admin/schedule')
      setItems(res.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!title || !time) return
    setSaving(true)
    try {
      await ambassadorAdminApi.post('/ambassador-admin/schedule', { title, description: desc, day_of_week: day, time_slot: time })
      setMsg('Schedule item added')
      setTitle(''); setDesc(''); setTime('')
      load()
    } catch (err: any) {
      setMsg(err.response?.data?.error ?? 'Failed to add item')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      await ambassadorAdminApi.delete(`/ambassador-admin/schedule/${id}`)
      setMsg('Item removed')
      load()
    } catch (err: any) {
      setMsg(err.response?.data?.error ?? 'Failed to remove')
    }
  }

  const grouped = DAYS.reduce<Record<string, ScheduleItem[]>>((acc, d) => {
    acc[d] = items.filter(i => i.day_of_week === d)
    return acc
  }, {})

  return (
    <div>
      <h1 style={h1}>📅 Ambassador Schedule</h1>
      {msg && <div style={msgBox}>{msg} <button onClick={() => setMsg('')} style={closeBtn}>✕</button></div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* Add form */}
        <div style={card}>
          <h2 style={cardTitle}>➕ Add Schedule Item</h2>
          <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div>
              <label style={labelStyle}>Title *</label>
              <input value={title} onChange={e => setTitle(e.target.value)} style={inputStyle} placeholder="e.g. Morning standup" required />
            </div>
            <div>
              <label style={labelStyle}>Description</label>
              <input value={desc} onChange={e => setDesc(e.target.value)} style={inputStyle} placeholder="Optional" />
            </div>
            <div>
              <label style={labelStyle}>Day *</label>
              <select value={day} onChange={e => setDay(e.target.value)} style={inputStyle}>
                {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Time *</label>
              <input value={time} onChange={e => setTime(e.target.value)} style={inputStyle} placeholder="e.g. 9:00 AM" required />
            </div>
            <button type="submit" disabled={saving} style={submitBtn}>
              {saving ? 'Adding…' : 'Add Item'}
            </button>
          </form>
        </div>

        {/* Schedule by day */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {loading ? <p>Loading…</p> : DAYS.map(d => (
            grouped[d].length > 0 && (
              <div key={d} style={dayCard}>
                <h3 style={dayTitle}>{d}</h3>
                {grouped[d].map(item => (
                  <div key={item.id} style={itemRow}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, color: '#1e3a5f', fontSize: '0.95rem' }}>{item.title}</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{item.time_slot}{item.description ? ` — ${item.description}` : ''}</div>
                    </div>
                    <button onClick={() => handleDelete(item.id)} style={deleteBtn}>✕</button>
                  </div>
                ))}
              </div>
            )
          ))}
          {!loading && items.length === 0 && (
            <div style={{ color: '#9ca3af', textAlign: 'center', padding: '2rem' }}>No schedule items yet</div>
          )}
        </div>
      </div>
    </div>
  )
}

const h1: React.CSSProperties = { margin: '0 0 1.5rem', fontSize: '1.6rem', fontWeight: 900, color: '#1e3a5f' }
const card: React.CSSProperties = { background: '#fff', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', alignSelf: 'start' }
const cardTitle: React.CSSProperties = { margin: '0 0 1rem', fontSize: '1rem', fontWeight: 700, color: '#1e3a5f' }
const dayCard: React.CSSProperties = { background: '#fff', borderRadius: '12px', padding: '1rem 1.25rem', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }
const dayTitle: React.CSSProperties = { margin: '0 0 0.75rem', fontSize: '0.95rem', fontWeight: 700, color: '#1e5fa8', textTransform: 'uppercase', letterSpacing: '0.05em' }
const itemRow: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0', borderBottom: '1px solid #f1f5f9' }
const labelStyle: React.CSSProperties = { display: 'block', marginBottom: '0.35rem', fontWeight: 600, fontSize: '0.85rem', color: '#374151' }
const inputStyle: React.CSSProperties = { width: '100%', padding: '0.65rem 0.9rem', borderRadius: '8px', border: '1.5px solid #d1d5db', fontSize: '0.95rem', boxSizing: 'border-box' }
const submitBtn: React.CSSProperties = { background: '#1e5fa8', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.7rem', fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem' }
const deleteBtn: React.CSSProperties = { background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '6px', width: '28px', height: '28px', cursor: 'pointer', fontWeight: 700, flexShrink: 0 }
const msgBox: React.CSSProperties = { background: '#f0fdf4', border: '1px solid #86efac', color: '#166534', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }
const closeBtn: React.CSSProperties = { background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', color: '#166534' }
