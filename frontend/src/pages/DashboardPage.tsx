import { useEffect, useRef, useState } from 'react'
import TaskForm from '../components/TaskForm'
import TaskList, { type Task } from '../components/TaskList'
import TaskAssignModal from '../components/TaskAssignModal'
import DelegateTaskModal from '../components/DelegateTaskModal'
import DelegatedTasksPanel from '../components/DelegatedTasksPanel'
import AnnouncementBoard from '../components/AnnouncementBoard'
import TimerWidget from '../components/TimerWidget'
import FeedbackPanel from '../components/FeedbackPanel'
import { useAuth } from '../context/AuthContext'
import { useIsMobile } from '../hooks/useIsMobile'
import api from '../api'

interface AssignmentCount {
  id: string; name: string
  assigned: number; completed: number; missed: number; pending: number
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [assignTaskId, setAssignTaskId] = useState<string | null>(null)
  const [showDelegate, setShowDelegate] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [toast, setToast] = useState('')
  const [counts, setCounts] = useState<AssignmentCount[]>([])
  const prevAssignedTaskIds = useRef<Set<string>>(new Set())

  function refresh() {
    setRefreshTrigger(t => t + 1)
    if (user?.role === 'admin') fetchCounts()
  }

  async function fetchCounts() {
    try {
      const res = await api.get('/tasks/assignment-counts')
      setCounts(res.data)
    } catch { /* ignore */ }
  }

  useEffect(() => {
    if (user?.role === 'admin') { fetchCounts(); return }
    async function checkAssignments() {
      try {
        const res = await api.get('/tasks')
        const tasks: Task[] = res.data
        const myAssigned = tasks.filter(t => t.status === 'assigned' && t.assigned_to === user!.id).map(t => t.id)
        const newOnes = myAssigned.filter(id => !prevAssignedTaskIds.current.has(id))
        if (newOnes.length > 0 && prevAssignedTaskIds.current.size > 0) {
          setToast('🎯 You have a new task assigned!')
          setTimeout(() => setToast(''), 5000)
        }
        prevAssignedTaskIds.current = new Set(myAssigned)
      } catch { /* ignore */ }
    }
    checkAssignments()
    const t = setInterval(checkAssignments, 30_000)
    return () => clearInterval(t)
  }, [user])

  const isAdmin = user?.role === 'admin'
  const isMobile = useIsMobile()

  return (
    <div>
      {toast && <div style={toastStyle}>{toast}</div>}

      <div style={pageHeader}>
        <div>
          <h2 style={{ marginBottom: '0.25rem' }}>Dashboard</h2>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem' }}>
            Welcome back, <strong>{user?.name}</strong> {isAdmin ? '👑' : '👋'}
          </p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowDelegate(true)} style={delegateBtn}>
            🎯 Delegate Task
          </button>
        )}
      </div>

      <div style={{ ...grid, gridTemplateColumns: isMobile ? '1fr' : '1fr 320px' }} className="dash-grid">
        {/* Main column */}
        <div style={mainCol}>
          {!isAdmin && (
            <div style={card}>
              <h3 style={cardTitle}>📝 Submit a Task</h3>
              <TaskForm onCreated={refresh} />
            </div>
          )}

          <div style={card}>
            <h3 style={cardTitle}>📋 {isAdmin ? 'All Submitted Tasks' : 'My Tasks'}</h3>
            <TaskList
              refreshTrigger={refreshTrigger}
              onAssign={isAdmin ? (id) => setAssignTaskId(id) : undefined}
            />
          </div>

          <div style={card}>
            <h3 style={cardTitle}>🎯 Delegated Tasks</h3>
            <DelegatedTasksPanel refreshTrigger={refreshTrigger} />
          </div>

          <div style={card}>
            <h3 style={cardTitle}>� {isAdmin ? 'User Feedback' : 'Feedback'}</h3>
            <FeedbackPanel />
          </div>
        </div>

        {/* Side column */}
        <div style={sideCol}>
          <div style={card}>
            <TimerWidget />
          </div>

          {isAdmin && (
            <div style={card}>
              <h3 style={cardTitle}>📊 Assignments per Member</h3>
              {counts.length === 0
                ? <p style={{ color: '#9ca3af', fontSize: '0.875rem', margin: 0 }}>No members yet.</p>
                : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {counts.map(c => (
                      <div key={c.id} style={memberRow}>
                        <div style={avatar}>{c.name.charAt(0).toUpperCase()}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#1e1b4b', marginBottom: '0.3rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                          <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                            <Badge v={c.assigned}  label="Assigned" bg="#dbeafe" c="#1e40af" />
                            <Badge v={c.completed} label="Done"     bg="#d1fae5" c="#065f46" />
                            <Badge v={c.missed}    label="Missed"   bg="#fee2e2" c="#991b1b" />
                            <Badge v={c.pending}   label="Pending"  bg="#fef3c7" c="#92400e" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
            </div>
          )}

          <div style={card}>
            <AnnouncementBoard />
          </div>
        </div>
      </div>

      {assignTaskId && (
        <TaskAssignModal taskId={assignTaskId} onClose={() => setAssignTaskId(null)} onAssigned={refresh} />
      )}
      {showDelegate && (
        <DelegateTaskModal onClose={() => setShowDelegate(false)} onDelegated={refresh} />
      )}
    </div>
  )
}

function Badge({ v, label, bg, c }: { v: number; label: string; bg: string; c: string }) {
  return <span style={{ background: bg, color: c, padding: '0.15rem 0.45rem', borderRadius: '10px', fontSize: '0.72rem', fontWeight: 700, whiteSpace: 'nowrap' }}>{v} {label}</span>
}

const toastStyle: React.CSSProperties = { position: 'fixed', top: '1rem', right: '1rem', background: 'linear-gradient(135deg,#7c3aed,#a855f7)', color: '#fff', padding: '0.85rem 1.25rem', borderRadius: '10px', boxShadow: '0 8px 24px rgba(124,58,237,0.4)', zIndex: 2000, fontWeight: 600, fontSize: '0.9rem' }
const pageHeader: React.CSSProperties = { marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }
const delegateBtn: React.CSSProperties = { padding: '0.6rem 1.2rem', background: 'linear-gradient(135deg,#7c3aed,#a855f7)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', boxShadow: '0 2px 8px rgba(124,58,237,0.3)' }
const grid: React.CSSProperties = { display: 'grid', gap: '1.5rem', alignItems: 'start', gridTemplateColumns: '1fr 320px' }
const mainCol: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '1.5rem' }
const sideCol: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '1.5rem' }
const card: React.CSSProperties = { background: '#fff', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(124,58,237,0.08)', border: '1px solid #ede9fe' }
const cardTitle: React.CSSProperties = { fontSize: '1rem', fontWeight: 700, color: '#4c1d95', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '2px solid #ede9fe' }
const memberRow: React.CSSProperties = { display: 'flex', alignItems: 'flex-start', gap: '0.65rem', padding: '0.65rem', background: '#faf9ff', borderRadius: '8px', border: '1px solid #ede9fe' }
const avatar: React.CSSProperties = { width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg,#7c3aed,#a855f7)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem' }
