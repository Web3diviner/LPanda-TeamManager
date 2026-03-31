import { useEffect, useState } from 'react'
import api from '../api'

interface MemberRecap { userId: string; name: string; netChange: number }
interface RecapData {
  totalCompleted: number; totalAwarded: number; totalDeducted: number; perMember: MemberRecap[]
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

  const net = Number(data.totalAwarded) - Number(data.totalDeducted)

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <h2>Weekly Recap</h2>

      <div style={statsGrid}>
        <StatCard icon="✅" label="Tasks Completed" value={data.totalCompleted} color="#059669" bg="linear-gradient(135deg,#d1fae5,#a7f3d0)" border="#6ee7b7" />
        <StatCard icon="⭐" label="Points Awarded" value={`+${Number(data.totalAwarded).toFixed(1)}`} color="#5b21b6" bg="linear-gradient(135deg,#ede9fe,#ddd6fe)" border="#c4b5fd" />
        <StatCard icon="📉" label="Points Deducted" value={`-${Number(data.totalDeducted).toFixed(1)}`} color="#dc2626" bg="linear-gradient(135deg,#fee2e2,#fecaca)" border="#fca5a5" />
        <StatCard icon="📈" label="Net Change" value={(net >= 0 ? '+' : '') + net.toFixed(1)} color={net >= 0 ? '#0284c7' : '#dc2626'} bg="linear-gradient(135deg,#e0f2fe,#bae6fd)" border="#7dd3fc" />
      </div>

      <div style={sectionCard}>
        <h3 style={{ margin: '0 0 1rem', color: '#4c1d95' }}>Per-Member Breakdown</h3>
        {data.perMember.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📭</div>
            <p style={{ margin: 0 }}>No activity this week.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ background: 'linear-gradient(135deg,#4c1d95,#7c3aed)', color: '#fff' }}>
                  <th style={th}>Member</th>
                  <th style={{ ...th, textAlign: 'right' }}>Net Change</th>
                </tr>
              </thead>
              <tbody>
                {data.perMember.map((m, i) => (
                  <tr key={m.userId} style={{ borderBottom: '1px solid #f0ebff', background: i % 2 === 0 ? '#fff' : '#faf9ff' }}>
                    <td style={td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <div style={memberAvatar}>{m.name.charAt(0).toUpperCase()}</div>
                        <span style={{ fontWeight: 500 }}>{m.name}</span>
                      </div>
                    </td>
                    <td style={{ ...td, textAlign: 'right' }}>
                      <span style={{
                        background: m.netChange >= 0 ? '#d1fae5' : '#fee2e2',
                        color: m.netChange >= 0 ? '#065f46' : '#991b1b',
                        padding: '0.25rem 0.75rem', borderRadius: '20px',
                        fontWeight: 700, fontSize: '0.85rem',
                      }}>
                        {m.netChange >= 0 ? '+' : ''}{Number(m.netChange).toFixed(1)} pts
                      </span>
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

function StatCard({ icon, label, value, color, bg, border }: {
  icon: string; label: string; value: string | number; color: string; bg: string; border: string
}) {
  return (
    <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: '16px', padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
      <div style={{ fontSize: '2.2rem', lineHeight: 1, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}>{icon}</div>
      <div>
        <div style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>{label}</div>
        <div style={{ fontSize: '2rem', fontWeight: 900, color, lineHeight: 1, letterSpacing: '-0.5px' }}>{value}</div>
      </div>
    </div>
  )
}

const statsGrid: React.CSSProperties = {
  display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
  gap: '1rem', marginBottom: '1.5rem',
}
const sectionCard: React.CSSProperties = {
  background: '#fff', borderRadius: '16px', padding: '1.5rem',
  boxShadow: '0 2px 12px rgba(124,58,237,0.07)', border: '1px solid #ede9fe',
}
const memberAvatar: React.CSSProperties = {
  width: '34px', height: '34px', borderRadius: '50%',
  background: 'linear-gradient(135deg,#7c3aed,#a855f7)', color: '#fff',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontWeight: 700, fontSize: '0.85rem', flexShrink: 0,
  boxShadow: '0 2px 6px rgba(124,58,237,0.25)',
}
const th: React.CSSProperties = { padding: '0.7rem 1rem', fontWeight: 600, textAlign: 'left', fontSize: '0.78rem', letterSpacing: '0.05em', textTransform: 'uppercase' }
const td: React.CSSProperties = { padding: '0.85rem 1rem', verticalAlign: 'middle' }
