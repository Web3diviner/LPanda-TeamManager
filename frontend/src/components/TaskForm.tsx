import { useState, FormEvent, useRef } from 'react'
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
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
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
        <label style={labelStyle}>Task Link <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional)</span></label>
        <div style={{ position: 'relative' }}>
          <span style={linkIcon}>🔗</span>
          <input
            type="url"
            placeholder="https://..."
            value={taskLink}
            onChange={e => setTaskLink(e.target.value)}
            style={{ ...inputStyle, paddingLeft: '2.2rem' }}
          />
        </div>
      </div>

      {/* Screenshot Drop Zone */}
      <div>
        <label style={labelStyle}>Screenshot <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional)</span></label>
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
            <div style={{ fontSize: '2rem', marginBottom: '0.35rem' }}>📸</div>
            <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
              Drag & drop a screenshot here, or <span style={{ color: '#7c3aed', fontWeight: 600 }}>click to browse</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>PNG, JPG, GIF up to 5MB</div>
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

      {error && <p style={{ color: '#dc2626', margin: 0, fontSize: '0.875rem' }}>⚠️ {error}</p>}
      {success && <p style={{ color: '#059669', margin: 0, fontSize: '0.875rem', fontWeight: 500 }}>{success}</p>}

      <button type="submit" disabled={loading} style={btnStyle}>
        {loading ? '⏳ Submitting…' : '➕ Submit Task'}
      </button>
    </form>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block', marginBottom: '0.35rem', fontWeight: 600, fontSize: '0.85rem', color: '#374151',
}
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.65rem 0.9rem', border: '1.5px solid #e5e7eb',
  borderRadius: '8px', fontSize: '0.9rem', background: '#fafafa',
}
const linkIcon: React.CSSProperties = {
  position: 'absolute', left: '0.7rem', top: '50%', transform: 'translateY(-50%)',
  fontSize: '0.9rem', pointerEvents: 'none',
}
const dropZone: React.CSSProperties = {
  border: '2px dashed', borderRadius: '10px', padding: '1.5rem',
  textAlign: 'center', cursor: 'pointer', transition: 'all 0.15s ease',
}
const previewWrap: React.CSSProperties = {
  position: 'relative', display: 'inline-block', borderRadius: '8px', overflow: 'hidden',
  border: '1.5px solid #e5e7eb',
}
const previewImg: React.CSSProperties = {
  display: 'block', maxWidth: '100%', maxHeight: '200px', objectFit: 'contain',
}
const removeBtn: React.CSSProperties = {
  position: 'absolute', top: '0.4rem', right: '0.4rem',
  background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none',
  borderRadius: '6px', padding: '0.2rem 0.5rem', fontSize: '0.75rem',
  cursor: 'pointer', fontWeight: 600,
}
const btnStyle: React.CSSProperties = {
  padding: '0.7rem', background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
  color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700,
  fontSize: '0.9rem', cursor: 'pointer', boxShadow: '0 2px 8px rgba(124,58,237,0.3)',
}
