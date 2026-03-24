import { useEffect, useState } from 'react'
import api from '../api'
import { useAuth } from '../context/AuthContext'

interface Transaction { id: string; delta: number; reason: string; created_at: string }
interface Notification { id: string; message: string; read: boolean; created_at: string }
interface PointsData { balance: number; transactions: Transaction[] }

export default function ProfilePage() {
  const { user } = useAuth()
  const [data, setData] = useState<PointsData | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/points/me')
      .then(res => setData({ balance: res.data.points, transactions: res.data.transactions }))
      .catch(() => setError('Failed to load profile data.'))
    api.get('/notifications').then(res => setNotifications(res.data)).catch(() => {})
  }, [])

  async function markAllRead() {
    await api.patch('/notifications/read-all').catch(() => {})
    setNotifications(n => n.map(x => ({ ...x, read: true })))
  }

  const unread = notifications.filter(n => !n.read).length

  if (error) return <p style={{ color: '#dc2626' }}>{error}</p>
  if (!data) return <p style={{ color: '#6b7280' }}>Loading…</p>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <h2>👤 My Profile</h2>

      {/* Profile header */}
      <div style={profileHeader}>
        <div style={avatarCircle}>{user?.name?.charAt(0).toUpperCase() || '?'}</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '1.2rem', color: '#1e1b4b' }}>{user?.name}</div>
          <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>{user?.email}</div>
          <span style={roleBadge}>{user?.role === 'admin' ? '👑 Admin' : '👤 Member'}</span>
        </div>
        <div style={pointsCard}>
          <div style={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: 500 }}>Total Points</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#7c3aed', lineHeight: 1.1 }}>
            {Number(data.balance).toFixed(1)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#a78bfa' }}>pts</div>
        </div>
      </div>

      {/* Notifications */}
      <div style={sectionCard}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <h3 style={{ margin: 0, color: '#4c1d95' }}>
            🔔 Notifications
            {unread > 0 && <span style={unreadBadge}>{unread}</span>}
          </h3>
          {unread > 0 && (
            <button onClick={markAllRead} style={markReadBtn}>Mark all read</button>
          )}
        </div>
        {notifications.length === 0 ? (
          <p style={{ color: '#9ca3af', fontSize: '0.875rem', margin: 0 }}>No notifications.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {notifications.map(n => (
              <div key={n.id} style={{ ...notifRow, background: n.read ? '#faf9ff' : '#f5f3ff', borderColor: n.read ? '#ede9fe' : '#c4b5fd' }}>
                <div style={{ flex: 1, fontSize: '0.875rem', color: '#1e1b4b', fontWeight: n.read ? 400 : 600 }}>{n.message}</div>
                <div style={{ fontSize: '0.75rem', color: '#9ca3af', whiteSpace: 'nowrap' }}>{new Date(n.created_at).toLocaleString()}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Transaction history */}
      <div style={sectionCard}>
        <h3 style={{ margin: '0 0 0.75rem', color: '#4c1d95' }}>📜 Transaction History</h3>
        {data.transactions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '1.5rem', color: '#9ca3af' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.35rem' }}>📭</div>
            <p style={{ margin: 0 }}>No transactions yet.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', boxShadow: 'none', border: 'none' }}>
              <thead>
                <tr style={{ background: 'linear-gradient(135deg,#4c1d95,#7c3aed)', color: '#fff' }}>
                  <th style={th}>Reason</th>
                  <th style={{ ...th, textAlign: 'right' }}>Points</th>
                  <th style={{ ...th, textAlign: 'right' }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {data.transactions.map((t, i) => (
                  <tr key={t.id} style={{ borderBottom: '1px solid #ede9fe', background: i % 2 === 0 ? '#fff' : '#faf9ff' }}>
                    <td style={td}>{t.reason}</td>
                    <td style={{ ...td, textAlign: 'right' }}>
                      <span style={{ background: t.delta >= 0 ? '#d1fae5' : '#fee2e2', color: t.delta >= 0 ? '#065f46' : '#991b1b', padding: '0.2rem 0.6rem', borderRadius: '20px', fontWeight: 700, fontSize: '0.82rem' }}>
                        {t.delta >= 0 ? '+' : ''}{Number(t.delta).toFixed(1)}
                      </span>
                    </td>
                    <td style={{ ...td, textAlign: 'right', color: '#6b7280', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
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

const sectionCard: React.CSSProperties = { background: '#fff', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(124,58,237,0.08)', border: '1px solid #ede9fe' }
const profileHeader: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '1.5rem', ...sectionCard, flexWrap: 'wrap' }
const avatarCircle: React.CSSProperties = { width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#a855f7)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem', fontWeight: 800, flexShrink: 0 }
const roleBadge: React.CSSProperties = { display: 'inline-block', marginTop: '0.35rem', background: '#ede9fe', color: '#5b21b6', padding: '0.2rem 0.65rem', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 600 }
const pointsCard: React.CSSProperties = { marginLeft: 'auto', background: 'linear-gradient(135deg,#f5f3ff,#ede9fe)', border: '1px solid #ddd6fe', borderRadius: '10px', padding: '1rem 1.5rem', textAlign: 'center', minWidth: '120px' }
const unreadBadge: React.CSSProperties = { marginLeft: '0.5rem', background: '#ef4444', color: '#fff', borderRadius: '10px', padding: '0.1rem 0.45rem', fontSize: '0.72rem', fontWeight: 700 }
const markReadBtn: React.CSSProperties = { padding: '0.3rem 0.75rem', background: '#ede9fe', color: '#5b21b6', border: '1px solid #c4b5fd', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }
const notifRow: React.CSSProperties = { display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid' }
const th: React.CSSProperties = { padding: '0.65rem 1rem', fontWeight: 600, textAlign: 'left', fontSize: '0.82rem' }
const td: React.CSSProperties = { padding: '0.7rem 1rem', verticalAlign: 'middle' }
