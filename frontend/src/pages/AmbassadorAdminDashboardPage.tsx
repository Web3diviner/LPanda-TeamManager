import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ambassadorAdminApi from '../ambassadorAdminApi'
import { useAmbassadorAdminAuth } from '../context/AmbassadorAdminAuthContext'
import { useIsMobile } from '../hooks/useIsMobile'

interface Task {
  id: string; description: string; status: string; deadline: string | null
  submitted_at: string; submitted_by: string | null; submitted_by_name: string | null
  assigned_to: string | null; assigned_to_name: string | null
}
interface Ambassador { id: string; name: string; points: number }

export default function AmbassadorAdminDashboardPage() {
  const { user } = useAmbassadorAdminAuth()
  const navigate = useNavigate()
  const [ambassadorCount, setAmbassadorCount] = useState<number | null>(null)
  const [pendingTasks, setPendingTasks] = useState<Task[]>([])
  const [recentTasks, setRecentTasks] = useState<Task[]>([])
  const [topAmbassadors, setTopAmbassadors] = useState<Ambassador[]>([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')
  const isMobile = useIsMobile()

  // Delegate form
  const [showDelegateForm, setShowDelegateForm] = useState(false)
  const [delTitle, setDelTitle] = useState('')
  const [delDesc, setDelDesc] = useState('')
  const [delAssignees, setDelAssignees] = useState<string[]>([])
  const [delDeadline, setDelDeadline] = useState('')
  const [delegating, setDelegating] = useState(false)
  const [ambassadors, setAmbassadors] = useState<Ambassador[]>([])

  async function load() {
    try {
      const [ambRes, pendingRes, tasksRes] = await Promise.all([
        ambassadorAdminApi.get('/ambassador-admin/ambassadors'),
        ambassadorAdminApi.get('/ambassador-admin/pending-tasks'),
        ambassadorAdminApi.get('/ambassador-admin/tasks'),
      ])
      const ambassadorData = ambRes.data
      setAmbassadors(ambassadorData)
      setAmbassadorCount(ambassadorData.length)
      setPendingTasks(pendingRes.data.slice(0, 5)) // Show only first 5
      setRecentTasks(tasksRes.data.slice(0, 8)) // Show only first 8
      setTopAmbassadors(ambassadorData.sort((a: Ambassador, b: Ambassador) => b.points - a.points).slice(0, 5))
    } catch {
      // handled by interceptor
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function handleQuickApprove(taskId: string) {
    try {
      await ambassadorAdminApi.post(`/ambassador-admin/tasks/${taskId}/confirm`)
      setMsg('✅ Task approved and points awarded')
      load()
      setTimeout(() => setMsg(''), 3000)
    } catch (err: any) {
      setMsg('❌ ' + (err.response?.data?.error ?? 'Failed to approve task'))
      setTimeout(() => setMsg(''), 3000)
    }
  }

  async function handleDelegate(e: React.FormEvent) {
    e.preventDefault()
    if (!delTitle || delAssignees.length === 0 || !delDeadline) return
    setDelegating(true)
    try {
      await ambassadorAdminApi.post('/ambassador-admin/delegated', { 
        title: delTitle, 
        description: delDesc, 
        assigned_to: delAssignees, 
        deadline: delDeadline 
      })
      setMsg('🎯 Task delegated successfully')
      setDelTitle(''); setDelDesc(''); setDelAssignees([]); setDelDeadline('')
      setShowDelegateForm(false)
      load()
      setTimeout(() => setMsg(''), 3000)
    } catch (err: any) {
      setMsg('❌ ' + (err.response?.data?.error ?? 'Failed to delegate task'))
      setTimeout(() => setMsg(''), 3000)
    } finally {
      setDelegating(false)
    }
  }

  const statusColor = (s: string) => s === 'pending' ? '#d97706' : s === 'assigned' ? '#1e5fa8' : s === 'completed' ? '#059669' : '#6b7280'

  return (
    <div>
      {/* VERY OBVIOUS TEST SECTION */}
      <div style={{ 
        background: 'linear-gradient(135deg, #ff0000, #ff6600)', 
        color: '#fff', 
        padding: '1rem', 
        marginBottom: '1rem', 
        borderRadius: '8px',
        textAlign: 'center',
        fontSize: '1.2rem',
        fontWeight: 'bold'
      }}>
        🚨 UPDATED AMBASSADOR ADMIN DASHBOARD - VERSION 2.0 🚨
      </div>
      
      {/* Debug info */}
      <div style={{ background: '#f0f0f0', padding: '0.5rem', marginBottom: '1rem', fontSize: '0.8rem' }}>
        Debug: User = {user?.name}, Loading = {loading.toString()}, ShowDelegateForm = {showDelegateForm.toString()}
      </div>
      
      {msg && (
        <div style={msgBox}>
          {msg}
          <button onClick={() => setMsg('')} style={closeBtn}>✕</button>
        </div>
      )}

      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ margin: '0 0 0.25rem', fontSize: '1.8rem', fontWeight: 900, color: '#1e3a5f' }}>
              👑 Ambassador Admin Dashboard
            </h1>
            <p style={{ color: '#64748b', margin: 0 }}>Welcome back, {user?.name} — delegate, approve, and monitor</p>
          </div>
          
          {/* VERY OBVIOUS DELEGATE BUTTON */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button 
              onClick={() => setShowDelegateForm(!showDelegateForm)} 
              style={{
                background: 'linear-gradient(135deg, #ff6b35, #f7931e)', 
                color: '#fff', 
                border: '3px solid #ff4500', 
                borderRadius: '12px', 
                padding: '1rem 2rem', 
                fontWeight: 900, 
                cursor: 'pointer',
                fontSize: '1.1rem', 
                boxShadow: '0 8px 24px rgba(255,107,53,0.4)',
                zIndex: 9999, 
                position: 'relative',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}
            >
              🎯 {showDelegateForm ? 'CANCEL DELEGATE' : 'DELEGATE TASK NOW'}
            </button>
            <div style={{ fontSize: '0.8rem', color: '#666', textAlign: 'center' }}>
              Click here to delegate tasks to ambassadors
            </div>
          </div>
        </div>
      </div>

      {/* Quick Delegate Form */}
      {showDelegateForm && (
        <div style={delegateCard}>
          <h3 style={{ margin: '0 0 1rem', color: '#1e3a5f', fontSize: '1.1rem', fontWeight: 700 }}>🎯 Quick Delegate Task</h3>
          <form onSubmit={handleDelegate} style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>Title *</label>
              <input value={delTitle} onChange={e => setDelTitle(e.target.value)} style={inputStyle} placeholder="Task title" required />
            </div>
            <div>
              <label style={labelStyle}>Deadline *</label>
              <input type="date" value={delDeadline} onChange={e => setDelDeadline(e.target.value)} style={inputStyle} required />
            </div>
            <div style={{ gridColumn: isMobile ? '1' : '1 / -1' }}>
              <label style={labelStyle}>Description</label>
              <textarea value={delDesc} onChange={e => setDelDesc(e.target.value)} style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }} placeholder="Optional description" />
            </div>
            <div style={{ gridColumn: isMobile ? '1' : '1 / -1' }}>
              <label style={labelStyle}>Assign To (select multiple) *</label>
              <select multiple value={delAssignees} onChange={e => setDelAssignees(Array.from(e.target.selectedOptions, o => o.value))} style={{ ...inputStyle, minHeight: '80px' }}>
                {ambassadors.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
              <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0.25rem 0 0' }}>Hold Ctrl/Cmd to select multiple</p>
            </div>
            <div style={{ gridColumn: isMobile ? '1' : '1 / -1', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setShowDelegateForm(false)} style={cancelBtn}>Cancel</button>
              <button type="submit" disabled={delegating} style={submitBtn}>
                {delegating ? 'Delegating…' : 'Delegate Task'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr', gap: '2rem', alignItems: 'start' }}>
        {/* Main Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Pending Tasks for Quick Approval */}
          <div style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#1e3a5f' }}>⏳ Pending Tasks (Quick Approve)</h2>
              <button onClick={() => navigate('/ambassador-admin/tasks')} style={viewAllBtn}>View All</button>
            </div>
            {loading ? (
              <p style={{ color: '#64748b' }}>Loading...</p>
            ) : pendingTasks.length === 0 ? (
              <p style={{ color: '#9ca3af', textAlign: 'center', padding: '2rem' }}>No pending tasks</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {pendingTasks.map(task => (
                  <div key={task.id} style={taskRow}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, color: '#1e3a5f', marginBottom: '0.25rem' }}>{task.description}</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                        By {task.submitted_by_name} • {new Date(task.submitted_at).toLocaleDateString()}
                      </div>
                    </div>
                    <button onClick={() => handleQuickApprove(task.id)} style={approveBtn}>
                      ✅ Approve
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#1e3a5f' }}>📋 Recent Activity</h2>
              <button onClick={() => navigate('/ambassador-admin/tasks')} style={viewAllBtn}>View All</button>
            </div>
            {loading ? (
              <p style={{ color: '#64748b' }}>Loading...</p>
            ) : recentTasks.length === 0 ? (
              <p style={{ color: '#9ca3af', textAlign: 'center', padding: '2rem' }}>No recent tasks</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
                {recentTasks.map(task => (
                  <div key={task.id} style={activityCard}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <div style={{ fontWeight: 600, color: '#1e3a5f', fontSize: '0.9rem' }}>{task.description}</div>
                      <span style={{ ...statusBadge, background: statusColor(task.status) + '22', color: statusColor(task.status) }}>
                        {task.status}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      {task.assigned_to_name ? `Assigned to ${task.assigned_to_name}` : `By ${task.submitted_by_name}`}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Summary Stats */}
          <div style={card}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 700, color: '#1e3a5f' }}>📊 Overview</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={statRow}>
                <span style={{ color: '#64748b' }}>Total Ambassadors</span>
                <span style={{ fontWeight: 700, color: '#1e5fa8' }}>{loading ? '…' : ambassadorCount ?? '—'}</span>
              </div>
              <div style={statRow}>
                <span style={{ color: '#64748b' }}>Pending Tasks</span>
                <span style={{ fontWeight: 700, color: '#d97706' }}>{loading ? '…' : pendingTasks.length}</span>
              </div>
              <div style={statRow}>
                <span style={{ color: '#64748b' }}>Recent Activity</span>
                <span style={{ fontWeight: 700, color: '#059669' }}>{loading ? '…' : recentTasks.length}</span>
              </div>
            </div>
          </div>

          {/* Top Ambassadors */}
          <div style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#1e3a5f' }}>🏆 Top Ambassadors</h3>
              <button onClick={() => navigate('/ambassador-admin/leaderboard')} style={viewAllBtn}>View All</button>
            </div>
            {loading ? (
              <p style={{ color: '#64748b' }}>Loading...</p>
            ) : topAmbassadors.length === 0 ? (
              <p style={{ color: '#9ca3af', textAlign: 'center' }}>No ambassadors yet</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {topAmbassadors.map((amb, idx) => (
                  <div key={amb.id} style={ambassadorRow}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '1.2rem' }}>{idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '🏅'}</span>
                      <span style={{ fontWeight: 600, color: '#1e3a5f' }}>{amb.name}</span>
                    </div>
                    <span style={{ fontWeight: 700, color: '#059669' }}>{amb.points} pts</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div style={card}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 700, color: '#1e3a5f' }}>⚡ Quick Actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button onClick={() => navigate('/ambassador-admin/ambassadors')} style={quickActionBtn}>
                🤝 Manage Ambassadors
              </button>
              <button onClick={() => navigate('/ambassador-admin/tasks')} style={quickActionBtn}>
                📋 All Tasks
              </button>
              <button onClick={() => navigate('/ambassador-admin/schedule')} style={quickActionBtn}>
                📅 Schedule
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const msgBox: React.CSSProperties = {
  background: '#f0fdf4', border: '1px solid #86efac', color: '#166534',
  borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1.5rem',
  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
}
const closeBtn: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', color: '#166534'
}
const delegateBtn: React.CSSProperties = {
  background: 'linear-gradient(135deg, #1e5fa8, #2563eb)', color: '#fff', border: 'none',
  borderRadius: '8px', padding: '0.75rem 1.5rem', fontWeight: 700, cursor: 'pointer',
  fontSize: '0.9rem', boxShadow: '0 4px 12px rgba(30,95,168,0.3)', transition: 'all 0.2s'
}
const delegateCard: React.CSSProperties = {
  background: '#fff', borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem',
  boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '2px solid #1e5fa8'
}
const card: React.CSSProperties = {
  background: '#fff', borderRadius: '12px', padding: '1.5rem',
  boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '1px solid #e5e7eb'
}
const taskRow: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem',
  background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0'
}
const approveBtn: React.CSSProperties = {
  background: '#059669', color: '#fff', border: 'none', borderRadius: '6px',
  padding: '0.5rem 1rem', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer'
}
const activityCard: React.CSSProperties = {
  padding: '0.75rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0'
}
const statusBadge: React.CSSProperties = {
  padding: '0.2rem 0.6rem', borderRadius: '12px', fontWeight: 700, fontSize: '0.7rem'
}
const statRow: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
}
const ambassadorRow: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  padding: '0.5rem', background: '#f8fafc', borderRadius: '6px'
}
const quickActionBtn: React.CSSProperties = {
  background: '#f1f5f9', border: '1px solid #d1d5db', color: '#374151',
  borderRadius: '6px', padding: '0.6rem 1rem', fontWeight: 600, cursor: 'pointer',
  textAlign: 'left', fontSize: '0.85rem', transition: 'all 0.15s'
}
const viewAllBtn: React.CSSProperties = {
  background: 'none', border: '1px solid #d1d5db', color: '#374151',
  borderRadius: '6px', padding: '0.4rem 0.8rem', fontSize: '0.8rem', cursor: 'pointer'
}
const labelStyle: React.CSSProperties = {
  display: 'block', marginBottom: '0.35rem', fontWeight: 600, fontSize: '0.85rem', color: '#374151'
}
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.65rem 0.9rem', borderRadius: '8px', border: '1.5px solid #d1d5db',
  fontSize: '0.9rem', boxSizing: 'border-box'
}
const cancelBtn: React.CSSProperties = {
  background: '#f1f5f9', border: '1px solid #d1d5db', color: '#374151',
  borderRadius: '8px', padding: '0.6rem 1.25rem', fontWeight: 600, cursor: 'pointer'
}
const submitBtn: React.CSSProperties = {
  background: '#1e5fa8', color: '#fff', border: 'none', borderRadius: '8px',
  padding: '0.6rem 1.25rem', fontWeight: 700, cursor: 'pointer'
}
