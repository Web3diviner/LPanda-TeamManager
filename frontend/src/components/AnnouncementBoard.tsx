import { useEffect, useState } from 'react'
import api from '../api'
import { useAuth } from '../context/AuthContext'

interface Announcement {
  id: string
  content: string
  created_at: string
  author_name?: string
}

export default function AnnouncementBoard() {
  const { user } = useAuth()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [content, setContent] = useState('')
  const [error, setError] = useState('')
  const [posting, setPosting] = useState(false)

  async function fetchAnnouncements() {
    try {
      const res = await api.get('/announcements')
      setAnnouncements(res.data)
    } catch {
      // silently fail
    }
  }

  useEffect(() => {
    fetchAnnouncements()
  }, [])

  async function handlePost() {
    setError('')
    if (!content.trim()) {
      setError('Content cannot be empty.')
      return
    }
    setPosting(true)
    try {
      await api.post('/announcements', { content })
      setContent('')
      fetchAnnouncements()
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Failed to post announcement.'
      setError(msg)
    } finally {
      setPosting(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      await api.delete(`/announcements/${id}`)
      fetchAnnouncements()
    } catch {
      alert('Failed to delete announcement.')
    }
  }

  return (
    <div>
      <h3 style={{ marginBottom: '0.75rem' }}>Announcements</h3>
      {user?.role === 'admin' && (
        <div style={{ marginBottom: '1rem' }}>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Write an announcement…"
            rows={3}
            style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box', resize: 'vertical' }}
          />
          {error && <p style={{ color: '#c00', margin: '0.25rem 0' }}>{error}</p>}
          <button
            onClick={handlePost}
            disabled={posting}
            style={{ marginTop: '0.5rem', padding: '0.4rem 1rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}
          >
            {posting ? 'Posting…' : 'Post'}
          </button>
        </div>
      )}
      {announcements.length === 0 && <p style={{ color: '#64748b' }}>No announcements yet.</p>}
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {announcements.map(a => (
          <li key={a.id} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '0.75rem', marginBottom: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ margin: '0 0 0.25rem', whiteSpace: 'pre-wrap' }}>{a.content}</p>
                <small style={{ color: '#64748b' }}>
                  {a.author_name && <>{a.author_name} · </>}
                  {new Date(a.created_at).toLocaleString()}
                </small>
              </div>
              {user?.role === 'admin' && (
                <button
                  onClick={() => handleDelete(a.id)}
                  style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1rem', marginLeft: '0.5rem' }}
                  title="Delete"
                >
                  ✕
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
