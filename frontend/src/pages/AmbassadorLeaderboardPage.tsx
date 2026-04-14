import { useEffect, useState } from 'react'
import api from '../api'
import { useAuth } from '../context/AuthContext'

interface LeaderboardEntry {
  id: string
  name: string
  points: number
}

const medals = ['🥇', '🥈', '🥉']

export default function AmbassadorLeaderboardPage() {
  const { user } = useAuth()
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/points/ambassador-leaderboard')
      .then(res => setEntries(res.data))
      .catch(() => setError('Failed to load ambassador leaderboard.'))
  }, [])

  if (error) return <p style={{ color: '#dc2626' }}>{error}</p>

  return (
    <div>
      <h2>🤝 Ambassador Leaderboard</h2>

      {entries.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🏆</div>
          <p>No data yet. Complete tasks to earn points!</p>
        </div>
      ) : (
        <>
          {/* Top 3 podium */}
          {entries.length >= 3 && (
            <div style={podiumWrap}>
              {[entries[1], entries[0], entries[2]].map((entry, podiumIdx) => {
                const rank = podiumIdx === 0 ? 1 : podiumIdx === 1 ? 0 : 2
                const heights = ['80px', '110px', '60px']
                const isMe = entry?.id === user?.id
                return entry ? (
                  <div key={entry.id} style={{ ...podiumItem, borderColor: isMe ? '#7c3aed' : 'transparent' }}>
                    <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{medals[rank]}</div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e1b4b' }}>{entry.name}</div>
                    <div style={{ color: '#7c3aed', fontWeight: 800, fontSize: '1.1rem' }}>{Number(entry.points).toFixed(1)}</div>
                    <div style={{ ...podiumBar, height: heights[podiumIdx], background: rank === 0 ? 'linear-gradient(180deg,#f59e0b,#d97706)' : rank === 1 ? 'linear-gradient(180deg,#9ca3af,#6b7280)' : 'linear-gradient(180deg,#f97316,#ea580c)' }} />
                  </div>
                ) : null
              })}
            </div>
          )}

          <div style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(124,58,237,0.08)', border: '1px solid #ede9fe' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', boxShadow: 'none', border: 'none' }}>
              <thead>
                <tr style={{ background: 'linear-gradient(135deg, #4c1d95, #7c3aed)', color: '#fff' }}>
                  <th style={th}>Rank</th>
                  <th style={th}>Ambassador</th>
                  <th style={{ ...th, textAlign: 'right' }}>Points</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, i) => {
                  const isMe = entry.id === user?.id
                  return (
                    <tr key={entry.id} style={{
                      borderBottom: '1px solid #ede9fe',
                      background: isMe ? '#f5f3ff' : i % 2 === 0 ? '#fff' : '#faf9ff',
                    }}>
                      <td style={td}>
                        <span style={{ fontWeight: 700, fontSize: '1rem' }}>
                          {medals[i] || `#${i + 1}`}
                        </span>
                      </td>
                      <td style={td}>
                        <span style={{ fontWeight: isMe ? 700 : 400 }}>{entry.name}</span>
                        {isMe && <span style={youBadge}>you</span>}
                      </td>
                      <td style={{ ...td, textAlign: 'right', fontWeight: 700, color: '#7c3aed', fontSize: '1rem' }}>
                        {Number(entry.points).toFixed(1)} pts
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

const podiumWrap: React.CSSProperties = {
  display: 'flex', justifyContent: 'center', alignItems: 'flex-end',
  gap: '1rem', marginBottom: '2rem', padding: '2rem 1.5rem 0',
  background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
  borderRadius: '12px', border: '1px solid #ddd6fe',
}
const podiumItem: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', alignItems: 'center',
  padding: '1rem', background: '#fff', borderRadius: '12px',
  border: '2px solid transparent', boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  minWidth: '120px', position: 'relative',
}
const podiumBar: React.CSSProperties = {
  width: '60px', borderRadius: '4px 4px 0 0', marginTop: '0.5rem',
}
const th: React.CSSProperties = {
  padding: '1rem', textAlign: 'left', fontWeight: 600,
}
const td: React.CSSProperties = {
  padding: '0.75rem 1rem',
}
const youBadge: React.CSSProperties = {
  background: '#7c3aed', color: '#fff', fontSize: '0.7rem',
  padding: '0.15rem 0.4rem', borderRadius: '10px', marginLeft: '0.5rem',
  fontWeight: 600, textTransform: 'uppercase',
}