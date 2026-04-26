import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api'

export interface Task {
  id: string
  description: string
  status: 'pending' | 'assigned' | 'completed' | 'missed'
  deadline?: string
  submitted_at: string
  completed_at?: string
  screenshot_url?: string
  task_link?: string
  submitted_by: string
  submitted_by_name?: string
  assigned_to?: string
  assigned_to_name?: string
}

interface Props {
  refreshTrigger: number
  onAssign?: (taskId: string) => void
}

export default function TaskList({ refreshTrigger, onAssign }: Props) {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTasks()
  }, [refreshTrigger])

  async function fetchTasks() {
    try {
      const res = await api.get('/tasks')
      setTasks(res.data)
    } catch (err: any) {
      console.error('Failed to fetch tasks:', err)
      // Show empty array instead of error for better UX
      setTasks([])
    } finally {
      setLoading(false)
    }
  }

  const statusConfig = {
    pending: { label: 'Pending', bg: '#fef3c7', color: '#92400e' },
    assigned: { label: 'Assigned', bg: '#dbeafe', color: '#1e40af' },
    completed: { label: 'Completed', bg: '#d1fae5', color: '#065f46' },
    missed: { label: 'Missed', bg: '#fee2e2', color: '#991b1b' },
  }

  if (loading) {
    return <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Loading tasks...</p>
  }

  if (tasks.length === 0) {
    return (
      <p style={{ color: '#9ca3af', fontSize: '0.875rem', textAlign: 'center', padding: '2rem 0' }}>
        {user?.role === 'admin' ? 'No tasks submitted yet.' : 'You haven\'t submitted any tasks yet.'}
      </p>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {tasks.map(task => {
        const cfg = statusConfig[task.status]
        return (
          <div key={task.id} style={taskCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#1f2937', marginBottom: '0.3rem' }}>
                  {task.description}
                </div>
                {task.submitted_by_name && user?.role === 'admin' && (
                  <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                    Submitted by: <strong>{task.submitted_by_name}</strong>
                  </div>
                )}
                {task.task_link && (
                  <a href={task.task_link} target="_blank" rel="noopener noreferrer" style={linkStyle}>
                    🔗 View Task
                  </a>
                )}
              </div>
              <span style={{ ...badge, background: cfg.bg, color: cfg.color }}>
                {cfg.label}
              </span>
            </div>

            {task.screenshot_url && (
              <div style={{ marginTop: '0.5rem' }}>
                <img src={task.screenshot_url} alt="Task screenshot" style={screenshot} />
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem', fontSize: '0.75rem', color: '#6b7280' }}>
              <span>📅 {new Date(task.submitted_at).toLocaleDateString()}</span>
              {task.deadline && <span>⏰ Due: {new Date(task.deadline).toLocaleDateString()}</span>}
              {task.completed_at && <span>✅ {new Date(task.completed_at).toLocaleDateString()}</span>}
            </div>

            {onAssign && task.status === 'pending' && (
              <button onClick={() => onAssign(task.id)} style={assignBtn}>
                Assign Task
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}

const taskCard: React.CSSProperties = {
  background: '#fafafa',
  border: '1px solid #e5e7eb',
  borderRadius: '10px',
  padding: '1rem',
  transition: 'all 0.2s ease',
}

const badge: React.CSSProperties = {
  padding: '0.25rem 0.65rem',
  borderRadius: '12px',
  fontSize: '0.75rem',
  fontWeight: 700,
  whiteSpace: 'nowrap',
}

const linkStyle: React.CSSProperties = {
  display: 'inline-block',
  marginTop: '0.3rem',
  fontSize: '0.8rem',
  color: '#7c3aed',
  textDecoration: 'none',
  fontWeight: 600,
}

const screenshot: React.CSSProperties = {
  maxWidth: '100%',
  maxHeight: '200px',
  borderRadius: '8px',
  border: '1px solid #e5e7eb',
  objectFit: 'cover',
}

const assignBtn: React.CSSProperties = {
  marginTop: '0.75rem',
  padding: '0.5rem 1rem',
  background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
  color: '#fff',
  border: 'none',
  borderRadius: '8px',
  fontWeight: 600,
  fontSize: '0.85rem',
  cursor: 'pointer',
  width: '100%',
}
