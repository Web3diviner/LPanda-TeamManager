import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ambassadorAdminApi from '../ambassadorAdminApi'
import { useAmbassadorAdminAuth } from '../context/AmbassadorAdminAuthContext'

export default function AmbassadorAdminDashboardPage() {
  const { user } = useAmbassadorAdminAuth()
  const navigate = useNavigate()
  const [ambassadorCount, setAmbassadorCount] = useState<number | null>(null)
  const [pendingCount, setPendingCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [ambRes, taskRes] = await Promise.all([
          ambassadorAdminApi.get('/ambassador-admin/ambassadors'),
          ambassadorAdminApi.get('/ambassador-admin/pending-tasks'),
        ])
        setAmbassadorCount(ambRes.data.length)
        setPendingCount(taskRes.data.length)
      } catch {
        // handled by interceptor
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const cards = [
    { label: 'Total Ambassadors', value: ambassadorCount, icon: '🤝', path: '/ambassador-admin/ambassadors', color: '#1e5fa8' },
    { label: 'Pending Tasks', value: pendingCount, icon: '📋', path: '/ambassador-admin/tasks', color: '#d97706' },
  ]

  const navCards = [
    { label: 'Ambassadors', icon: '🤝', path: '/ambassador-admin/ambassadors', desc: 'Manage ambassador accounts and points' },
    { label: 'Tasks', icon: '📋', path: '/ambassador-admin/tasks', desc: 'View, assign, confirm and remove tasks' },
    { label: 'Leaderboard', icon: '🏆', path: '/ambassador-admin/leaderboard', desc: 'Ambassador points rankings' },
    { label: 'Schedule', icon: '📅', path: '/ambassador-admin/schedule', desc: 'Manage ambassador schedule items' },
  ]

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ margin: '0 0 0.25rem', fontSize: '1.8rem', fontWeight: 900, color: '#1e3a5f' }}>
          Welcome back, {user?.name} 👋
        </h1>
        <p style={{ color: '#64748b', margin: 0 }}>Ambassador Admin Panel</p>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {cards.map(card => (
          <div
            key={card.label}
            onClick={() => navigate(card.path)}
            style={{ ...summaryCard, borderLeft: `4px solid ${card.color}`, cursor: 'pointer' }}
          >
            <div style={{ fontSize: '2rem' }}>{card.icon}</div>
            <div>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: card.color }}>
                {loading ? '…' : card.value ?? '—'}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>{card.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation cards */}
      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#374151', marginBottom: '1rem' }}>Quick Access</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        {navCards.map(card => (
          <div
            key={card.label}
            onClick={() => navigate(card.path)}
            style={navCardStyle}
          >
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{card.icon}</div>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: '#1e3a5f', marginBottom: '0.25rem' }}>{card.label}</div>
            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{card.desc}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

const summaryCard: React.CSSProperties = {
  background: '#fff',
  borderRadius: '12px',
  padding: '1.25rem 1.5rem',
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
}
const navCardStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: '12px',
  padding: '1.5rem',
  cursor: 'pointer',
  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  transition: 'transform 0.15s, box-shadow 0.15s',
  border: '1px solid #e5e7eb',
}
