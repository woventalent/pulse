import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '../contexts/AuthContext.jsx'
import './FeedbackButton.css'

const TOOLKIT_REGISTRY = [{ slug: 'pulse', name: 'Pulse' }]
const MODULES = ['Projects', 'Timesheets', 'Reports', 'Calendar', 'Settings', 'Other']

function IconMessage({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}

function IconX({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  )
}

function IconChevron({ size = 16 }) {
  return (
    <svg className="feedback-dropdown__chevron" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

function IconCheck({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

function IconImage({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-5-5L5 21" />
    </svg>
  )
}

function IconTrash({ size = 12 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18M8 6V4h8v2m-1 0v14H9V6" />
    </svg>
  )
}

function Dropdown({ value, placeholder, options, onChange, disabled, id }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const selectedLabel = options.find((o) => o.value === value)?.label

  return (
    <div className="feedback-dropdown" ref={ref}>
      <button
        type="button"
        id={id}
        className="feedback-dropdown__trigger"
        onClick={() => !disabled && setOpen((p) => !p)}
        disabled={disabled}
        data-open={open}
      >
        <span className={selectedLabel ? 'feedback-dropdown__value' : 'feedback-dropdown__placeholder'}>
          {selectedLabel || placeholder}
        </span>
        <IconChevron />
      </button>
      {open && (
        <div className="feedback-dropdown__menu" role="listbox">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={value === option.value}
              className="feedback-dropdown__option"
              onClick={() => {
                onChange(option.value)
                setOpen(false)
              }}
            >
              <span>{option.label}</span>
              {value === option.value && <IconCheck />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Failed to read screenshot'))
    reader.readAsDataURL(file)
  })
}

function collectImageFiles(list) {
  if (!list) return []
  return Array.from(list).filter((f) => f.type.startsWith('image/'))
}

export default function FeedbackButton() {
  const { user } = useAuth()
  const email = user?.email ?? ''
  const name = user?.name ?? ''
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [selectedToolkit, setSelectedToolkit] = useState(TOOLKIT_REGISTRY[0].slug)
  const [selectedModule, setSelectedModule] = useState('')
  const [description, setDescription] = useState('')
  const [screenshots, setScreenshots] = useState([])
  const [dragging, setDragging] = useState(false)
  const fileInputRef = useRef(null)

  const toolkitOptions = TOOLKIT_REGISTRY.map((t) => ({ value: t.slug, label: t.name }))
  const moduleOptions = MODULES.map((m) => ({ value: m, label: m }))

  useEffect(() => {
    if (!open) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = prevOverflow
    }
  }, [open])

  const appendScreenshots = useCallback((files) => {
    if (!files.length) return
    setScreenshots((prev) => [
      ...prev,
      ...files.map((file) => ({ file, preview: URL.createObjectURL(file) })),
    ])
  }, [])

  const resetForm = () => {
    setSelectedToolkit(TOOLKIT_REGISTRY[0].slug)
    setSelectedModule('')
    setDescription('')
    setFormError('')
    setScreenshots((prev) => {
      prev.forEach((s) => URL.revokeObjectURL(s.preview))
      return []
    })
  }

  const handleSubmit = async () => {
    if (!selectedToolkit || !selectedModule || !description.trim()) {
      setFormError('Please fill in all required fields')
      return
    }
    setIsSubmitting(true)
    setFormError('')
    try {
      const screenshotPayload =
        screenshots.length > 0
          ? await Promise.all(screenshots.map((s) => fileToDataUrl(s.file)))
          : []
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toolkit: selectedToolkit,
          module: selectedModule,
          description: description.trim(),
          screenshots: screenshotPayload,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Failed to submit feedback')
      resetForm()
      setOpen(false)
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Failed to submit feedback')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="feedback-fab"
        aria-label="Submit feedback"
        title="Submit feedback"
      >
        <IconMessage />
      </button>

      {open &&
        createPortal(
          <div className="feedback-portal">
            <div className="feedback-overlay" onClick={() => setOpen(false)} aria-hidden="true" />
            <aside className="feedback-panel" role="dialog" aria-modal="true" aria-labelledby="feedback-title">
              <header className="feedback-panel__header">
                <div>
                  <p className="feedback-panel__eyebrow">Feedback</p>
                  <h2 id="feedback-title" className="feedback-panel__title">
                    Report an issue
                  </h2>
                </div>
                <button type="button" className="feedback-panel__close" onClick={() => setOpen(false)} aria-label="Close feedback">
                  <IconX />
                </button>
              </header>

              <div className="feedback-panel__body">
                <div className="feedback-user-chip">
                  <div className="feedback-user-chip__avatar">{(name || email || '?').charAt(0).toUpperCase()}</div>
                  <div className="feedback-user-chip__info">
                    <span className="feedback-user-chip__label">Submitting as</span>
                    <span className="feedback-user-chip__name">{name || 'Unknown user'}</span>
                    {email && <span className="feedback-user-chip__email">{email}</span>}
                  </div>
                </div>

                <div className="feedback-field">
                  <label htmlFor="feedback-toolkit" className="feedback-field__label">
                    Toolkit <span className="feedback-field__required">*</span>
                  </label>
                  <Dropdown
                    id="feedback-toolkit"
                    value={selectedToolkit}
                    placeholder="Select a toolkit"
                    options={toolkitOptions}
                    onChange={(value) => {
                      setSelectedToolkit(value)
                      setSelectedModule('')
                    }}
                  />
                </div>

                <div className="feedback-field">
                  <label htmlFor="feedback-module" className="feedback-field__label">
                    Module <span className="feedback-field__required">*</span>
                  </label>
                  <Dropdown
                    id="feedback-module"
                    value={selectedModule}
                    placeholder={selectedToolkit ? 'Select a module' : 'Choose a toolkit first'}
                    options={moduleOptions}
                    onChange={setSelectedModule}
                    disabled={!selectedToolkit}
                  />
                </div>

                <div className="feedback-field">
                  <label htmlFor="feedback-description" className="feedback-field__label">
                    Describe the issue <span className="feedback-field__required">*</span>
                  </label>
                  <textarea
                    id="feedback-description"
                    className="feedback-textarea"
                    placeholder="What happened? Add steps to reproduce, expected vs. actual behaviour, and any other context."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={5}
                  />
                </div>

                <div className="feedback-field">
                  <span className="feedback-field__label">Screenshots</span>
                  <div
                    className="feedback-dropzone"
                    onPaste={(e) => {
                      const files = []
                      for (const item of Array.from(e.clipboardData.items)) {
                        if (!item.type.startsWith('image/')) continue
                        const blob = item.getAsFile()
                        if (blob) files.push(blob)
                      }
                      if (files.length) {
                        e.preventDefault()
                        appendScreenshots(files)
                      }
                    }}
                    onDragEnter={(e) => { e.preventDefault(); setDragging(true) }}
                    onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
                    onDragLeave={(e) => { e.preventDefault(); setDragging(false) }}
                    onDrop={(e) => {
                      e.preventDefault()
                      setDragging(false)
                      appendScreenshots(collectImageFiles(e.dataTransfer.files))
                    }}
                    tabIndex={0}
                    role="button"
                    data-drag={dragging}
                    onClick={() => fileInputRef.current?.click()}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        fileInputRef.current?.click()
                      }
                    }}
                  >
                    <IconImage />
                    <p className="feedback-dropzone__primary">
                      Paste, drop or <span className="feedback-dropzone__link">browse</span>
                    </p>
                    <p className="feedback-dropzone__hint">Cmd/Ctrl + V works too</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => {
                        appendScreenshots(collectImageFiles(e.target.files))
                        if (fileInputRef.current) fileInputRef.current.value = ''
                      }}
                      className="feedback-dropzone__input"
                    />
                  </div>

                  {screenshots.length > 0 && (
                    <ul className="feedback-screenshot-grid">
                      {screenshots.map((shot, index) => (
                        <li key={shot.preview} className="feedback-screenshot">
                          <img src={shot.preview} alt={`Screenshot ${index + 1}`} />
                          <button
                            type="button"
                            className="feedback-screenshot__remove"
                            onClick={() =>
                              setScreenshots((prev) => {
                                const removed = prev[index]
                                if (removed) URL.revokeObjectURL(removed.preview)
                                return prev.filter((_, i) => i !== index)
                              })
                            }
                            aria-label={`Remove screenshot ${index + 1}`}
                          >
                            <IconTrash />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              <footer className="feedback-panel__footer">
                {formError ? <p className="feedback-panel__error">{formError}</p> : <span />}
                <button
                  type="button"
                  className="feedback-button feedback-button--ghost"
                  onClick={() => { resetForm(); setOpen(false) }}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="feedback-button feedback-button--primary"
                  onClick={() => void handleSubmit()}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting…' : 'Submit feedback'}
                </button>
              </footer>
            </aside>
          </div>,
          document.body,
        )}
    </>
  )
}
