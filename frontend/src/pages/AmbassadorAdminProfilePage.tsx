import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ambassadorAdminApi from '../ambassadorAdminApi'

interface Transaction { id: string; delta: number; reason: string; created_at: string }
interface AmbassadorProfile {
  id: string; name: string; email: string; role_title: string | null
  points: number; avatar_url: string | null; created_at: string
  transactions: Transaction[]
}

export default function AmbassadorAdminProfilePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<AmbassadorProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [delta, setDelta] = useState('')
  const [reason, setReason] = useState('')
  const [adjusting, setAdjusting] = useState(false)
  const [msg, setMsg] = useState('')

  async function load() {
    try {
      const res = await ambassadorAdminApi.get(`/ambassador-admin/ambassadors/${id}`)
      setProfile(res.data)
    } catch {
      navigate('/ambassador-admin/ambassadors')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  async function handleAdjust(e: React.FormEvent) {
    e.preventDefault()
    const d = parseFloat(delta)
    if (!d || d === 0) return
    setAdjusting(true)
    try {
      await ambassadorAdminApi.post(`/ambassador-admin/ambassadors/${id}/adjust-points`, { delta: d, reason })
      setMsg('Points adjusted successfully (silent — ambassador not notified)')
      setDelta('')
      setReason('')
      load()
    } catch (err: any) {
      setMsg(err.response?.data?.error ?? 'Failed to adjust points')
    } finally {
      setAdjusting(false)
    }
  }

  if (loading) return <p>Loading…</p>
  if (!profile) return null

  return (
    <div>
      <button onClick={() => navigate('/ambassador-admin/ambassadors')} style={backBtn}>← Back to Ambassadors</button>

      {msg && <div style={msgBox}>{msg} <button onClick={() => setMsg('')} style={closeBtn}>✕</button></div>}

      <div style={profileCard}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div style={avatarCircle}>
            {profile.avatar_url
              ? <img src={profile.avatar_url} alt={profile.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
              : <span style={{ fontSize: '2.5rem' }}>🤝</span>}
          </div>
          <div>
            <h1 style={{ margin: '0 0 0.25rem', fontSize: '1.6rem', fontWeight: 900, color: '#1e3a5f' }}>{profile.name}</h1>
            <p style={{ margin: '0 0 0.25rem', color: '#64748b' }}>{profile.email}</p>
            {profile.role_title && <p style={{ margin: '0 0 0.25rem', color: '#374151', fontWeight: 600 }}>{profile.role_title}</p>}
            <span style={pointsBadge}>⭐ {profile.points.toFixed(1)} points</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
        {/* Silent Point Adjustment */}
        <div style={card}>
          <h2 style={cardTitle}>🔧 Adjust Points (Silent)</h2>
          <div style={silentNote}>⚠️ Ambassador will NOT be notified of this adjustment.</div>
          <form onSubmit={handleAdjust} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
            <div>
              <label style={labelStyle}>Delta</label>
              <input type="number" value={delta} onChange={e => setDelta(e.target.value)} style={inputStyle} placeholder="e.g. -5 or 10" required />
            </div>
            <div>
              <label style={labelStyle}>Reason (optional)</label>
              <input type="text" value={reason} onChange={e => setReason(e.target.value)} style={inputStyle} placeholder="e.g. Late submission" />
            </div>
            <button type="submit" disabled={adjusting} style={submitBtn}>
              {adjusting ? 'Applying…' : 'Apply Adjustment'}
            </button>
          </form>
        </div>

        {/* Transaction History */}
        <div style={card}>
          <h2 style={cardTitle}>📜 Point History</h2>
          {profile.transactions.length === 0
            ? <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>No transactions yet</p>
            : (
              <div style={{ maxHeight: '320px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {profile.transactions.map(tx => (
                  <div key={tx.id} style={txRow}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#374151' }}>{tx.reason}</div>
                      <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{new Date(tx.created_at).toLocaleString()}</div>
                    </div>
                    <span style={{ fontWeight: 700, color: tx.delta >= 0 ? '#059669' : '#dc2626', fontSize: '0.95rem' }}>
                      {tx.delta >= 0 ? '+' : ''}{tx.delta}
                    </span>
                  </div>
                ))}
              </div>
            )}
        </div>
      </div>
    </div>
  )
}

const backBtn: React.CSSProperties = { background: 'none', border: 'none', color: '#1e5fa8', fontWeight: 600, cursor: 'pointer', fontSize: '0.95rem', padding: '0 0 1rem', display: 'block' }
const profileCard: React.CSSProperties = { background: '#fff', borderRadius: '16px', padding: '1.5rem 2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }
const avatarCircle: React.CSSProperties = { width: '80px', height: '80px', borderRadius: '50%', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }
const pointsBadge: React.CSSProperties = { background: '#dbeafe', color: '#1e40af', padding: '0.3rem 0.8rem', borderRadius: '12px', fontWeight: 700, fontSize: '0.9rem', display: 'inline-block', marginTop: '0.25rem' }
const card: React.CSSProperties = { background: '#fff', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }
const cardTitle: React.CSSProperties = { margin: '0 0 1rem', fontSize: '1rem', fontWeight: 700, color: '#1e3a5f' }
const silentNote: React.CSSProperties = { background: '#fef3c7', border: '1px solid #fcd34d', color: '#92400e', borderRadius: '8px', padding: '0.65rem', fontSize: '0.82rem' }
const labelStyle: React.CSSProperties = { display: 'block', marginBottom: '0.35rem', fontWeight: 600, fontSize: '0.85rem', color: '#374151' }
const inputStyle: React.CSSProperties = { width: '100%', padding: '0.65rem 0.9rem', borderRadius: '8px', border: '1.5px solid #d1d5db', fontSize: '0.95rem', boxSizing: 'border-box' }
const submitBtn: React.CSSProperties = { background: '#1e5fa8', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.7rem', fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem' }
const txRow: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.75rem', background: '#f8fafc', borderRadius: '8px' }
const msgBox: React.CSSProperties = { background: '#f0fdf4', border: '1px solid #86efac', color: '#166534', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }
const closeBtn: React.CSSProperties = { background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', color: '#166534' }
