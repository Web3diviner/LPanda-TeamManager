import { useEffect, useState } from 'react'
import api from '../api'
import { useIsMobile } from '../hooks/useIsMobile'

interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'member'
  role_title: string | null
  points: number
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'admin' | 'member'>('member')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  // role_title editing state: userId -> draft value
  const [titleDrafts, setTitleDrafts] = useState<Record<string, string>>({})
  const [titleSaving, setTitleSaving] = useState<Record<string, boolean>>({})
  const [resetUserId, setResetUserId] = useState<string | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [resetSaving, setResetSaving] = useState(false)
  const [showSiteReset, setShowSiteReset] = useState(false)
  const [siteResetting, setSiteResetting] = useState(false)
  const [adjustUserId, setAdjustUserId] = useState<string | null>(null)
  const [adjustDelta, setAdjustDelta] = useState('')
  const [adjustReason, setAdjustReason] = useState('')
  const [adjustSaving, setAdjustSaving] = useState(false)

  async function handleAdjustPoints(e: React.FormEvent) {
    e.preventDefault()
    if (!adjustUserId) return
    const delta = parseFloat(adjustDelta)
    if (isNaN(delta) || delta === 0) { alert('Enter a valid non-zero number.'); return }
    setAdjustSaving(true)
    try {
      const res = await api.post(`/auth/users/${adjustUserId}/adjust-points`, { delta, reason: adjustReason || undefined })
      setUsers(prev => prev.map(u => u.id === adjustUserId ? { ...u, points: res.data.points } : u))
      setAdjustUserId(null); setAdjustDelta(''); setAdjustReason('')
    } catch (err: unknown) {
      alert((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed.')
    } finally { setAdjustSaving(false) }
  }

  async function handleSiteReset() {
    setSiteResetting(true)
    try {
      await api.post('/auth/reset')
      setShowSiteReset(false)
      alert('✅ Site activity has been reset. All tasks, points, and activity cleared.')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to reset.'
      alert(msg)
    } finally { setSiteResetting(false) }
  }
  async function fetchUsers() {
    try {
      const res = await api.get('/auth/users')
      setUsers(res.data)
      // init drafts
      const drafts: Record<string, string> = {}
      res.data.forEach((u: User) => { drafts[u.id] = u.role_title ?? '' })
      setTitleDrafts(drafts)
    } catch { /* ignore */ }
  }

  useEffect(() => { fetchUsers() }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setSuccess(''); setLoading(true)
    try {
      await api.post('/auth/register', { name, email, password, role })
      setSuccess(`Account created for ${name}`)
      setName(''); setEmail(''); setPassword(''); setRole('member')
      fetchUsers()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to create user'
      setError(msg)
    } finally { setLoading(false) }
  }

  async function handleDelete(u: User) {
    if (!confirm(`Delete account for ${u.name}? This cannot be undone.`)) return
    try {
      await api.delete(`/auth/users/${u.id}`)
      setUsers(prev => prev.filter(x => x.id !== u.id))
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to delete user'
      alert(msg)
    }
  }

  async function handleSaveTitle(userId: string) {
    setTitleSaving(prev => ({ ...prev, [userId]: true }))
    try {
      const res = await api.patch(`/auth/users/${userId}`, { role_title: titleDrafts[userId] ?? '' })
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role_title: res.data.role_title } : u))
    } catch { alert('Failed to save title') }
    finally { setTitleSaving(prev => ({ ...prev, [userId]: false })) }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault()
    if (!resetUserId) return
    setResetSaving(true)
    try {
      await api.patch(`/auth/users/${resetUserId}/password`, { password: newPassword })
      setResetUserId(null)
      setNewPassword('')
      alert('Password reset successfully.')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to reset password'
      alert(msg)
    } finally { setResetSaving(false) }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db',
    borderRadius: '6px', boxSizing: 'border-box', fontSize: '0.9rem',
    background: '#fff',
  }
  const labelStyle: React.CSSProperties = { display: 'block', marginBottom: '0.25rem', fontWeight: 600, fontSize: '0.85rem', color: '#374151' }
  const isMobile = useIsMobile()

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '1.5rem', color: '#1e1b4b' }}>👥 User Management</h2>

      <div style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem', background: '#fff5f5', border: '1px solid #fecaca', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <div style={{ fontWeight: 700, color: '#dc2626', fontSize: '0.9rem' }}>⚠️ Danger Zone</div>
          <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.2rem' }}>Reset all tasks, points, and site activity. Users are kept.</div>
        </div>
        <button onClick={() => setShowSiteReset(true)} style={{ padding: '0.5rem 1rem', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>
          🔄 Reset Site Activity
        </button>
      </div>

      <style>{`@media(max-width:768px){.users-grid{grid-template-columns:1fr!important;}}`}</style>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '320px 1fr', gap: '2rem', alignItems: 'start' }} className="users-grid">

        {/* Create Account Form */}
        <div style={{ background: '#fff', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', border: '1px solid #e5e7eb' }}>
          <h3 style={{ marginTop: 0, marginBottom: '1rem', color: '#4c1d95', fontSize: '1rem' }}>➕ Create Account</h3>
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div>
              <label style={labelStyle}>Name</label>
              <input value={name} onChange={e => setName(e.target.value)} required style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Role</label>
              <select value={role} onChange={e => setRole(e.target.value as 'admin' | 'member')} style={inputStyle}>
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            {error && <p style={{ color: '#dc2626', margin: 0, fontSize: '0.85rem' }}>{error}</p>}
            {success && <p style={{ color: '#16a34a', margin: 0, fontSize: '0.85rem' }}>{success}</p>}
            <button type="submit" disabled={loading} style={{
              padding: '0.6rem', background: 'linear-gradient(135deg,#7c3aed,#4c1d95)',
              color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem',
            }}>
              {loading ? 'Creating…' : 'Create Account'}
            </button>
          </form>
        </div>

        {/* Team Members Table */}
        <div style={{ background: '#fff', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', border: '1px solid #e5e7eb' }}>
          <h3 style={{ marginTop: 0, marginBottom: '1rem', color: '#4c1d95', fontSize: '1rem' }}>🐼 Team Members</h3>
          {users.length === 0 ? (
            <p style={{ color: '#9ca3af' }}>No users yet.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: '#f5f3ff' }}>
                  {['Name', 'Email', 'Role', 'Role Title', 'Points', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '0.6rem 0.75rem', textAlign: 'left', borderBottom: '2px solid #ede9fe', color: '#4c1d95', fontWeight: 700, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '0.6rem 0.75rem', fontWeight: 600 }}>{u.name}</td>
                    <td style={{ padding: '0.6rem 0.75rem', color: '#6b7280' }}>{u.email}</td>
                    <td style={{ padding: '0.6rem 0.75rem' }}>
                      <span style={{
                        padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700,
                        background: u.role === 'admin' ? '#ede9fe' : '#f3f4f6',
                        color: u.role === 'admin' ? '#6d28d9' : '#374151',
                      }}>{u.role}</span>
                    </td>
                    <td style={{ padding: '0.6rem 0.75rem' }}>
                      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                        <input
                          value={titleDrafts[u.id] ?? ''}
                          onChange={e => setTitleDrafts(prev => ({ ...prev, [u.id]: e.target.value }))}
                          placeholder="e.g. Lead Developer"
                          style={{ ...inputStyle, width: '160px', padding: '0.3rem 0.5rem', fontSize: '0.8rem' }}
                        />
                        <button
                          onClick={() => handleSaveTitle(u.id)}
                          disabled={titleSaving[u.id]}
                          style={{
                            padding: '0.3rem 0.6rem', background: '#7c3aed', color: '#fff',
                            border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, whiteSpace: 'nowrap',
                          }}
                        >
                          {titleSaving[u.id] ? '…' : 'Save'}
                        </button>
                      </div>
                    </td>
                    <td style={{ padding: '0.6rem 0.75rem', fontWeight: 700, color: '#7c3aed' }}>{u.points}</td>
                    <td style={{ padding: '0.6rem 0.75rem' }}>
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        <button onClick={() => { setAdjustUserId(u.id); setAdjustDelta(''); setAdjustReason('') }}
                          style={{ padding: '0.3rem 0.7rem', background: '#ede9fe', color: '#5b21b6', border: '1px solid #c4b5fd', borderRadius: '5px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                          ⭐ Points
                        </button>
                        <button onClick={() => { setResetUserId(u.id); setNewPassword('') }}
                          style={{ padding: '0.3rem 0.7rem', background: '#fef3c7', color: '#92400e', border: '1px solid #fcd34d', borderRadius: '5px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                          🔑 Reset PW
                        </button>
                        <button onClick={() => handleDelete(u)}
                          style={{ padding: '0.3rem 0.7rem', background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: '5px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                          🗑 Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </div>
      </div>

      {/* Site Reset Confirmation Modal */}
      {showSiteReset && (
        <div style={overlay}>
          <div style={{ ...modal, maxWidth: '420px' }}>
            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>⚠️</div>
              <h3 style={{ margin: '0 0 0.5rem', color: '#dc2626' }}>Reset All Site Activity?</h3>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280', lineHeight: 1.6 }}>
                This will permanently delete <strong>all tasks, delegated tasks, points, transactions, notifications, announcements, and feedback</strong>. All member points will be reset to 0.<br /><br />
                <strong>Users and accounts are NOT deleted.</strong> This cannot be undone.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => setShowSiteReset(false)} style={{ flex: 1, padding: '0.65rem', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={handleSiteReset} disabled={siteResetting} style={{ flex: 1, padding: '0.65rem', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>
                {siteResetting ? '⏳ Resetting…' : '🔄 Yes, Reset Everything'}
              </button>
            </div>
          </div>
        </div>
      )}
      {adjustUserId && (
        <div style={overlay}>
          <div style={modal}>
            <h3 style={{ margin: '0 0 0.5rem', color: '#4c1d95' }}>⭐ Adjust Points</h3>
            <p style={{ margin: '0 0 1rem', fontSize: '0.875rem', color: '#6b7280' }}>
              For <strong>{users.find(u => u.id === adjustUserId)?.name}</strong> — positive to award, negative to deduct.
            </p>
            <form onSubmit={handleAdjustPoints} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <input type="number" step="0.5" value={adjustDelta} onChange={e => setAdjustDelta(e.target.value)}
                placeholder="e.g. -2 or 5" required style={{ ...inputStyle, padding: '0.65rem 0.85rem' }} autoFocus />
              <input type="text" value={adjustReason} onChange={e => setAdjustReason(e.target.value)}
                placeholder="Reason (optional)" style={{ ...inputStyle, padding: '0.65rem 0.85rem' }} />
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="submit" disabled={adjustSaving} style={{ flex: 1, padding: '0.6rem', background: 'linear-gradient(135deg,#7c3aed,#4c1d95)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>
                  {adjustSaving ? 'Saving…' : 'Apply'}
                </button>
                <button type="button" onClick={() => setAdjustUserId(null)} style={{ padding: '0.6rem 1rem', background: '#f3f4f6', color: '#374151', border: '1px solid #e5e7eb', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {resetUserId && (
        <div style={overlay}>
          <div style={modal}>
            <h3 style={{ margin: '0 0 1rem', color: '#4c1d95' }}>🔑 Reset Password</h3>
            <p style={{ margin: '0 0 1rem', fontSize: '0.875rem', color: '#6b7280' }}>
              Set a new password for <strong>{users.find(u => u.id === resetUserId)?.name}</strong>
            </p>
            <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="New password (min 6 chars)"
                minLength={6}
                required
                style={{ ...inputStyle, padding: '0.65rem 0.85rem' }}
                autoFocus
              />
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="submit" disabled={resetSaving} style={{ flex: 1, padding: '0.6rem', background: 'linear-gradient(135deg,#7c3aed,#4c1d95)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>
                  {resetSaving ? 'Saving…' : 'Reset Password'}
                </button>
                <button type="button" onClick={() => setResetUserId(null)} style={{ padding: '0.6rem 1rem', background: '#f3f4f6', color: '#374151', border: '1px solid #e5e7eb', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

const overlay: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
  backdropFilter: 'blur(4px)',
}
const modal: React.CSSProperties = {
  background: '#fff', borderRadius: '16px', padding: '2rem',
  width: '100%', maxWidth: '380px', boxShadow: '0 24px 64px rgba(0,0,0,0.2)',
  margin: '1rem',
}
