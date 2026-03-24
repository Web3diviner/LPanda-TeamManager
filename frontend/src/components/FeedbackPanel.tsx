import { useEffect, useState } from 'react'
import api from '../api'
import { useAuth } from '../context/AuthContext'

interface FeedbackItem {
  id: string
  message: string
  admin_remark: string | null
  created_at: string
  user_name?: string
}

export default function FeedbackPanel() {
  const { user } = useAuth()
  const [items, setItems] = useState<FeedbackItem[]>([])
  const [message, setMessage] = useState('')
  const [remarkId, setRemarkId] = useState<string | null>(null)
  const [remarkText, setRemarkText] = useState('')
  const [loading, setLoading] = useState(false)

  async function fetchFeedback() {
    try {
      const res = await api.get('/feedback')
      setItems(res.data)
    } catch { /* ignore */ }
  }

  useEffect(() => { fetchFeedback() }, [])

  async function handleSubmit() {
    if (!message.trim()) return
    setLoading(true)
    try {
      await api.post('/feedback', { message })
      setMessage('')
      fetchFeedback()
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }

  async function handleRemark(id: string) {
    if (!remarkText.trim()) return
    try {
      await api.patch(`/feedback/${id}/remark`, { admin_remark: remarkText })
      setRemarkId(null)
      setRemarkText('')
      fetchFeedback()
    } catch { /* ignore */ }
  }

  return (
    <div>
      {/* Member: submit feedback */}
      {user?.role !== 'admin' && (
        <div style={{ marginBottom: '1rem' }}>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Share feedback, suggestions, or concerns… (optional)"
            rows={3}
            style={textareaStyle}
          />
          <button onClick={handleSubmit} disabled={loading || !message.trim()} style={submitBtn}>
            {loading ? '⏳ Sending…' : '📤 Send Feedback'}
          </button>
        </div>
      )}

      {items.length === 0 && (
        <p style={{ color: '#9ca3af', fontSize: '0.875rem', margin: 0 }}>No feedback yet.</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
        {items.map(item => (
          <div key={item.id} style={feedbackCard}>
            {user?.role === 'admin' && item.user_name && (
              <div style={{ fontSize: '0.78rem', color: '#7c3aed', fontWeight: 600, marginBottom: '0.25rem' }}>
                👤 {item.user_name}
              </div>
            )}
            <p style={{ margin: '0 0 0.4rem', fontSize: '0.875rem', color: '#1e1b4b' }}>{item.message}</p>
            <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.4rem' }}>
              {new Date(item.created_at).toLocaleString()}
            </div>
            {item.admin_remark && (
              <div style={remarkBox}>
                💬 Admin: {item.admin_remark}
              </div>
            )}
            {user?.role === 'admin' && (
              remarkId === item.id ? (
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem' }}>
                  <input
                    value={remarkText}
                    onChange={e => setRemarkText(e.target.value)}
                    placeholder="Add remark…"
                    style={remarkInput}
                  />
                  <button onClick={() => handleRemark(item.id)} style={saveRemarkBtn}>Save</button>
                  <button onClick={() => setRemarkId(null)} style={cancelBtn}>✕</button>
                </div>
              ) : (
                <button onClick={() => { setRemarkId(item.id); setRemarkText(item.admin_remark || '') }} style={addRemarkBtn}>
                  {item.admin_remark ? '✏️ Edit Remark' : '💬 Add Remark'}
                </button>
              )
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

const textareaStyle: React.CSSProperties = { width: '100%', padding: '0.65rem 0.85rem', border: '1.5px solid #e5e7eb', borderRadius: '8px', fontSize: '0.875rem', resize: 'vertical', background: '#fafafa', marginBottom: '0.5rem' }
const submitBtn: React.CSSProperties = { padding: '0.5rem 1rem', background: 'linear-gradient(135deg,#7c3aed,#a855f7)', color: '#fff', border: 'none', borderRadius: '7px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }
const feedbackCard: React.CSSProperties = { background: '#faf9ff', borderRadius: '8px', padding: '0.75rem 0.9rem', border: '1px solid #ede9fe' }
const remarkBox: React.CSSProperties = { background: '#fef3c7', color: '#92400e', padding: '0.3rem 0.65rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600 }
const remarkInput: React.CSSProperties = { flex: 1, padding: '0.4rem 0.65rem', border: '1.5px solid #e5e7eb', borderRadius: '6px', fontSize: '0.85rem' }
const saveRemarkBtn: React.CSSProperties = { padding: '0.4rem 0.75rem', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', fontSize: '0.82rem' }
const cancelBtn: React.CSSProperties = { padding: '0.4rem 0.6rem', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '6px', cursor: 'pointer', fontSize: '0.82rem' }
const addRemarkBtn: React.CSSProperties = { marginTop: '0.35rem', padding: '0.3rem 0.65rem', background: '#ede9fe', color: '#5b21b6', border: '1px solid #c4b5fd', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }
