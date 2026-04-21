import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ambassadorAdminApi from '../ambassadorAdminApi'

interface Ambassador {
  id: string
  name: string
  email: string
  role_title: string | null
  points: number
}

export default function AmbassadorAdminAmbassadorsPage() {
  const navigate = useNavigate()
  const [ambassadors, setAmbassadors] = useState<Ambassador[]>([])
  const [loading, setLoading] = useState(true)
  const [adjustTarget, setAdjustTarget] = useState<Ambassador | null>(null)
  const [delta, setDelta] = useState('')
  const [reason, setReason] = useState('')
  const [adjusting, setAdjusting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Ambassador | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [msg, setMsg] = useState('')

  async function load() {
    try {
      const res = await ambassadorAdminApi.get('/ambassador-admin/ambassadors')
      setAmbassadors(res.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function handleAdjust() {
    if (!adjustTarget) return
    const d = parseFloat(delta)
    if (!d || d === 0) return
    setAdjusting(true)
    try {
      await ambassadorAdminApi.post(`/ambassador-admin/ambassadors/${adjustTarget.id}/adjust-points`, { delta: d, reason })
      setMsg(`Points adjusted for ${adjustTarget.name}`)
      setAdjustTarget(null)
      setDelta('')
      setReason('')
      load()
    } catch (err: any) {
      setMsg(err.response?.data?.error ?? 'Failed to adjust points')
    } finally {
      setAdjusting(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await ambassadorAdminApi.delete(`/ambassador-admin/ambassadors/${deleteTarget.id}`)
      setMsg(`${deleteTarget.name} deleted`)
      setDeleteTarget(null)
      load()
    } catch (err: any) {
      setMsg(err.response?.data?.error ?? 'Failed to delete')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div>
      <h1 style={h1}>🤝 Ambassadors</h1>
      {msg && <div style={msgBox}>{msg} <button onClick={() => setMsg('')} style={closeBtn}>✕</button></div>}

      {loading ? <p>Loading…</p> : (
        <div style={tableWrap}>
          <table style={tableStyle}>
            <thead>
              <tr style={theadRow}>
                <th style={th}>Name</th>
                <th style={th}>Email</th>
                <th style={th}>Title</th>
                <th style={th}>Points</th>
                <th style={th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {ambassadors.map(a => (
                <tr key={a.id} style={tbodyRow}>
                  <td style={td}><strong>{a.name}</strong></td>
                  <td style={td}>{a.email}</td>
                  <td style={td}>{a.role_title ?? '—'}</td>
                  <td style={td}><span style={pointsBadge}>{a.points.toFixed(1)}</span></td>
                  <td style={{ ...td, display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button onClick={() => navigate(`/ambassador-admin/ambassadors/${a.id}`)} style={actionBtn('#1e5fa8')}>View</button>
                    <button onClick={() => { setAdjustTarget(a); setDelta(''); setReason('') }} style={actionBtn('#059669')}>Adjust Points</button>
                    <button onClick={() => setDeleteTarget(a)} style={actionBtn('#dc2626')}>Delete</button>
                  </td>
                </tr>
              ))}
              {ambassadors.length === 0 && (
                <tr><td colSpan={5} style={{ ...td, textAlign: 'center', color: '#9ca3af' }}>No ambassadors found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Adjust Points Modal */}
      {adjustTarget && (
        <div style={overlay}>
          <div style={modal}>
            <h2 style={{ margin: '0 0 0.25rem', color: '#1e3a5f' }}>Adjust Points</h2>
            <p style={{ color: '#64748b', margin: '0 0 1rem', fontSize: '0.9rem' }}>
              For: <strong>{adjustTarget.name}</strong> (current: {adjustTarget.points.toFixed(1)} pts)
            </p>
            <div style={silentNote}>⚠️ This adjustment is <strong>silent</strong> — the ambassador will NOT be notified.</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
              <div>
                <label style={labelStyle}>Delta (positive = award, negative = deduct)</label>
                <input type="number" value={delta} onChange={e => setDelta(e.target.value)} style={inputStyle} placeholder="e.g. -5 or 10" />
              </div>
              <div>
                <label style={labelStyle}>Reason (optional)</label>
                <input type="text" value={reason} onChange={e => setReason(e.target.value)} style={inputStyle} placeholder="e.g. Late submission penalty" />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button onClick={() => setAdjustTarget(null)} style={cancelBtn}>Cancel</button>
                <button onClick={handleAdjust} disabled={adjusting || !delta} style={confirmBtn('#059669')}>
                  {adjusting ? 'Saving…' : 'Apply'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteTarget && (
        <div style={overlay}>
          <div style={modal}>
            <h2 style={{ margin: '0 0 0.5rem', color: '#dc2626' }}>Delete Ambassador</h2>
            <p style={{ color: '#374151' }}>Are you sure you want to delete <strong>{deleteTarget.name}</strong>? This cannot be undone.</p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button onClick={() => setDeleteTarget(null)} style={cancelBtn}>Cancel</button>
              <button onClick={handleDelete} disabled={deleting} style={confirmBtn('#dc2626')}>
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const h1: React.CSSProperties = { margin: '0 0 1.5rem', fontSize: '1.6rem', fontWeight: 900, color: '#1e3a5f' }
const tableWrap: React.CSSProperties = { overflowX: 'auto', background: '#fff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }
const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse' }
const theadRow: React.CSSProperties = { background: '#f1f5f9' }
const tbodyRow: React.CSSProperties = { borderBottom: '1px solid #f1f5f9' }
const th: React.CSSProperties = { padding: '0.85rem 1rem', textAlign: 'left', fontWeight: 700, fontSize: '0.85rem', color: '#374151' }
const td: React.CSSProperties = { padding: '0.85rem 1rem', fontSize: '0.9rem', color: '#374151' }
const pointsBadge: React.CSSProperties = { background: '#dbeafe', color: '#1e40af', padding: '0.2rem 0.6rem', borderRadius: '12px', fontWeight: 700, fontSize: '0.85rem' }
const actionBtn = (color: string): React.CSSProperties => ({ background: color, color: '#fff', border: 'none', borderRadius: '6px', padding: '0.35rem 0.75rem', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' })
const msgBox: React.CSSProperties = { background: '#f0fdf4', border: '1px solid #86efac', color: '#166534', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }
const closeBtn: React.CSSProperties = { background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', color: '#166534' }
const overlay: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }
const modal: React.CSSProperties = { background: '#fff', borderRadius: '16px', padding: '2rem', width: '100%', maxWidth: '440px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }
const silentNote: React.CSSProperties = { background: '#fef3c7', border: '1px solid #fcd34d', color: '#92400e', borderRadius: '8px', padding: '0.75rem', fontSize: '0.85rem' }
const labelStyle: React.CSSProperties = { display: 'block', marginBottom: '0.35rem', fontWeight: 600, fontSize: '0.85rem', color: '#374151' }
const inputStyle: React.CSSProperties = { width: '100%', padding: '0.65rem 0.9rem', borderRadius: '8px', border: '1.5px solid #d1d5db', fontSize: '0.95rem', boxSizing: 'border-box' }
const cancelBtn: React.CSSProperties = { background: '#f1f5f9', border: '1px solid #d1d5db', color: '#374151', borderRadius: '8px', padding: '0.6rem 1.25rem', fontWeight: 600, cursor: 'pointer' }
const confirmBtn = (color: string): React.CSSProperties => ({ background: color, color: '#fff', border: 'none', borderRadius: '8px', padding: '0.6rem 1.25rem', fontWeight: 700, cursor: 'pointer' })
