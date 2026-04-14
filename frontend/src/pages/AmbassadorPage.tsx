import { useEffect, useRef, useState } from 'react'
import TaskForm from '../components/TaskForm'
import TaskList, { type Task } from '../components/TaskList'
import AnnouncementBoard from '../components/AnnouncementBoard'
import TimerWidget from '../components/TimerWidget'
import FeedbackPanel from '../components/FeedbackPanel'
import { useAuth } from '../context/AuthContext'
import { useIsMobile } from '../hooks/useIsMobile'
import api from '../api'

export default function AmbassadorPage() {
  const { user } = useAuth()
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [toast, setToast] = useState('')
  const prevAssignedTaskIds = useRef<Set<string>>(new Set())

  function refresh() {
    setRefreshTrigger(t => t + 1)
  }

  useEffect(() => {
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

  const isMobile = useIsMobile()

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      {toast && (
        <div style={toastStyle}>
          <span>🎯</span> You have a new task assigned!
        </div>
      )}

      {/* Page header */}
      <div style={pageHeader}>
        <div>
          <h2 style={{ marginBottom: '0.2rem' }}>
            🤝 Ambassador Dashboard
          </h2>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>
            Welcome, <strong style={{ color: '#5b21b6' }}>{user?.name}</strong> — submit tasks and track your progress
          </p>
        </div>
      </div>

      <div style={{ ...grid, gridTemplateColumns: isMobile ? '1fr' : '1fr 320px' }} className="dash-grid">
        {/* Main column */}
        <div style={mainCol}>
          <div style={card}>
            <h3 style={cardTitle}>📝 Submit a Task</h3>
            <TaskForm onCreated={refresh} />
          </div>

          <div style={card}>
            <h3 style={cardTitle}>📋 My Tasks</h3>
            <TaskList refreshTrigger={refreshTrigger} />
          </div>
        </div>

        {/* Sidebar */}
        <div style={sidebar}>
          <AnnouncementBoard />
          <TimerWidget />
          <FeedbackPanel />
        </div>
      </div>
    </div>
  )
}

const pageHeader: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid #e5e7eb',
}
const grid: React.CSSProperties = {
  display: 'grid', gap: '1.5rem', alignItems: 'start',
}
const mainCol: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: '1.5rem',
}
const sidebar: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: '1.5rem',
}
const card: React.CSSProperties = {
  background: '#fff', borderRadius: '12px', padding: '1.5rem',
  border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
}
const cardTitle: React.CSSProperties = {
  margin: '0 0 1rem 0', fontSize: '1.125rem', fontWeight: 600, color: '#1f2937',
}
const toastStyle: React.CSSProperties = {
  position: 'fixed', top: '80px', right: '20px', background: '#10b981',
  color: '#fff', padding: '0.75rem 1rem', borderRadius: '8px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 1000,
  display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500,
}