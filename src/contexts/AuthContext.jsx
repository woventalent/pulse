import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const AuthContext = createContext(null)

const bypassSSO =
  import.meta.env.DEV && import.meta.env.VITE_BYPASS_SSO === 'true'

export function AuthProvider({ children }) {
  const [user,      setUser]      = useState(undefined) // undefined = loading
  const [workspace, setWorkspace] = useState(null)
  const [msAuth,    setMsAuth]    = useState(false)

  const refresh = useCallback(async () => {
    const [meRes, cfgRes] = await Promise.all([
      fetch('/api/auth/me'),
      fetch('/api/config'),
    ])
    let me  = await meRes.json()
    const cfg = await cfgRes.json()

    setMsAuth(cfg.msAuthEnabled)

    if (bypassSSO && !me) {
      await fetch('/auth/dev-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: (import.meta.env.VITE_FORCE_LOGIN_EMAIL || 'dev@local').toLowerCase(),
          name: import.meta.env.VITE_FORCE_LOGIN_NAME || 'Dev User',
        }),
      })
      me = await (await fetch('/api/auth/me')).json()
    }

    if (!me) {
      setUser(null)
      setWorkspace(null)
    } else {
      setUser({ id: me.userId, name: me.userName, email: me.userEmail, role: me.role, globalRole: me.globalRole })
      setWorkspace(me.workspaceId
        ? { id: me.workspaceId, name: me.workspaceName, slug: me.workspaceSlug }
        : null
      )
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  async function logout() {
    if (bypassSSO) {
      alert('SSO is bypassed locally. Cannot logout.')
      return
    }
    await fetch('/auth/logout', { method: 'POST' })
    setUser(null)
    setWorkspace(null)
  }

  async function selectWorkspace(workspaceId) {
    await fetch('/api/auth/select-workspace', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspaceId }),
    })
    await refresh()
  }

  return (
    <AuthContext.Provider value={{ user, workspace, msAuth, bypassSSO, refresh, logout, selectWorkspace }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
