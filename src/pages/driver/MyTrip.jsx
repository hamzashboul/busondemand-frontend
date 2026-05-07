import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { useTranslation } from 'react-i18next'
import { useLanguage } from '../../context/LanguageContext'
import api from '../../api'
import Toast from '../../components/Toast'

const MyTrip = () => {
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const { user, logout } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const { t } = useTranslation()
  const { isArabic, toggleLanguage } = useLanguage()
  const navigate = useNavigate()

  useEffect(() => {
    fetchTrips()
  }, [])

  const fetchTrips = async () => {
    try {
      const response = await api.get('/trips')
      const activeTrips = response.data.filter(t => t.status !== 'cancelled')
      setTrips(activeTrips)
    } catch (error) {
      console.error('Failed to fetch trips:', error)
      setToast({ message: 'Failed to load trips', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: isDark ? '#0f1117' : '#f5f5f5' }}>
      <p className="text-gray-500">Loading...</p>
    </div>
  )

  return (
    <div className="min-h-screen" style={{ backgroundColor: isDark ? '#0f1117' : '#f5f5f5' }}>

      {/* Navbar */}
      <nav className="shadow px-6 py-3 flex justify-between items-center"
        style={{ backgroundColor: isDark ? '#0d1021' : '#1e2d5a' }}>
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="IU" className="h-10 w-10 object-contain" />
          <div>
            <h1 className="text-white font-bold text-base leading-tight">{t('appName')}</h1>
            <p className="text-blue-200 text-xs">{t('university')} — {t('driver')}</p>
          </div>
        </div>
        <div className="flex gap-4 items-center">
          <span className="text-blue-200 text-sm">Hi, {user?.name}</span>
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

      <div className="max-w-lg mx-auto py-8 px-4">
        <h2 className="text-lg font-semibold mb-4"
          style={{ color: isDark ? '#ffffff' : '#1e2d5a' }}>
          {t('myTrips')}
        </h2>

        {trips.length === 0 ? (
          <div className="rounded-xl shadow-sm p-8 text-center fade-in"
            style={{ backgroundColor: isDark ? '#1a1d27' : 'white' }}>
            <p className="text-gray-500">{t('noTripsAssigned')}</p>
          </div>
        ) : (
          trips.map((trip, index) => (
            <div
              key={trip.id}
              className={`rounded-xl shadow-sm p-5 mb-4 border-l-4 card-hover fade-in-delay-${Math.min(index + 1, 5)}`}
              style={{
                backgroundColor: isDark ? '#1a1d27' : 'white',
                borderLeftColor: '#1e2d5a'
              }}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold"
                    style={{ color: isDark ? '#ffffff' : '#1a202c' }}>
                    {trip.direction === 'from_university'
                      ? `${t('israTo')} ${trip.area}`
                      : `${trip.area} ${t('toIsra')}`}
                  </h3>
                  <p className="text-sm mt-1"
                    style={{ color: isDark ? '#a0aec0' : '#6b7280' }}>
                    Bus {trip.bus_number} · {new Date(trip.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  trip.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                  trip.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {t(trip.status)}
                </span>
              </div>

              <div className="flex justify-between text-sm mb-4 rounded-lg p-3"
                style={{ backgroundColor: isDark ? '#0f1117' : '#f0f3fa' }}>
                <div className="text-center">
                  <div className="font-bold text-lg" style={{ color: '#1e2d5a' }}>
                    {trip.booked_seats}
                  </div>
                  <div className="text-xs" style={{ color: isDark ? '#a0aec0' : '#6b7280' }}>
                    {t('booked')}
                  </div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-lg" style={{ color: '#1e2d5a' }}>
                    {trip.capacity}
                  </div>
                  <div className="text-xs" style={{ color: isDark ? '#a0aec0' : '#6b7280' }}>
                    {t('capacity')}
                  </div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-lg text-green-600">
                    {trip.capacity - trip.booked_seats}
                  </div>
                  <div className="text-xs" style={{ color: isDark ? '#a0aec0' : '#6b7280' }}>
                    {t('available')}
                  </div>
                </div>
              </div>

              {trip.status !== 'completed' && (
                <button
                 onClick={() => navigate(`/gps-active?trip_id=${trip.id}&driver_id=${user?.id}&area=${trip.area}&direction=${trip.direction}`)}
                  className="w-full text-white py-2 rounded-lg text-sm font-medium hover:opacity-90 transition btn-press"
                  style={{ backgroundColor: '#8B1A2B' }}
                >
                  {t('startTrip')}
                </button>
              )}

              {trip.status === 'completed' && (
                <div className="w-full text-center py-2 rounded-lg text-sm font-medium bg-blue-50 text-blue-600">
                  {t('tripCompleted')}
                </div>
              )}

            </div>
          ))
        )}
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

    </div>
  )
}

export default MyTrip