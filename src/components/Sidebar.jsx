import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../contexts/AuthContext.jsx'
import Modal from './Modal.jsx'
import PulseLogo from './PulseLogo.jsx'

const NAV = [
  { id: 'projects',   label: 'Projects',   Icon: FolderIcon },
  { id: 'timesheets', label: 'Timesheets', Icon: ClockIcon },
  { id: 'reports',    label: 'Reports',    Icon: ChartIcon },
  { id: 'calendar',   label: 'Calendar',   Icon: CalendarIcon },
]

function initialsFromName(name) {
  const parts = (name || '').split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return (name?.charAt(0) || '?').toUpperCase()
}

export default function Sidebar({ current, onNav }) {
  const { user, workspace, logout, selectWorkspace } = useAuth()
  const navRef = useRef(null)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showWsMenu, setShowWsMenu] = useState(false)
  const [workspaces, setWorkspaces] = useState([])
  const [showNewWs, setShowNewWs] = useState(false)
  const [newWsForm, setNewWsForm] = useState({ name: '', code_prefix: '' })
  const [newWsError, setNewWsError] = useState('')
  const [creatingWs, setCreatingWs] = useState(false)

  useEffect(() => {
    if (!showUserMenu && !showWsMenu) return
    function onPointerDown(e) {
      if (navRef.current?.contains(e.target)) return
      setShowUserMenu(false)
      setShowWsMenu(false)
    }
    function onKeyDown(e) {
      if (e.key === 'Escape') {
        setShowUserMenu(false)
        setShowWsMenu(false)
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [showUserMenu, showWsMenu])

  function nav(p) {
    onNav(p)
  }

  async function openWsSwitcher() {
    if (!showWsMenu) {
      const r = await fetch('/api/auth/workspaces')
      const ws = await r.json()
      setWorkspaces(ws)
    }
    setShowWsMenu(v => !v)
    setShowUserMenu(false)
  }

  async function switchWs(id) {
    setShowWsMenu(false)
    await selectWorkspace(id)
  }

  function openNewWs() {
    setShowWsMenu(false)
    setNewWsForm({ name: '', code_prefix: '' })
    setNewWsError('')
    setShowNewWs(true)
  }

  async function createWs(e) {
    e.preventDefault()
    setNewWsError(''); setCreatingWs(true)
    try {
      const r = await fetch('/api/admin/workspaces', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newWsForm),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error)
      setShowNewWs(false)
      await selectWorkspace(d.id)
    } catch (err) { setNewWsError(err.message) }
    finally { setCreatingWs(false) }
  }

  return (
    <>
      <nav className="app-nav" ref={navRef} aria-label="Primary">
        <div className="app-nav__brand">
          <PulseLogo size="nav" theme="light" />
        </div>

        <div className={`app-nav__workspace${showWsMenu ? ' app-nav__workspace--open' : ''}`}>
          <button
            type="button"
            className="app-nav__workspace-trigger"
            onClick={openWsSwitcher}
            aria-expanded={showWsMenu}
            aria-haspopup="menu"
          >
            <span className="app-nav__workspace-name">{workspace?.name || 'Pulse'}</span>
            <ChevronIcon size={16} className="app-nav__workspace-chevron" />
          </button>
          {showWsMenu && (
            <div className="app-nav__menu" role="menu" aria-label="Workspaces">
              {workspaces.map(ws => (
                <button
                  key={ws.id}
                  type="button"
                  role="menuitem"
                  className={`app-nav__menu-item${ws.id === workspace?.id ? ' is-active' : ''}`}
                  onClick={() => switchWs(ws.id)}
                >
                  <span className="app-nav__menu-ws">{ws.name.charAt(0)}</span>
                  {ws.name}
                  {ws.id === workspace?.id && <span style={{ marginLeft: 'auto', fontSize: 11 }}>✓</span>}
                </button>
              ))}
              <div className="app-nav__menu-divider" />
              <button type="button" className="app-nav__menu-item app-nav__menu-item--accent" onClick={openNewWs}>
                + Create workspace
              </button>
            </div>
          )}
        </div>

        <div className="app-nav__links">
          {NAV.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              className={`app-nav__link${current === id ? ' is-active' : ''}`}
              onClick={() => nav(id)}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </div>

        <div className="app-nav__user">
          <div className={`app-nav__profile${showUserMenu ? ' app-nav__profile--open' : ''}${current === 'settings' ? ' app-nav__profile--active' : ''}`}>
            <button
              type="button"
              className="app-nav__profile-trigger"
              onClick={() => { setShowUserMenu(v => !v); setShowWsMenu(false) }}
              aria-expanded={showUserMenu}
            >
              <span className="app-nav__avatar" aria-hidden="true">
                {initialsFromName(user?.name)}
              </span>
              <span className="app-nav__name">
                <strong>{user?.name || 'Unknown'}</strong>
                <span>{user?.email || ''}</span>
              </span>
              <ChevronIcon size={14} className="app-nav__profile-chevron" />
            </button>
            {showUserMenu && (
              <div className="app-nav__menu" role="menu" aria-label="Account">
                <button
                  type="button"
                  role="menuitem"
                  className={`app-nav__menu-item${current === 'settings' ? ' is-active' : ''}`}
                  onClick={() => { setShowUserMenu(false); nav('settings') }}
                >
                  <GearIcon size={15} />
                  Settings
                </button>
                <div className="app-nav__menu-divider" />
                <button
                  type="button"
                  role="menuitem"
                  className="app-nav__menu-item app-nav__menu-item--danger"
                  onClick={async () => { setShowUserMenu(false); await logout() }}
                >
                  <SignOutIcon size={15} />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {showNewWs && (
        <Modal title="New Workspace" onClose={() => setShowNewWs(false)} width={380}>
          <form onSubmit={createWs}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Workspace Name</label>
            <input
              value={newWsForm.name} onChange={e => setNewWsForm({ ...newWsForm, name: e.target.value })}
              placeholder="e.g. Research & Insights" required autoFocus
              style={{ width: '100%', padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: 14, marginBottom: 14 }}
            />
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Project Code Prefix</label>
            <input
              value={newWsForm.code_prefix}
              onChange={e => setNewWsForm({ ...newWsForm, code_prefix: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') })}
              placeholder="e.g. WRI, MKT, FIN" maxLength={6} required
              style={{ width: '100%', padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: 14 }}
            />
            <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>2–6 uppercase letters. Projects will be numbered e.g. {newWsForm.code_prefix || 'WRI'}-001.</p>
            {newWsError && <div style={{ color: '#ef4444', fontSize: 13, marginBottom: 12, padding: '8px 12px', background: '#fef2f2', borderRadius: 6 }}>{newWsError}</div>}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 14 }}>
              <button type="button" onClick={() => setShowNewWs(false)} style={{ padding: '9px 16px', border: '1px solid #e2e8f0', background: '#fff', borderRadius: 7, fontSize: 13.5, cursor: 'pointer' }}>Cancel</button>
              <button type="submit" disabled={creatingWs} style={{ padding: '9px 18px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 7, fontSize: 13.5, fontWeight: 600, cursor: 'pointer' }}>
                {creatingWs ? 'Creating…' : 'Create Workspace'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  )
}

function iconProps(size, extra = {}) {
  return {
    className: extra.className ? `app-nav__icon ${extra.className}` : 'app-nav__icon',
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  }
}

function FolderIcon({ size }) {
  return (
    <svg {...iconProps(size)}>
      <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
    </svg>
  )
}
function ClockIcon({ size }) {
  return (
    <svg {...iconProps(size)}>
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  )
}
function CalendarIcon({ size }) {
  return (
    <svg {...iconProps(size)}>
      <rect x="3" y="4" width="18" height="18" rx="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  )
}
function ChartIcon({ size }) {
  return (
    <svg {...iconProps(size)}>
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6"  y1="20" x2="6"  y2="14"/>
      <line x1="2"  y1="20" x2="22" y2="20"/>
    </svg>
  )
}
function GearIcon({ size }) {
  return (
    <svg {...iconProps(size)}>
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
    </svg>
  )
}
function SignOutIcon({ size }) {
  return (
    <svg {...iconProps(size)}>
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  )
}
function ChevronIcon({ size, className }) {
  return (
    <svg {...iconProps(size, { className })}>
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  )
}
