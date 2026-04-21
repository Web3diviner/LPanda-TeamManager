import { useEffect, useState } from 'react'
import ambassadorAdminApi from '../ambassadorAdminApi'

interface Task {
  id: string; description: string; status: string; deadline: string | null
  submitted_at: string; submitted_by: string | null; submitted_by_name: string | null
  assigned_to: string | null; assigned_to_name: string | null
}
interface Ambassador { id: string; name: string }

type Tab = 'pending' | 'all' | 'delegate'

export default function AmbassadorAdminTasksPage() {
  const [tab, setTab] = useState<Tab>('pending')
  const [pendingTasks, setPendingTasks] = useState<Task[]>([])
  const [allTasks, setAllTasks] = useState<Task[]>([])
  const [ambassadors, setAmbassadors] = useState<Ambassador[]>([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')

  // Assign modal
  const [assignTarget, setAssignTarget] = useState<Task | null>(null)
  const [assignTo, setAssignTo] = useState('')
  const [assignDeadline, setAssignDeadline] = useState('')
  const [assigning, setAssigning] = useState(false)

  // Delegate form
  const [delTitle, setDelTitle] = useState('')
  const [delDesc, setDelDesc] = useState('')
  const [delAssignees, setDelAssignees] = useState<string[]>([])
  const [delDeadline, setDelDeadline] = useState('')
  const [delegating, setDelegating] = useState(false)

  async function load() {
    try {
      const [pendRes, allRes, ambRes] = await Promise.all([
        ambassadorAdminApi.get('/ambassador-admin/pending-tasks'),
        ambassadorAdminApi.get('/ambassador-admin/tasks'),
        ambassadorAdminApi.get('/ambassador-admin/ambassadors'),
      ])
      setPendingTasks(pendRes.data)
      setAllTasks(allRes.data)
      setAmbassadors(ambRes.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function handleRemove(taskId: string) {
    try {
      await ambassadorAdminApi.delete(`/ambassador-admin/tasks/${taskId}`)
      setMsg('Task removed')
      load()
    } catch (err: any) {
      setMsg(err.response?.data?.error ?? 'Failed to remove task')
    }
  }

  async function handleAssign() {
    if (!assignTarget || !assignTo || !assignDeadline) return
    setAssigning(true)
    try {
      await ambassadorAdminApi.post(`/ambassador-admin/tasks/${assignTarget.id}/assign`, { assigned_to: assignTo, deadline: assignDeadline })
      setMsg('Task assigned')
      setAssignTarget(null)
      load()
    } catch (err: any) {
      setMsg(err.response?.data?.error ?? 'Failed to assign')
    } finally {
      setAssigning(false)
    }
  }

  async function handleConfirm(taskId: string) {
    try {
      await ambassadorAdminApi.post(`/ambassador-admin/tasks/${taskId}/confirm`)
      setMsg('Task confirmed and points awarded')
      load()
    } catch (err: any) {
      setMsg(err.response?.data?.error ?? 'Failed to confirm')
    }
  }

  async function handleDelegate(e: React.FormEvent) {
    e.preventDefault()
    if (!delTitle || delAssignees.length === 0 || !delDeadline) return
    setDelegating(true)
    try {
      await ambassadorAdminApi.post('/ambassador-admin/delegated', { title: delTitle, description: delDesc, assigned_to: delAssignees, deadline: delDeadline })
      setMsg('Task delegated successfully')
      setDelTitle(''); setDelDesc(''); setDelAssignees([]); setDelDeadline('')
      load()
    } catch (err: any) {
      setMsg(err.response?.data?.error ?? 'Failed to delegate')
    } finally {
      setDelegating(false)
    }
  }

  const statusColor = (s: string) => s === 'pending' ? '#d97706' : s === 'assigned' ? '#1e5fa8' : s === 'completed' ? '#059669' : '#6b7280'

  return (
    <div>
      <h1 style={h1}>📋 Tasks</h1>
      {msg && <div style={msgBox}>{msg} <button onClick={() => setMsg('')} style={closeBtn}>✕</button></div>}

      <div style={tabBar}>
        {(['pending', 'all', 'delegate'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} style={tabBtn(tab === t)}>
            {t === 'pending' ? '⏳ Pending' : t === 'all' ? '📄 All Tasks' : '🎯 Delegate'}
          </button>
        ))}
      </div>

      {loading ? <p>Loading…</p> : (
        <>
          {tab === 'pending' && (
            <div style={tableWrap}>
              <table style={tableStyle}>
                <thead><tr style={theadRow}>
                  <th style={th}>Description</th><th style={th}>Submitted By</th><th style={th}>Submitted</th><th style={th}>Actions</th>
                </tr></thead>
                <tbody>
                  {pendingTasks.map(t => (
                    <tr key={t.id} style={tbodyRow}>
                      <td style={td}>{t.description}</td>
                      <td style={td}>{t.submitted_by_name ?? '—'}</td>
                      <td style={td}>{new Date(t.submitted_at).toLocaleDateString()}</td>
                      <td style={{ ...td, display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => { setAssignTarget(t); setAssignTo(''); setAssignDeadline('') }} style={actionBtn('#1e5fa8')}>Assign</button>
                        <button onClick={() => handleRemove(t.id)} style={actionBtn('#dc2626')}>Remove</button>
                      </td>
                    </tr>
                  ))}
                  {pendingTasks.length === 0 && <tr><td colSpan={4} style={{ ...td, textAlign: 'center', color: '#9ca3af' }}>No pending tasks</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'all' && (
            <div style={tableWrap}>
              <table style={tableStyle}>
                <thead><tr style={theadRow}>
                  <th style={th}>Description</th><th style={th}>Submitted By</th><th style={th}>Assigned To</th><th style={th}>Status</th><th style={th}>Actions</th>
                </tr></thead>
                <tbody>
                  {allTasks.map(t => (
                    <tr key={t.id} style={tbodyRow}>
                      <td style={td}>{t.description}</td>
                      <td style={td}>{t.submitted_by_name ?? '—'}</td>
                      <td style={td}>{t.assigned_to_name ?? '—'}</td>
                      <td style={td}><span style={{ ...statusBadge, background: statusColor(t.status) + '22', color: statusColor(t.status) }}>{t.status}</span></td>
                      <td style={{ ...td, display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {t.status === 'pending' && <button onClick={() => { setAssignTarget(t); setAssignTo(''); setAssignDeadline('') }} style={actionBtn('#1e5fa8')}>Assign</button>}
                        {t.status === 'assigned' && <button onClick={() => handleConfirm(t.id)} style={actionBtn('#059669')}>Confirm</button>}
                        {t.status === 'pending' && <button onClick={() => handleRemove(t.id)} style={actionBtn('#dc2626')}>Remove</button>}
                      </td>
                    </tr>
                  ))}
                  {allTasks.length === 0 && <tr><td colSpan={5} style={{ ...td, textAlign: 'center', color: '#9ca3af' }}>No tasks found</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'delegate' && (
            <div style={formCard}>
              <h2 style={{ margin: '0 0 1.25rem', color: '#1e3a5f', fontSize: '1.1rem', fontWeight: 700 }}>🎯 Delegate a Task to Ambassadors</h2>
              <form onSubmit={handleDelegate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>Title *</label>
                  <input value={delTitle} onChange={e => setDelTitle(e.target.value)} style={inputStyle} placeholder="Task title" required />
                </div>
                <div>
                  <label style={labelStyle}>Description</label>
                  <textarea value={delDesc} onChange={e => setDelDesc(e.target.value)} style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} placeholder="Optional description" />
                </div>
                <div>
                  <label style={labelStyle}>Assign To (select multiple) *</label>
                  <select multiple value={delAssignees} onChange={e => setDelAssignees(Array.from(e.target.selectedOptions, o => o.value))} style={{ ...inputStyle, minHeight: '120px' }}>
                    {ambassadors.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.25rem 0 0' }}>Hold Ctrl/Cmd to select multiple</p>
                </div>
                <div>
                  <label style={labelStyle}>Deadline *</label>
                  <input type="date" value={delDeadline} onChange={e => setDelDeadline(e.target.value)} style={inputStyle} required />
                </div>
                <button type="submit" disabled={delegating} style={submitBtn}>
                  {delegating ? 'Delegating…' : 'Delegate Task'}
                </button>
              </form>
            </div>
          )}
        </>
      )}

      {/* Assign Modal */}
      {assignTarget && (
        <div style={overlay}>
          <div style={modal}>
            <h2 style={{ margin: '0 0 0.5rem', color: '#1e3a5f' }}>Assign Task</h2>
            <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '0 0 1rem' }}>{assignTarget.description}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <label style={labelStyle}>Assign To *</label>
                <select value={assignTo} onChange={e => setAssignTo(e.target.value)} style={inputStyle}>
                  <option value="">Select ambassador…</option>
                  {ambassadors.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Deadline *</label>
                <input type="date" value={assignDeadline} onChange={e => setAssignDeadline(e.target.value)} style={inputStyle} />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button onClick={() => setAssignTarget(null)} style={cancelBtn}>Cancel</button>
                <button onClick={handleAssign} disabled={assigning || !assignTo || !assignDeadline} style={confirmBtn}>
                  {assigning ? 'Assigning…' : 'Assign'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const h1: React.CSSProperties = { margin: '0 0 1.5rem', fontSize: '1.6rem', fontWeight: 900, color: '#1e3a5f' }
const tabBar: React.CSSProperties = { display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }
const tabBtn = (active: boolean): React.CSSProperties => ({ background: active ? '#1e5fa8' : '#f1f5f9', color: active ? '#fff' : '#374151', border: 'none', borderRadius: '8px', padding: '0.6rem 1.25rem', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem' })
const tableWrap: React.CSSProperties = { overflowX: 'auto', background: '#fff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }
const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse' }
const theadRow: React.CSSProperties = { background: '#f1f5f9' }
const tbodyRow: React.CSSProperties = { borderBottom: '1px solid #f1f5f9' }
const th: React.CSSProperties = { padding: '0.85rem 1rem', textAlign: 'left', fontWeight: 700, fontSize: '0.85rem', color: '#374151' }
const td: React.CSSProperties = { padding: '0.85rem 1rem', fontSize: '0.9rem', color: '#374151' }
const statusBadge: React.CSSProperties = { padding: '0.2rem 0.6rem', borderRadius: '12px', fontWeight: 700, fontSize: '0.8rem' }
const actionBtn = (color: string): React.CSSProperties => ({ background: color, color: '#fff', border: 'none', borderRadius: '6px', padding: '0.35rem 0.75rem', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' })
const formCard: React.CSSProperties = { background: '#fff', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', maxWidth: '560px' }
const labelStyle: React.CSSProperties = { display: 'block', marginBottom: '0.35rem', fontWeight: 600, fontSize: '0.85rem', color: '#374151' }
const inputStyle: React.CSSProperties = { width: '100%', padding: '0.65rem 0.9rem', borderRadius: '8px', border: '1.5px solid #d1d5db', fontSize: '0.95rem', boxSizing: 'border-box' }
const submitBtn: React.CSSProperties = { background: '#1e5fa8', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.75rem', fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem' }
const msgBox: React.CSSProperties = { background: '#f0fdf4', border: '1px solid #86efac', color: '#166534', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }
const closeBtn: React.CSSProperties = { background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', color: '#166534' }
const overlay: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }
const modal: React.CSSProperties = { background: '#fff', borderRadius: '16px', padding: '2rem', width: '100%', maxWidth: '440px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }
const cancelBtn: React.CSSProperties = { background: '#f1f5f9', border: '1px solid #d1d5db', color: '#374151', borderRadius: '8px', padding: '0.6rem 1.25rem', fontWeight: 600, cursor: 'pointer' }
const confirmBtn: React.CSSProperties = { background: '#1e5fa8', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.6rem 1.25rem', fontWeight: 700, cursor: 'pointer' }
