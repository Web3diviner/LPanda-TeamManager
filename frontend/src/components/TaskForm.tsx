import { useState, type FormEvent, useRef } from 'react'
import api from '../api'

interface Props {
  onCreated?: () => void
}

export default function TaskForm({ onCreated }: Props) {
  const [description, setDescription] = useState('')
  const [taskLink, setTaskLink] = useState('')
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null)
  const [screenshotBase64, setScreenshotBase64] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleFile(file: File) {
    if (!file.type.startsWith('image/')) {
      setError('Only image files are supported.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Screenshot must be under 5MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      setScreenshotPreview(result)
      setScreenshotBase64(result)
    }
    reader.readAsDataURL(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  function removeScreenshot() {
    setScreenshotPreview(null)
    setScreenshotBase64(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSuccess('')
    setError('')
    if (!description.trim()) {
      setError('Description cannot be empty.')
      return
    }
    if (!taskLink.trim()) {
      setError('Task link is required.')
      return
    }
    if (!screenshotBase64) {
      setError('Screenshot is required.')
      return
    }
    setLoading(true)
    try {
      await api.post('/tasks', {
        description,
        task_link: taskLink || null,
        screenshot_url: screenshotBase64 || null,
      })
      setSuccess('✅ Task submitted successfully!')
      setDescription('')
      setTaskLink('')
      setScreenshotPreview(null)
      setScreenshotBase64(null)
      onCreated?.()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Failed to submit task.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Description */}
      <div>
        <label style={labelStyle}>Task Description <span style={{ color: '#ef4444' }}>*</span></label>
        <input
          type="text"
          placeholder="What did you work on?"
          value={description}
          onChange={e => setDescription(e.target.value)}
          style={inputStyle}
        />
      </div>

      {/* Task Link */}
      <div>
        <label style={labelStyle}>Task Link <span style={{ color: '#ef4444' }}>*</span></label>
        <div style={{ position: 'relative' }}>
          <span style={linkIcon}>🔗</span>
          <input
            type="url"
            placeholder="https://..."
            value={taskLink}
            onChange={e => setTaskLink(e.target.value)}
            required
            style={{ ...inputStyle, paddingLeft: '2.2rem' }}
          />
        </div>
      </div>

      {/* Screenshot Drop Zone */}
      <div>
        <label style={labelStyle}>Screenshot <span style={{ color: '#ef4444' }}>*</span></label>
        {screenshotPreview ? (
          <div style={previewWrap}>
            <img src={screenshotPreview} alt="Screenshot preview" style={previewImg} />
            <button type="button" onClick={removeScreenshot} style={removeBtn}>✕ Remove</button>
          </div>
        ) : (
          <div
            style={{ ...dropZone, borderColor: dragOver ? '#7c3aed' : '#d1d5db', background: dragOver ? '#f5f3ff' : '#fafafa' }}
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📸</div>
            <div style={{ fontSize: '0.95rem', color: '#1f2937', fontWeight: 600, marginBottom: '0.4rem' }}>
              Drag & drop or <span style={{ color: '#7c3aed', fontWeight: 700 }}>click to browse</span>
            </div>
            <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>PNG, JPG, GIF up to 5MB</div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileInput}
              style={{ display: 'none' }}
            />
          </div>
        )}
      </div>

      {error && <p style={{ color: '#dc2626', margin: 0, fontSize: '0.875rem', padding: '0.75rem 1rem', background: '#fee2e2', borderRadius: '8px', borderLeft: '4px solid #dc2626' }}>⚠️ {error}</p>}
      {success && <p style={{ color: '#059669', margin: 0, fontSize: '0.875rem', fontWeight: 500, padding: '0.75rem 1rem', background: '#d1fae5', borderRadius: '8px', borderLeft: '4px solid #059669' }}>{success}</p>}

      <button type="submit" disabled={loading} style={btnStyle}>
        {loading ? '⏳ Submitting…' : '➕ Submit Task'}
      </button>
    </form>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block', marginBottom: '0.5rem', fontWeight: 700, fontSize: '0.875rem', 
  color: '#1f2937', letterSpacing: '0.3px',
}
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.85rem 1rem', border: '2px solid #e5e7eb',
  borderRadius: '10px', fontSize: '0.95rem', background: '#fafafa',
  transition: 'all 0.2s ease', boxSizing: 'border-box',
  ':focus': { borderColor: '#7c3aed', background: '#fff' },
}
const linkIcon: React.CSSProperties = {
  position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)',
  fontSize: '1rem', pointerEvents: 'none',
}
const dropZone: React.CSSProperties = {
  border: '2px dashed #d1d5db', borderRadius: '12px', padding: '2rem 1.5rem',
  textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s ease',
  background: '#fafafa', position: 'relative',
}
const previewWrap: React.CSSProperties = {
  position: 'relative', display: 'inline-block', borderRadius: '12px', overflow: 'hidden',
  border: '2px solid #ede9fe', boxShadow: '0 4px 12px rgba(124,58,237,0.15)',
}
const previewImg: React.CSSProperties = {
  display: 'block', maxWidth: '100%', maxHeight: '240px', objectFit: 'cover',
}
const removeBtn: React.CSSProperties = {
  position: 'absolute', top: '0.6rem', right: '0.6rem',
  background: 'rgba(0,0,0,0.7)', color: '#fff', border: 'none',
  borderRadius: '8px', padding: '0.4rem 0.7rem', fontSize: '0.8rem',
  cursor: 'pointer', fontWeight: 700, backdropFilter: 'blur(4px)',
}
const btnStyle: React.CSSProperties = {
  padding: '0.9rem 1.5rem', background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
  color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700,
  fontSize: '0.95rem', cursor: 'pointer', boxShadow: '0 4px 16px rgba(124,58,237,0.35)',
  transition: 'all 0.2s ease', width: '100%',
}
