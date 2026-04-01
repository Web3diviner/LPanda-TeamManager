import { useEffect, useRef, useState } from 'react'
import api from '../api'
import { useAuth } from '../context/AuthContext'

interface Transaction { id: string; delta: number; reason: string; created_at: string }
interface Notification { id: string; message: string; read: boolean; created_at: string }
interface PointsData { balance: number; transactions: Transaction[] }

export default function ProfilePage() {
  const { user, setUser } = useAuth()
  const [data, setData] = useState<PointsData | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [error, setError] = useState('')
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    api.get('/points/me')
      .then(res => setData({ balance: res.data.points, transactions: res.data.transactions }))
      .catch(() => setError('Failed to load profile data.'))
    api.get('/notifications').then(res => setNotifications(res.data)).catch(() => {})
    // Refresh avatar from server
    api.get('/auth/me').then(res => {
      if (user) setUser({ ...user, avatar_url: res.data.avatar_url })
    }).catch(() => {})
  }, [])

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { alert('Only image files are supported.'); return }
    if (file.size > 2 * 1024 * 1024) { alert('Image must be under 2MB.'); return }
    setUploadingAvatar(true)
    const reader = new FileReader()
    reader.onload = async (ev) => {
      const base64 = ev.target?.result as string
      try {
        const res = await api.patch('/auth/profile', { avatar_url: base64 })
        if (user) setUser({ ...user, avatar_url: res.data.avatar_url })
      } catch { alert('Failed to upload avatar.') }
      finally { setUploadingAvatar(false) }
    }
    reader.readAsDataURL(file)
  }

  async function markAllRead() {
    await api.patch('/notifications/read-all').catch(() => {})
    setNotifications(n => n.map(x => ({ ...x, read: true })))
  }

  const unread = notifications.filter(n => !n.read).length

  if (error) return <p style={{ color: '#dc2626' }}>{error}</p>
  if (!data) return <p style={{ color: '#6b7280' }}>Loading…</p>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', animation: 'fadeIn 0.3s ease' }}>
      <h2>My Profile</h2>

      {/* Profile hero card */}
      <div style={heroCard}>
        <div style={heroBg} />
        <div style={heroContent}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="Avatar" style={{ ...avatarCircle, objectFit: 'cover' }} />
            ) : (
              <div style={avatarCircle}>{user?.name?.charAt(0).toUpperCase() || '?'}</div>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              style={avatarEditBtn}
              title="Change photo"
            >
              {uploadingAvatar ? '⏳' : '📷'}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: '1.3rem', color: '#1a1035' }}>{user?.name}</div>
            <div style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '0.2rem' }}>{user?.email}</div>
            <span style={roleBadge}>{user?.role === 'admin' ? '👑 Admin' : '👤 Member'}</span>
          </div>
          <div style={pointsCard}>
            <div style={{ fontSize: '0.75rem', color: '#7c3aed', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Points</div>
            <div style={{ fontSize: '3rem', fontWeight: 900, color: '#4c1d95', lineHeight: 1, marginTop: '0.25rem' }}>
              {Number(data.balance).toFixed(1)}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#a78bfa', fontWeight: 500 }}>pts earned</div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div style={sectionCard}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            🔔 Notifications
            {unread > 0 && <span style={unreadBadge}>{unread}</span>}
          </h3>
          {unread > 0 && (
            <button onClick={markAllRead} style={markReadBtn}>Mark all read</button>
          )}
        </div>
        {notifications.length === 0 ? (
          <div style={emptyState}>
            <div style={{ fontSize: '2rem' }}>🔕</div>
            <p style={{ margin: '0.5rem 0 0', color: '#9ca3af', fontSize: '0.875rem' }}>No notifications yet</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {notifications.map(n => (
              <div key={n.id} style={{
                ...notifRow,
                background: n.read ? '#faf9ff' : '#f5f3ff',
                borderColor: n.read ? '#ede9fe' : '#a78bfa',
                borderLeftWidth: n.read ? '1px' : '3px',
              }}>
                <div style={{ flex: 1, fontSize: '0.875rem', color: '#1a1035', fontWeight: n.read ? 400 : 600 }}>{n.message}</div>
                <div style={{ fontSize: '0.72rem', color: '#9ca3af', whiteSpace: 'nowrap' }}>
                  {new Date(n.created_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Transaction history */}
      <div style={sectionCard}>
        <h3 style={{ margin: '0 0 1rem' }}>📜 Transaction History</h3>
        {data.transactions.length === 0 ? (
          <div style={emptyState}>
            <div style={{ fontSize: '2rem' }}>📭</div>
            <p style={{ margin: '0.5rem 0 0', color: '#9ca3af', fontSize: '0.875rem' }}>No transactions yet</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: 'linear-gradient(135deg,#4c1d95,#7c3aed)', color: '#fff' }}>
                  <th style={th}>Reason</th>
                  <th style={{ ...th, textAlign: 'right' }}>Points</th>
                  <th style={{ ...th, textAlign: 'right' }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {data.transactions.map((t, i) => (
                  <tr key={t.id} style={{ borderBottom: '1px solid #f0ebff', background: i % 2 === 0 ? '#fff' : '#faf9ff' }}>
                    <td style={td}>{t.reason}</td>
                    <td style={{ ...td, textAlign: 'right' }}>
                      <span style={{
                        background: t.delta >= 0 ? '#d1fae5' : '#fee2e2',
                        color: t.delta >= 0 ? '#065f46' : '#991b1b',
                        padding: '0.2rem 0.65rem', borderRadius: '20px',
                        fontWeight: 700, fontSize: '0.82rem',
                      }}>
                        {t.delta >= 0 ? '+' : ''}{Number(t.delta).toFixed(1)}
                      </span>
                    </td>
                    <td style={{ ...td, textAlign: 'right', color: '#9ca3af', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                      {new Date(t.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

const sectionCard: React.CSSProperties = {
  background: '#fff', borderRadius: '16px', padding: '1.5rem',
  boxShadow: '0 2px 12px rgba(124,58,237,0.07)', border: '1px solid #ede9fe',
}
const heroCard: React.CSSProperties = {
  ...sectionCard, position: 'relative', overflow: 'hidden',
}
const heroBg: React.CSSProperties = {
  position: 'absolute', top: 0, left: 0, right: 0, height: '80px',
  background: 'linear-gradient(135deg, #4c1d95, #7c3aed, #a855f7)',
}
const heroContent: React.CSSProperties = {
  position: 'relative', display: 'flex', alignItems: 'flex-end',
  gap: '1.25rem', paddingTop: '2.5rem', flexWrap: 'wrap',
}
const avatarCircle: React.CSSProperties = {
  width: '72px', height: '72px', borderRadius: '50%',
  background: 'linear-gradient(135deg,#7c3aed,#a855f7)', color: '#fff',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontSize: '2rem', fontWeight: 900, flexShrink: 0,
  border: '4px solid #fff', boxShadow: '0 4px 16px rgba(124,58,237,0.35)',
}
const avatarEditBtn: React.CSSProperties = {
  position: 'absolute', bottom: 0, right: 0,
  width: '26px', height: '26px', borderRadius: '50%',
  background: '#7c3aed', color: '#fff', border: '2px solid #fff',
  fontSize: '0.7rem', cursor: 'pointer', display: 'flex',
  alignItems: 'center', justifyContent: 'center',
  boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
}
const roleBadge: React.CSSProperties = {
  display: 'inline-block', marginTop: '0.4rem',
  background: 'linear-gradient(135deg,#ede9fe,#ddd6fe)',
  color: '#5b21b6', padding: '0.25rem 0.75rem',
  borderRadius: '20px', fontSize: '0.78rem', fontWeight: 700,
}
const pointsCard: React.CSSProperties = {
  marginLeft: 'auto', background: 'linear-gradient(135deg,#f5f3ff,#ede9fe)',
  border: '1px solid #ddd6fe', borderRadius: '14px',
  padding: '1rem 1.5rem', textAlign: 'center', minWidth: '130px',
  boxShadow: '0 4px 12px rgba(124,58,237,0.1)',
}
const unreadBadge: React.CSSProperties = {
  background: 'linear-gradient(135deg,#ef4444,#dc2626)', color: '#fff',
  borderRadius: '10px', padding: '0.1rem 0.5rem', fontSize: '0.7rem', fontWeight: 700,
}
const markReadBtn: React.CSSProperties = {
  padding: '0.3rem 0.85rem', background: '#f5f3ff', color: '#5b21b6',
  border: '1px solid #c4b5fd', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
}
const notifRow: React.CSSProperties = {
  display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
  padding: '0.65rem 0.9rem', borderRadius: '10px', border: '1px solid',
}
const emptyState: React.CSSProperties = {
  textAlign: 'center', padding: '2rem', color: '#9ca3af',
}
const th: React.CSSProperties = { padding: '0.7rem 1rem', fontWeight: 600, textAlign: 'left', fontSize: '0.78rem', letterSpacing: '0.05em', textTransform: 'uppercase' }
const td: React.CSSProperties = { padding: '0.75rem 1rem', verticalAlign: 'middle' }
