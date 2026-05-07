import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'

import Login from './pages/Login'
import Trips from './pages/student/Trips'
import MyBookings from './pages/student/MyBookings'
import TrackBus from './pages/student/TrackBus'
import Schedule from './pages/student/Schedule'
import Dashboard from './pages/admin/Dashboard'
import ManageBuses from './pages/admin/ManageBuses'
import AddTrip from './pages/admin/AddTrip'
import MyTrip from './pages/driver/MyTrip'
import GPSActive from './pages/driver/GPSActive'

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" />
  if (!allowedRoles.includes(user.role)) return <Navigate to="/login" />
  return children
}

const TripConfirmedNotification = () => {
  const { notification, setNotification } = useAuth()

  if (!notification) return null

  return (
    <div
      className="fade-in"
      style={{
        position: 'fixed',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 99999,
        backgroundColor: '#1e2d5a',
        color: 'white',
        padding: '16px 24px',
        borderRadius: '12px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        minWidth: '320px',
        maxWidth: '480px',
        borderLeft: '4px solid #2d7a4f'
      }}
    >
      <span style={{ fontSize: '24px' }}>🎉</span>
      <div style={{ flex: 1 }}>
        <p style={{ fontWeight: 'bold', fontSize: '14px', margin: 0 }}>
          Trip Confirmed!
        </p>
        <p style={{ fontSize: '12px', opacity: 0.85, margin: '4px 0 0' }}>
          {notification.message}
        </p>
      </div>
      <button
        onClick={() => setNotification(null)}
        style={{
          background: 'none',
          border: 'none',
          color: 'white',
          cursor: 'pointer',
          fontSize: '18px',
          opacity: 0.7,
          padding: '0 4px'
        }}
      >
        ✕
      </button>
    </div>
  )
}

const AppRoutes = () => {
  const { user } = useAuth()
  return (
    <>
      <TripConfirmedNotification />
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/trips" element={
          <ProtectedRoute allowedRoles={['student']}>
            <Trips />
          </ProtectedRoute>
        } />
        <Route path="/my-bookings" element={
          <ProtectedRoute allowedRoles={['student']}>
            <MyBookings />
          </ProtectedRoute>
        } />
        <Route path="/track/:tripId" element={
          <ProtectedRoute allowedRoles={['student', 'admin']}>
            <TrackBus />
          </ProtectedRoute>
        } />
        <Route path="/schedule" element={
          <ProtectedRoute allowedRoles={['student']}>
            <Schedule />
          </ProtectedRoute>
        } />

        <Route path="/dashboard" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/manage-buses" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <ManageBuses />
          </ProtectedRoute>
        } />
        <Route path="/add-trip" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AddTrip />
          </ProtectedRoute>
        } />

        <Route path="/my-trip" element={
          <ProtectedRoute allowedRoles={['driver']}>
            <MyTrip />
          </ProtectedRoute>
        } />
        <Route path="/gps-active" element={
          <ProtectedRoute allowedRoles={['driver']}>
            <GPSActive />
          </ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App