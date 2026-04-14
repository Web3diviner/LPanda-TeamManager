import { useEffect, useState } from 'react'
import api from '../api'

interface MemberRecap { userId: string; name: string; netChange: number }
interface RecapData {
  totalCompleted: number; totalAwarded: number; totalDeducted: number; perMember: MemberRecap[]
}

export default function AmbassadorRecapPage() {
  const [data, setData] = useState<RecapData | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/recap/ambassador-weekly')
      .then(res => setData(res.data))
      .catch(() => setError('Failed to load ambassador weekly recap.'))
  }, [])

  if (error) return <p style={{ color: '#dc2626' }}>{error}</p>
  if (!data) return <p style={{ color: '#6b7280' }}>Loading…</p>

  const net = Number(data.totalAwarded) - Number(data.totalDeducted)

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <h2>🤝 Ambassador Weekly Recap</h2>

      <div style={statsGrid}>
        <StatCard icon="✅" label="Tasks Completed" value={data.totalCompleted} color="#059669" bg="linear-gradient(135deg,#d1fae5,#a7f3d0)" border="#6ee7b7" />
        <StatCard icon="⭐" label="Points Awarded" value={`+${Number(data.totalAwarded).toFixed(1)}`} color="#5b21b6" bg="linear-gradient(135deg,#ede9fe,#ddd6fe)" border="#c4b5fd" />
        <StatCard icon="📉" label="Points Deducted" value={`-${Number(data.totalDeducted).toFixed(1)}`} color="#dc2626" bg="linear-gradient(135deg,#fee2e2,#fecaca)" border="#fca5a5" />
        <StatCard icon="📈" label="Net Change" value={(net >= 0 ? '+' : '') + net.toFixed(1)} color={net >= 0 ? '#0284c7' : '#dc2626'} bg="linear-gradient(135deg,#e0f2fe,#bae6fd)" border="#7dd3fc" />
      </div>

      <div style={sectionCard}>
        <h3 style={{ margin: '0 0 1rem', color: '#4c1d95' }}>Per-Ambassador Breakdown</h3>
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
                  <th style={th}>Ambassador</th>
                  <th style={{ ...th, textAlign: 'right' }}>Net Change</th>
                </tr>
              </thead>
              <tbody>
                {data.perMember.map((member, i) => (
                  <tr key={member.userId} style={{ borderBottom: '1px solid #ede9fe', background: i % 2 === 0 ? '#fff' : '#faf9ff' }}>
                    <td style={td}>{member.name}</td>
                    <td style={{ ...td, textAlign: 'right', fontWeight: 600, color: Number(member.netChange) >= 0 ? '#059669' : '#dc2626' }}>
                      {(Number(member.netChange) >= 0 ? '+' : '') + Number(member.netChange).toFixed(1)}
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

const statsGrid: React.CSSProperties = {
  display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem',
}
const sectionCard: React.CSSProperties = {
  background: '#fff', borderRadius: '12px', padding: '1.5rem', border: '1px solid #ede9fe',
  boxShadow: '0 2px 8px rgba(124,58,237,0.08)',
}
const th: React.CSSProperties = {
  padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600,
}
const td: React.CSSProperties = {
  padding: '0.5rem 1rem',
}

function StatCard({ icon, label, value, color, bg, border }: { icon: string; label: string; value: string | number; color: string; bg: string; border: string }) {
  return (
    <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: '12px', padding: '1.5rem', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
      <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{icon}</div>
      <div style={{ fontSize: '1.5rem', fontWeight: 800, color, marginBottom: '0.25rem' }}>{value}</div>
      <div style={{ fontSize: '0.9rem', color: '#6b7280', fontWeight: 500 }}>{label}</div>
    </div>
  )
}