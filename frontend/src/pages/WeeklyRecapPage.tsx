import { useEffect, useState } from 'react'
import api from '../api'

interface MemberRecap {
  id: string
  name: string
  net_change: number
  completed: number
}

interface RecapData {
  total_completed: number
  total_awarded: number
  total_deducted: number
  members: MemberRecap[]
}

export default function WeeklyRecapPage() {
  const [data, setData] = useState<RecapData | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/recap/weekly')
      .then(res => setData(res.data))
      .catch(() => setError('Failed to load weekly recap.'))
  }, [])

  if (error) return <p style={{ color: '#dc2626' }}>{error}</p>
  if (!data) return <p style={{ color: '#6b7280' }}>Loading…</p>

  return (
    <div>
      <h2>📊 Weekly Recap</h2>

      <div style={statsGrid}>
        <StatCard icon="✅" label="Tasks Completed" value={data.total_completed} color="#059669" bg="#d1fae5" border="#6ee7b7" />
        <StatCard icon="⭐" label="Points Awarded" value={`+${Number(data.total_awarded).toFixed(1)}`} color="#7c3aed" bg="#ede9fe" border="#c4b5fd" />
        <StatCard icon="📉" label="Points Deducted" value={`-${Number(data.total_deducted).toFixed(1)}`} color="#dc2626" bg="#fee2e2" border="#fca5a5" />
        <StatCard icon="📈" label="Net Change" value={(Number(data.total_awarded) - Number(data.total_deducted)).toFixed(1)} color="#0284c7" bg="#e0f2fe" border="#7dd3fc" />
      </div>

      <h3 style={{ marginTop: '2rem' }}>Per-Member Breakdown</h3>
      {data.members.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📭</div>
          <p style={{ margin: 0 }}>No activity this week.</p>
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(124,58,237,0.08)', border: '1px solid #ede9fe' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', boxShadow: 'none', border: 'none' }}>
            <thead>
              <tr style={{ background: 'linear-gradient(135deg, #4c1d95, #7c3aed)', color: '#fff' }}>
                <th style={th}>Member</th>
                <th style={{ ...th, textAlign: 'right' }}>Net Change</th>
              </tr>
            </thead>
            <tbody>
              {data.members.map((m, i) => (
                <tr key={m.id} style={{ borderBottom: '1px solid #ede9fe', background: i % 2 === 0 ? '#fff' : '#faf9ff' }}>
                  <td style={td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={memberAvatar}>{m.name.charAt(0).toUpperCase()}</div>
                      <span style={{ fontWeight: 500 }}>{m.name}</span>
                    </div>
                  </td>
                  <td style={{ ...td, textAlign: 'right' }}>
                    <span style={{
                      background: m.net_change >= 0 ? '#d1fae5' : '#fee2e2',
                      color: m.net_change >= 0 ? '#065f46' : '#991b1b',
                      padding: '0.25rem 0.7rem',
                      borderRadius: '20px',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                    }}>
                      {m.net_change >= 0 ? '+' : ''}{Number(m.net_change).toFixed(1)} pts
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function StatCard({ icon, label, value, color, bg, border }: {
  icon: string; label: string; value: string | number; color: string; bg: string; border: string
}) {
  return (
    <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: '12px', padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
      <div style={{ fontSize: '2rem', lineHeight: 1 }}>{icon}</div>
      <div>
        <div style={{ fontSize: '0.78rem', color: '#6b7280', fontWeight: 500, marginBottom: '0.2rem' }}>{label}</div>
        <div style={{ fontSize: '1.75rem', fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
      </div>
    </div>
  )
}

const statsGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: '1rem',
  marginBottom: '1rem',
}

const memberAvatar: React.CSSProperties = {
  width: '32px',
  height: '32px',
  borderRadius: '50%',
  background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
  color: '#fff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 700,
  fontSize: '0.85rem',
  flexShrink: 0,
}

const th: React.CSSProperties = { padding: '0.65rem 1rem', fontWeight: 600, textAlign: 'left', fontSize: '0.82rem' }
const td: React.CSSProperties = { padding: '0.75rem 1rem', verticalAlign: 'middle' }
