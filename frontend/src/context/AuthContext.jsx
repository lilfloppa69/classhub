import { createContext, useContext, useEffect, useState } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isAuthLoading, setIsAuthLoading] = useState(true)

  const fetchMe = async () => {
    try {
      const res = await api.get('/auth/me')
      setUser(res.data?.data || null)
      return res.data?.data || null
    } catch (error) {
      setUser(null)
      return null
    }
  }

  const login = async (token) => {
    localStorage.setItem('token', token)
    const me = await fetchMe()
    return me
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
  }

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token')

      if (!token) {
        setIsAuthLoading(false)
        return
      }

      await fetchMe()
      setIsAuthLoading(false)
    }

    initAuth()
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        login,
        logout,
        fetchMe,
        isAuthLoading,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
