import { useEffect, useState } from 'react'
import ambassadorAdminApi from '../ambassadorAdminApi'

interface Entry { id: string; name: string; points: number; avatar_url: string | null }

export default function AmbassadorAdminLeaderboardPage() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ambassadorAdminApi.get('/ambassador-admin/leaderboard')
      .then(res => setEntries(res.data))
      .finally(() => setLoading(false))
  }, [])

  const medals = ['🥇', '🥈', '🥉']

  return (
    <div>
      <h1 style={h1}>🏆 Ambassador Leaderboard</h1>
      {loading ? <p>Loading…</p> : (
        <div style={tableWrap}>
          <table style={tableStyle}>
            <thead>
              <tr style={theadRow}>
                <th style={th}>Rank</th>
                <th style={th}>Ambassador</th>
                <th style={th}>Points</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e, i) => (
                <tr key={e.id} style={{ ...tbodyRow, background: i < 3 ? '#fffbeb' : '#fff' }}>
                  <td style={{ ...td, fontWeight: 700, fontSize: '1.1rem' }}>
                    {medals[i] ?? `#${i + 1}`}
                  </td>
                  <td style={td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={avatarCircle}>
                        {e.avatar_url
                          ? <img src={e.avatar_url} alt={e.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                          : <span>🤝</span>}
                      </div>
                      <strong>{e.name}</strong>
                    </div>
                  </td>
                  <td style={td}>
                    <span style={pointsBadge}>⭐ {e.points.toFixed(1)}</span>
                  </td>
                </tr>
              ))}
              {entries.length === 0 && (
                <tr><td colSpan={3} style={{ ...td, textAlign: 'center', color: '#9ca3af' }}>No ambassadors found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

const h1: React.CSSProperties = { margin: '0 0 1.5rem', fontSize: '1.6rem', fontWeight: 900, color: '#1e3a5f' }
const tableWrap: React.CSSProperties = { background: '#fff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', overflow: 'hidden' }
const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse' }
const theadRow: React.CSSProperties = { background: '#f1f5f9' }
const tbodyRow: React.CSSProperties = { borderBottom: '1px solid #f1f5f9' }
const th: React.CSSProperties = { padding: '0.85rem 1rem', textAlign: 'left', fontWeight: 700, fontSize: '0.85rem', color: '#374151' }
const td: React.CSSProperties = { padding: '0.85rem 1rem', fontSize: '0.9rem', color: '#374151' }
const avatarCircle: React.CSSProperties = { width: '36px', height: '36px', borderRadius: '50%', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '1rem' }
const pointsBadge: React.CSSProperties = { background: '#dbeafe', color: '#1e40af', padding: '0.25rem 0.75rem', borderRadius: '12px', fontWeight: 700, fontSize: '0.9rem' }
