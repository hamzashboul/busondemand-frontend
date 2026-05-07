import { createContext, useContext, useState, useEffect, useRef } from 'react'
import io from 'socket.io-client'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('token')
    const role = localStorage.getItem('role')
    const name = localStorage.getItem('name')
    const id = localStorage.getItem('id')
    return token ? { token, role, name, id } : null
  })

  const [notification, setNotification] = useState(null)
  const socketRef = useRef(null)

  useEffect(() => {
    if (user && user.role === 'student') {
socketRef.current = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000')
      socketRef.current.on('connect', () => {
        socketRef.current.emit('join_student', user.id)
      })

      socketRef.current.on('trip_confirmed', (data) => {
        setNotification({
          message: data.message,
          trip_id: data.trip_id,
          area: data.area
        })

        // Auto hide after 6 seconds
        setTimeout(() => setNotification(null), 6000)
      })

      return () => {
        socketRef.current?.disconnect()
      }
    }
  }, [user])

  const login = (userData) => {
    localStorage.setItem('token', userData.token)
    localStorage.setItem('role', userData.role)
    localStorage.setItem('name', userData.name)
    localStorage.setItem('id', userData.id)
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    localStorage.removeItem('name')
    localStorage.removeItem('id')
    socketRef.current?.disconnect()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, notification, setNotification }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)