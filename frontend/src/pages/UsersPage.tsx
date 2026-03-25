import { useEffect, useState } from 'react'
import api from '../api'

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

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db',
    borderRadius: '6px', boxSizing: 'border-box', fontSize: '0.9rem',
    background: '#fff',
  }
  const labelStyle: React.CSSProperties = { display: 'block', marginBottom: '0.25rem', fontWeight: 600, fontSize: '0.85rem', color: '#374151' }

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '1.5rem', color: '#1e1b4b' }}>👥 User Management</h2>

      <style>{`@media(max-width:768px){.users-grid{grid-template-columns:1fr!important;}}`}</style>
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '2rem', alignItems: 'start' }} className="users-grid">

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
                      <button
                        onClick={() => handleDelete(u)}
                        style={{
                          padding: '0.3rem 0.7rem', background: '#fee2e2', color: '#dc2626',
                          border: '1px solid #fca5a5', borderRadius: '5px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
                        }}
                      >
                        🗑 Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
