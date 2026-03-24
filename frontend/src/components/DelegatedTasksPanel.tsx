import { useEffect, useState } from 'react'
import api from '../api'
import { useAuth } from '../context/AuthContext'

interface DelegatedTask {
  id: string
  title: string
  description: string
  status: 'assigned' | 'completed' | 'missed'
  deadline: string | null
  assigned_to: string
  assigned_to_name: string
  created_by_name: string
  admin_remark: string | null
  created_at: string
}

const statusConfig: Record<string, { bg: string; color: string; icon: string }> = {
  assigned:  { bg: '#dbeafe', color: '#1e40af', icon: '📌' },
  completed: { bg: '#d1fae5', color: '#065f46', icon: '✅' },
  missed:    { bg: '#fee2e2', color: '#991b1b', icon: '❌' },
}

interface Props { refreshTrigger?: number }

export default function DelegatedTasksPanel({ refreshTrigger }: Props) {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<DelegatedTask[]>([])
  const [loading, setLoading] = useState(true)

  async function fetchTasks() {
    try {
      const res = await api.get('/delegated')
      setTasks(res.data)
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchTasks() }, [refreshTrigger])

  async function handleComplete(id: string) {
    try {
      await api.patch(`/delegated/${id}/complete`)
      fetchTasks()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed.'
      alert(msg)
    }
  }

  if (loading) return <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Loading…</p>
  if (tasks.length === 0) return (
    <div style={{ textAlign: 'center', padding: '1.5rem', color: '#9ca3af' }}>
      <div style={{ fontSize: '2rem', marginBottom: '0.35rem' }}>📭</div>
      <p style={{ margin: 0, fontSize: '0.875rem' }}>No delegated tasks yet.</p>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
      {tasks.map(task => {
        const cfg = statusConfig[task.status]
        const isAssignee = task.assigned_to === user?.id
        return (
          <div key={task.id} style={taskCard}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e1b4b' }}>{task.title}</div>
              <span style={{ background: cfg.bg, color: cfg.color, padding: '0.2rem 0.55rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0 }}>
                {cfg.icon} {task.status}
              </span>
            </div>
            <p style={{ margin: '0 0 0.5rem', fontSize: '0.82rem', color: '#4b5563' }}>{task.description}</p>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.78rem', color: '#6b7280', marginBottom: '0.4rem' }}>
              <span>👤 <strong>{task.assigned_to_name}</strong></span>
              <span>👑 by {task.created_by_name}</span>
              {task.deadline && <span>⏰ {new Date(task.deadline).toLocaleString()}</span>}
            </div>
            {task.admin_remark && (
              <div style={remarkBadge}>
                💬 {task.admin_remark}
              </div>
            )}
            {task.status === 'assigned' && isAssignee && (
              <button onClick={() => handleComplete(task.id)} style={completeBtn}>
                ✅ Mark Complete
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}

const taskCard: React.CSSProperties = {
  background: '#fff', borderRadius: '10px', padding: '0.9rem 1rem',
  border: '1px solid #ede9fe', boxShadow: '0 1px 4px rgba(124,58,237,0.06)',
}
const remarkBadge: React.CSSProperties = {
  display: 'inline-block', background: '#fef3c7', color: '#92400e',
  padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.78rem',
  fontWeight: 600, marginBottom: '0.4rem',
}
const completeBtn: React.CSSProperties = {
  marginTop: '0.35rem', padding: '0.35rem 0.85rem',
  background: '#d1fae5', color: '#065f46', border: '1px solid #6ee7b7',
  borderRadius: '6px', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer',
}
