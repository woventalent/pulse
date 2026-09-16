import { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx'
import Sidebar from './components/Sidebar.jsx'
import Projects from './pages/Projects.jsx'
import Timesheets from './pages/Timesheets.jsx'
import Reports from './pages/Reports.jsx'
import Calendar from './pages/Calendar.jsx'
import Admin from './pages/Admin.jsx'
import Login from './pages/Login.jsx'
import WorkspaceSelect from './pages/WorkspaceSelect.jsx'
import FeedbackButton from './components/FeedbackButton.jsx'

function LoadingScreen() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#F8F7EF',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#0e0e10', marginBottom: 8 }}>Pulse</div>
        <div style={{ fontSize: 13, color: '#6c6c72' }}>Loading…</div>
      </div>
    </div>
  )
}

const PATH_BY_PAGE = {
  projects: '/projects', timesheets: '/timesheets', reports: '/reports',
  calendar: '/calendar', settings: '/settings',
}
const PAGE_BY_PATH = Object.fromEntries(Object.entries(PATH_BY_PAGE).map(([page, path]) => [path, page]))
function pageFromPath(pathname) { return PAGE_BY_PATH[pathname] || null }

function MainApp() {
  const [page, setPage] = useState(() => pageFromPath(window.location.pathname) || 'projects')

  useEffect(() => {
    if (!pageFromPath(window.location.pathname)) window.history.replaceState({}, '', '/projects')
  }, [])

  useEffect(() => {
    function onPopState() {
      const p = pageFromPath(window.location.pathname)
      setPage(p || 'projects')
      if (!p) window.history.replaceState({}, '', '/projects')
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  function goTo(p) {
    setPage(p)
    const path = PATH_BY_PAGE[p] || '/projects'
    if (window.location.pathname !== path) window.history.pushState({}, '', path)
  }

  function handleNav(p) {
    goTo(p)
  }

  const pages = {
    projects:   <Projects />,
    timesheets: <Timesheets />,
    reports:    <Reports />,
    calendar:   <Calendar />,
    settings:   <Admin />,
  }

  return (
    <div className="app-shell">
      <Sidebar current={page} onNav={handleNav} />
      <main className="app-main">
        {pages[page]}
      </main>
      <FeedbackButton />
    </div>
  )
}

function AppContent() {
  const { user, workspace } = useAuth()

  // Check URL for login error to pass to Login page
  const params = new URLSearchParams(window.location.search)
  const loginError = params.get('login-error')

  if (user === undefined) return <LoadingScreen />
  if (!user) return <Login errorMsg={loginError} />
  if (!workspace) return <WorkspaceSelect />
  return <MainApp />
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
