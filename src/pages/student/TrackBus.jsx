import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { useTranslation } from 'react-i18next'
import { useLanguage } from '../../context/LanguageContext'
import io from 'socket.io-client'
import api from '../../api'
import L from 'leaflet'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const TrackBus = () => {
  const [location, setLocation] = useState(null)
  const [tripInfo, setTripInfo] = useState(null)
  const [connected, setConnected] = useState(false)
  const socketRef = useRef(null)
  const { tripId } = useParams()
  const { user, logout } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const { t } = useTranslation()
  const { isArabic, toggleLanguage } = useLanguage()
  const navigate = useNavigate()

  useEffect(() => {
    fetchTripInfo()
    connectSocket()
    return () => {
      socketRef.current?.disconnect()
    }
  }, [])

  const fetchTripInfo = async () => {
    try {
      const response = await api.get('/trips')
      const trip = response.data.find(t => t.id === parseInt(tripId))
      setTripInfo(trip)
      const locationRes = await api.get(`/trips/${tripId}/location`)
      setLocation({
        lat: locationRes.data.latitude,
        lng: locationRes.data.longitude
      })
    } catch (error) {
      console.error('Failed to fetch trip info:', error)
    }
  }

  const connectSocket = () => {
    socketRef.current = io('http://localhost:3000')
    socketRef.current.on('connect', () => {
      setConnected(true)
      socketRef.current.emit('join_trip', tripId)
    })
    socketRef.current.on('bus_location', (data) => {
      setLocation({ lat: data.latitude, lng: data.longitude })
    })
    socketRef.current.on('disconnect', () => {
      setConnected(false)
    })
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: isDark ? '#0f1117' : '#f5f5f5' }}>

      {/* Navbar */}
      <nav className="shadow px-6 py-3 flex justify-between items-center"
        style={{ backgroundColor: isDark ? '#0d1021' : '#1e2d5a' }}>
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="IU" className="h-10 w-10 object-contain" />
          <div>
            <h1 className="text-white font-bold text-base leading-tight">{t('appName')}</h1>
            <p className="text-blue-200 text-xs">{t('university')}</p>
          </div>
        </div>
        <div className="flex gap-4 items-center">
          <span className="text-blue-200 text-sm">Hi, {user?.name}</span>
          <button
            onClick={() => navigate('/trips')}
            className="text-sm text-white border px-3 py-1 rounded-lg hover:bg-white hover:text-blue-900 transition"
            style={{ borderColor: 'rgba(255,255,255,0.4)' }}
          >
            {t('trips')}
          </button>
          <button
  onClick={() => navigate('/schedule')}
  className="text-sm text-white border px-3 py-1 rounded-lg hover:bg-white hover:text-blue-900 transition"
  style={{ borderColor: 'rgba(255,255,255,0.4)' }}
>
  📅 {t('schedule')}
</button>
          <button
            onClick={toggleTheme}
            className="text-sm px-3 py-1 rounded-lg transition btn-press"
            style={{
              backgroundColor: isDark ? '#f5f5f5' : 'rgba(255,255,255,0.15)',
              color: isDark ? '#1e2d5a' : 'white'
            }}
          >
            {isDark ? '☀️' : '🌙'}
          </button>
          <button
            onClick={toggleLanguage}
            className="text-sm px-3 py-1 rounded-lg transition btn-press font-medium"
            style={{
              backgroundColor: isArabic ? '#f5f5f5' : 'rgba(255,255,255,0.15)',
              color: isArabic ? '#1e2d5a' : 'white'
            }}
          >
            {isArabic ? 'EN' : 'ع'}
          </button>
          <button
            onClick={handleLogout}
            className="text-sm px-3 py-1 rounded-lg text-white hover:opacity-90 transition btn-press"
            style={{ backgroundColor: '#8B1A2B' }}
          >
            {t('logout')}
          </button>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto py-6 px-4">

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold" style={{ color: isDark ? '#ffffff' : '#1e2d5a' }}>
            {t('trackBusTitle')}
          </h2>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 pulse' : 'bg-gray-400'}`} />
            <span className="text-xs" style={{ color: isDark ? '#a0aec0' : '#6b7280' }}>
              {connected ? t('live') : t('connecting')}
            </span>
          </div>
        </div>

        {tripInfo && (
          <div className="rounded-xl shadow-sm p-4 mb-4 border-l-4"
            style={{
              backgroundColor: isDark ? '#1a1d27' : 'white',
              borderLeftColor: '#1e2d5a'
            }}>
            <h3 className="font-semibold mb-1" style={{ color: isDark ? '#ffffff' : '#1a202c' }}>
              {tripInfo.direction === 'from_university'
                ? `${t('israTo')} ${tripInfo.area}`
                : `${tripInfo.area} ${t('toIsra')}`}
            </h3>
            <p className="text-sm" style={{ color: isDark ? '#a0aec0' : '#6b7280' }}>
              Bus {tripInfo.bus_number} · {new Date(tripInfo.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {tripInfo.booked_seats}/{tripInfo.capacity} seats
            </p>
          </div>
        )}

        <div className="rounded-xl shadow-sm overflow-hidden mb-4 border-t-4"
          style={{
            backgroundColor: isDark ? '#1a1d27' : 'white',
            borderTopColor: '#1e2d5a'
          }}>
          {location ? (
            <MapContainer
              center={[location.lat, location.lng]}
              zoom={15}
              style={{ height: '350px', width: '100%' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap contributors'
              />
              <Marker position={[location.lat, location.lng]}>
                <Popup>Bus is here</Popup>
              </Marker>
            </MapContainer>
          ) : (
            <div className="h-64 flex items-center justify-center"
              style={{ backgroundColor: isDark ? '#0f1117' : '#f9fafb' }}>
              <p className="text-sm" style={{ color: isDark ? '#a0aec0' : '#6b7280' }}>
                {t('waitingLocation')}
              </p>
            </div>
          )}
        </div>

        {location && (
          <div className="rounded-xl shadow-sm p-4"
            style={{ backgroundColor: isDark ? '#1a1d27' : 'white' }}>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-xs mb-1" style={{ color: isDark ? '#a0aec0' : '#6b7280' }}>
                  {t('latitude')}
                </div>
                <div className="font-semibold" style={{ color: '#1e2d5a' }}>
                  {location.lat.toFixed(5)}
                </div>
              </div>
              <div>
                <div className="text-xs mb-1" style={{ color: isDark ? '#a0aec0' : '#6b7280' }}>
                  {t('longitude')}
                </div>
                <div className="font-semibold" style={{ color: '#1e2d5a' }}>
                  {location.lng.toFixed(5)}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

export default TrackBus