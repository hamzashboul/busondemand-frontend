import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { useTranslation } from 'react-i18next'
import { useLanguage } from '../../context/LanguageContext'
import api from '../../api'
import Toast from '../../components/Toast'

const Trips = () => {
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [bookingId, setBookingId] = useState(null)
  const [toast, setToast] = useState(null)
  const [filter, setFilter] = useState('all')
  const [animating, setAnimating] = useState(false)
  const [now, setNow] = useState(new Date())
  const [menuOpen, setMenuOpen] = useState(false)

  const { user, logout } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const { t } = useTranslation()
  const { isArabic, toggleLanguage } = useLanguage()
  const navigate = useNavigate()

  useEffect(() => {
    fetchTrips()
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date())
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  const fetchTrips = async () => {
    try {
      const response = await api.get('/trips')
      setTrips(response.data)
    } catch (error) {
      console.error('Failed to fetch trips:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBook = async (tripId) => {
    setBookingId(tripId)
    try {
      await api.post('/bookings', { trip_id: tripId })
      setToast({ message: t('bookingSuccess'), type: 'success' })
      fetchTrips()
    } catch (error) {
      setToast({ message: error.response?.data?.message || t('bookingFailed'), type: 'error' })
    } finally {
      setBookingId(null)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleFilterChange = (key) => {
    if (key === filter) return
    setAnimating(true)
    setTimeout(() => {
      setFilter(key)
      setAnimating(false)
    }, 200)
  }

  const getFillColor = (booked, capacity) => {
    const percent = (booked / capacity) * 100
    if (percent >= 100) return 'bg-red-500'
    if (percent >= 50) return 'bg-yellow-500'
    return 'bg-red-800'
  }

  const getCountdown = (departureTime) => {
    const departure = new Date(departureTime)
    const diff = departure - now
    if (diff <= 0) return null
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    if (hours > 24) {
      const days = Math.floor(hours / 24)
      return `${days}d ${hours % 24}h`
    }
    if (hours > 0) return `${hours}h ${minutes}m`
    if (minutes > 0) return `${minutes}m`
    return t('startingSoon')
  }

  const filteredTrips = trips.filter(trip => {
    if (filter === 'all') return true
    if (filter === 'from') return trip.direction === 'from_university'
    if (filter === 'to') return trip.direction === 'to_university'
    if (filter === 'confirmed') return trip.status === 'confirmed'
    return true
  })

  const filters = [
    { key: 'all', label: t('filterAll') },
    { key: 'from', label: t('filterFrom') },
    { key: 'to', label: t('filterTo') },
    { key: 'confirmed', label: t('filterConfirmed') },
  ]

  if (loading) return (
    <div className="min-h-screen" style={{ backgroundColor: isDark ? '#0f1117' : '#f5f5f5' }}>
      <nav className="shadow px-6 py-3" style={{ backgroundColor: isDark ? '#0d1021' : '#1e2d5a' }}>
        <div className="skeleton h-10 w-40 opacity-30" />
      </nav>
      <div className="max-w-2xl mx-auto py-8 px-4">
        <div className="skeleton skeleton-title w-40 mb-6" />
        <div className="flex gap-2 mb-5">
          {[1,2,3,4].map(i => (
            <div key={i} className="skeleton h-8 w-24 rounded-full" />
          ))}
        </div>
        {[1,2,3].map(i => (
          <div key={i} className="rounded-xl p-5 mb-4 border-l-4"
            style={{ backgroundColor: isDark ? '#1a1d27' : 'white', borderLeftColor: '#e0e0e0' }}>
            <div className="flex justify-between mb-3">
              <div className="flex-1">
                <div className="skeleton skeleton-title w-3/4" />
                <div className="skeleton skeleton-text w-1/2" />
              </div>
              <div className="skeleton skeleton-badge ml-3" />
            </div>
            <div className="skeleton h-2 w-full rounded-full mb-3" />
            <div className="flex gap-2">
              <div className="skeleton skeleton-btn flex-1" />
              <div className="skeleton skeleton-btn flex-1" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen" style={{ backgroundColor: isDark ? '#0f1117' : '#f5f5f5' }}>

      {/* Navbar */}
      <nav className="shadow px-4 md:px-6 py-3 relative"
        style={{ backgroundColor: isDark ? '#0d1021' : '#1e2d5a' }}>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="IU" className="h-10 w-10 object-contain" />
            <div>
              <h1 className="text-white font-bold text-base leading-tight">{t('appName')}</h1>
              <p className="text-blue-200 text-xs">{t('university')}</p>
            </div>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex gap-4 items-center">
            <span className="text-blue-200 text-sm">Hi, {user?.name}</span>
            <button
              onClick={() => navigate('/my-bookings')}
              className="text-sm text-white border px-3 py-1 rounded-lg hover:bg-white hover:text-blue-900 transition"
              style={{ borderColor: 'rgba(255,255,255,0.4)' }}
            >
              {t('myBookings')}
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

          {/* Hamburger Button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden flex flex-col gap-1.5 p-2"
          >
            <span className="block w-6 h-0.5 bg-white transition-all" />
            <span className="block w-6 h-0.5 bg-white transition-all" />
            <span className="block w-6 h-0.5 bg-white transition-all" />
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden flex flex-col gap-2 pt-4 pb-2 fade-in"
            style={{ borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: '12px' }}>
            <span className="text-blue-200 text-sm">Hi, {user?.name}</span>
            <button
              onClick={() => { navigate('/my-bookings'); setMenuOpen(false) }}
              className="text-sm text-white border px-3 py-2 rounded-lg text-left hover:bg-white hover:text-blue-900 transition"
              style={{ borderColor: 'rgba(255,255,255,0.4)' }}
            >
              {t('myBookings')}
            </button>
            <button
              onClick={() => { navigate('/schedule'); setMenuOpen(false) }}
              className="text-sm text-white border px-3 py-2 rounded-lg text-left hover:bg-white hover:text-blue-900 transition"
              style={{ borderColor: 'rgba(255,255,255,0.4)' }}
            >
              📅 {t('schedule')}
            </button>
            <div className="flex gap-2">
              <button
                onClick={toggleTheme}
                className="flex-1 text-sm px-3 py-2 rounded-lg transition btn-press"
                style={{
                  backgroundColor: isDark ? '#f5f5f5' : 'rgba(255,255,255,0.15)',
                  color: isDark ? '#1e2d5a' : 'white'
                }}
              >
                {isDark ? '☀️ Light' : '🌙 Dark'}
              </button>
              <button
                onClick={toggleLanguage}
                className="flex-1 text-sm px-3 py-2 rounded-lg transition btn-press font-medium"
                style={{
                  backgroundColor: isArabic ? '#f5f5f5' : 'rgba(255,255,255,0.15)',
                  color: isArabic ? '#1e2d5a' : 'white'
                }}
              >
                {isArabic ? 'EN' : 'ع'}
              </button>
            </div>
            <button
              onClick={handleLogout}
              className="text-sm px-3 py-2 rounded-lg text-white hover:opacity-90 transition btn-press text-left"
              style={{ backgroundColor: '#8B1A2B' }}
            >
              {t('logout')}
            </button>
          </div>
        )}
      </nav>

      <div className="max-w-2xl mx-auto py-6 px-4">

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold" style={{ color: isDark ? '#ffffff' : '#1e2d5a' }}>
            {t('availableTrips')}
            <span className="ml-2 text-sm font-normal text-gray-400">
              ({filteredTrips.length})
            </span>
          </h2>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          {filters.map(f => (
            <button
              key={f.key}
              onClick={() => handleFilterChange(f.key)}
              className="px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition btn-press"
              style={filter === f.key ? {
                backgroundColor: '#1e2d5a',
                color: 'white'
              } : {
                backgroundColor: isDark ? '#1a1d27' : 'white',
                color: isDark ? '#a0aec0' : '#1e2d5a',
                border: `1.5px solid ${isDark ? '#2d3748' : '#1e2d5a'}`
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {filteredTrips.length === 0 ? (
          <div className="text-center py-12 fade-in">
            <p className="text-gray-500">{t('noTrips')}</p>
          </div>
        ) : (
          filteredTrips.map((trip, index) => (
            <div
              key={trip.id}
              className={`rounded-xl shadow-sm p-4 mb-4 border-l-4 card-hover ${
                animating ? 'opacity-0' : 'fade-in-delay-' + Math.min(index + 1, 5)
              }`}
              style={{
                backgroundColor: isDark ? '#1a1d27' : 'white',
                borderLeftColor: '#1e2d5a',
                transition: 'opacity 0.2s ease'
              }}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1 mr-2">
                  <h3 className="font-semibold text-sm" style={{ color: isDark ? '#ffffff' : '#1a202c' }}>
                    {trip.direction === 'from_university'
                      ? `${t('israTo')} ${trip.area}`
                      : `${trip.area} ${t('toIsra')}`}
                  </h3>
                  <p className="text-xs mt-1" style={{ color: isDark ? '#a0aec0' : '#6b7280' }}>
                    Bus {trip.bus_number} · {new Date(trip.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  {getCountdown(trip.departure_time) && (
                    <p className="text-xs font-medium mt-1" style={{ color: '#8B1A2B' }}>
                      ⏱️ {t('startsIn')} {getCountdown(trip.departure_time)}
                    </p>
                  )}
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full flex-shrink-0 ${
                  trip.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                  trip.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                  trip.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {t(trip.status)}
                </span>
              </div>

              <div className="mb-3">
                <div className="flex justify-between text-xs mb-1"
                  style={{ color: isDark ? '#a0aec0' : '#6b7280' }}>
                  <span>{t('seats')}</span>
                  <span>{trip.booked_seats}/{trip.capacity}</span>
                </div>
                <div className="w-full rounded-full h-2"
                  style={{ backgroundColor: isDark ? '#2d3748' : '#e5e7eb' }}>
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${getFillColor(trip.booked_seats, trip.capacity)}`}
                    style={{ width: `${Math.min((trip.booked_seats / trip.capacity) * 100, 100)}%` }}
                  />
                </div>
              </div>

              {trip.status !== 'cancelled' && trip.status !== 'completed' && (
                <div className="flex gap-2">
                  {trip.direction === 'from_university' && (
                    <button
                      onClick={() => handleBook(trip.id)}
                      disabled={bookingId === trip.id || trip.booked_seats >= trip.capacity}
                      className="flex-1 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50 hover:opacity-90 transition btn-press"
                      style={{ backgroundColor: '#8B1A2B' }}
                    >
                      {bookingId === trip.id ? t('booking') : trip.booked_seats >= trip.capacity ? t('full') : t('bookSeat')}
                    </button>
                  )}
                  <button
                    onClick={() => navigate(`/track/${trip.id}`)}
                    className={`${trip.direction === 'from_university' ? 'flex-1' : 'w-full'} py-2 rounded-lg text-sm font-medium hover:opacity-90 transition text-white btn-press`}
                    style={{ backgroundColor: '#1e2d5a' }}
                  >
                    {t('trackBus')}
                  </button>
                </div>
              )}

              {trip.status === 'completed' && (
                <div className="w-full text-center py-2 rounded-lg text-sm font-medium bg-blue-50 text-blue-600">
                  ✅ {t('completed')}
                </div>
              )}

            </div>
          ))
        )}
      </div>

      {/* Contact Section */}
      <div className="max-w-2xl mx-auto px-4 pb-8">
        <div className="rounded-xl shadow-sm p-5 border-t-4 fade-in"
          style={{
            backgroundColor: isDark ? '#1a1d27' : 'white',
            borderTopColor: '#8B1A2B'
          }}>
          <h3 className="font-semibold mb-3 flex items-center gap-2"
            style={{ color: isDark ? '#ffffff' : '#1e2d5a' }}>
            {t('contactOffice')}
          </h3>
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-sm"
              style={{ color: isDark ? '#a0aec0' : '#4b5563' }}>
              <span>📱</span>
              <a href="tel:0798872267" className="font-medium hover:opacity-80"
                style={{ color: '#8B1A2B' }}>
                0798872267
              </a>
            </div>
            <div className="flex items-center gap-3 text-sm"
              style={{ color: isDark ? '#a0aec0' : '#4b5563' }}>
              <span>📱</span>
              <a href="tel:0775443500" className="font-medium hover:opacity-80"
                style={{ color: '#8B1A2B' }}>
                0775443500
              </a>
            </div>
            <p className="text-xs text-gray-400 mt-2">{t('workingHours')}</p>
          </div>
        </div>
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

export default Trips