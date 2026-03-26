import { useEffect, useState } from 'react'
import api from '../api'
import { useAuth } from '../context/AuthContext'

export interface Task {
  id: string
  description: string
  status: 'pending' | 'assigned' | 'completed' | 'missed'
  assigned_to: string | null
  assigned_to_name: string | null
  submitted_by: string
  submitted_by_name: string | null
  deadline: string | null
  screenshot_url: string | null
  task_link: string | null
}

const statusConfig: Record<string, { bg: string; color: string; label: string; icon: string }> = {
  pending:   { bg: '#fef3c7', color: '#92400e', label: 'Pending',   icon: '⏳' },
  assigned:  { bg: '#dbeafe', color: '#1e40af', label: 'Assigned',  icon: '📌' },
  completed: { bg: '#d1fae5', color: '#065f46', label: 'Completed', icon: '✅' },
  missed:    { bg: '#fee2e2', color: '#991b1b', label: 'Missed',    icon: '❌' },
}

interface Props {
  onAssign?: (taskId: string) => void
  refreshTrigger?: number
}

export default function TaskList({ onAssign, refreshTrigger }: Props) {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [previewImg, setPreviewImg] = useState<string | null>(null)

  async function fetchTasks() {
    try {
      const res = await api.get('/tasks')
      setTasks(res.data)
    } catch {
      setError('Failed to load tasks.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchTasks() }, [refreshTrigger])

  async function handleConfirm(taskId: string) {
    try {
      await api.patch(`/tasks/${taskId}/confirm`)
      fetchTasks()
    } catch {
      alert('Failed to confirm task.')
    }
  }

  if (loading) return <p style={{ color: '#6b7280' }}>Loading tasks…</p>
  if (error) return <p style={{ color: '#dc2626' }}>{error}</p>
  if (tasks.length === 0) return (
    <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
      <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📭</div>
      <p style={{ margin: 0 }}>No tasks yet.</p>
    </div>
  )

  return (
    <>
      {/* Screenshot lightbox */}
      {previewImg && (
        <div style={lightboxOverlay} onClick={() => setPreviewImg(null)}>
          <img src={previewImg} alt="Screenshot" style={lightboxImg} onClick={e => e.stopPropagation()} />
          <button style={lightboxClose} onClick={() => setPreviewImg(null)}>✕</button>
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ background: 'linear-gradient(135deg, #4c1d95, #7c3aed)', color: '#fff' }}>
              <th style={th}>Description</th>
              <th style={th}>Submitted By</th>
              <th style={th}>Status</th>
              <th style={th}>Assigned To</th>
              <th style={th}>Deadline</th>
              <th style={th}>Attachments</th>
              <th style={th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task, i) => {
              const cfg = statusConfig[task.status] || { bg: '#f3f4f6', color: '#374151', label: task.status, icon: '•' }
              return (
                <tr key={task.id} style={{
                  borderBottom: '1px solid #ede9fe',
                  background: i % 2 === 0 ? '#fff' : '#faf9ff',
                }}>
                  <td style={{ ...td, maxWidth: '220px' }}>
                    <span style={{ fontWeight: 500 }}>{task.description}</span>
                  </td>
                  <td style={{ ...td, color: '#6b7280', fontSize: '0.82rem' }}>
                    {task.submitted_by_name || '—'}
                  </td>
                  <td style={td}>
                    <span style={{
                      background: cfg.bg, color: cfg.color,
                      padding: '0.25rem 0.6rem', borderRadius: '20px',
                      fontSize: '0.78rem', fontWeight: 600, whiteSpace: 'nowrap',
                    }}>
                      {cfg.icon} {cfg.label}
                    </span>
                  </td>
                  <td style={{ ...td, fontSize: '0.82rem' }}>
                    {task.assigned_to_name
                      ? <span style={nameChip}>👤 {task.assigned_to_name}</span>
                      : <span style={{ color: '#9ca3af' }}>—</span>}
                  </td>
                  <td style={{ ...td, color: '#6b7280', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                    {task.deadline ? new Date(task.deadline).toLocaleString() : '—'}
                  </td>
                  <td style={td}>
                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                      {task.screenshot_url && (
                        <button
                          onClick={() => setPreviewImg(task.screenshot_url!)}
                          style={attachBtn}
                          title="View screenshot"
                        >
                          📸
                        </button>
                      )}
                      {task.task_link && (
                        <a
                          href={task.task_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={linkBtn}
                          title="Open task link"
                        >
                          🔗
                        </a>
                      )}
                      {!task.screenshot_url && !task.task_link && (
                        <span style={{ color: '#d1d5db', fontSize: '0.78rem' }}>—</span>
                      )}
                    </div>
                  </td>
                  <td style={td}>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      {user?.role === 'admin' && task.status !== 'completed' && task.status !== 'missed' && (
                        <button onClick={() => handleConfirm(task.id)} style={btnConfirm}>
                          ✅ Confirm
                        </button>
                      )}
                      {user?.role === 'admin' && onAssign && task.status !== 'completed' && task.status !== 'missed' && (
                        <button onClick={() => onAssign(task.id)} style={btnAssign}>
                          📌 Assign
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}

const th: React.CSSProperties = { padding: '0.65rem 0.85rem', fontWeight: 600, textAlign: 'left', fontSize: '0.82rem', letterSpacing: '0.03em' }
const td: React.CSSProperties = { padding: '0.65rem 0.85rem', verticalAlign: 'middle' }
const nameChip: React.CSSProperties = { background: '#ede9fe', color: '#5b21b6', padding: '0.2rem 0.55rem', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 600, whiteSpace: 'nowrap' }
const btnConfirm: React.CSSProperties = { background: '#d1fae5', color: '#065f46', border: '1px solid #6ee7b7', borderRadius: '6px', padding: '0.3rem 0.65rem', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer' }
const btnAssign: React.CSSProperties = { background: '#ede9fe', color: '#5b21b6', border: '1px solid #c4b5fd', borderRadius: '6px', padding: '0.3rem 0.65rem', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer' }
const attachBtn: React.CSSProperties = { background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: '6px', padding: '0.25rem 0.5rem', cursor: 'pointer', fontSize: '0.9rem' }
const linkBtn: React.CSSProperties = { background: '#dbeafe', border: '1px solid #93c5fd', borderRadius: '6px', padding: '0.25rem 0.5rem', fontSize: '0.9rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }
const lightboxOverlay: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000 }
const lightboxImg: React.CSSProperties = { maxWidth: '90vw', maxHeight: '85vh', borderRadius: '10px', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }
const lightboxClose: React.CSSProperties = { position: 'fixed', top: '1rem', right: '1rem', background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', borderRadius: '8px', padding: '0.4rem 0.8rem', fontSize: '1rem', cursor: 'pointer', fontWeight: 700 }
