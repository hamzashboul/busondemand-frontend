import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { useTranslation } from 'react-i18next'
import { useLanguage } from '../../context/LanguageContext'
import api from '../../api'
import Toast from '../../components/Toast'
import ConfirmModal from '../../components/ConfirmModal'

const Dashboard = () => {
  const [trips, setTrips] = useState([])
  const [stats, setStats] = useState(null)
  const [reviews, setReviews] = useState([])
  const [archivedTrips, setArchivedTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [showArchive, setShowArchive] = useState(false)
  const [toast, setToast] = useState(null)
  const [confirmAction, setConfirmAction] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)

  const { user, logout } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const { t } = useTranslation()
  const { isArabic, toggleLanguage } = useLanguage()
  const navigate = useNavigate()

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    try {
      const [tripsRes, statsRes, reviewsRes, archivedRes] = await Promise.all([
        api.get('/trips'), api.get('/stats'), api.get('/reviews/all'), api.get('/trips/archived/all')
      ])
      setTrips(tripsRes.data)
      setStats(statsRes.data)
      setReviews(reviewsRes.data)
      setArchivedTrips(archivedRes.data)
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async (tripId) => {
    setConfirmAction({
      message: t('areYouSure'),
      onConfirm: async () => {
        try {
          await api.delete(`/trips/${tripId}`)
          setTrips(trips.map(t => t.id === tripId ? { ...t, status: 'cancelled' } : t))
          setToast({ message: t('tripCancelSuccess'), type: 'success' })
        } catch { setToast({ message: 'Failed to cancel trip', type: 'error' }) }
        finally { setConfirmAction(null) }
      }
    })
  }

  const handleRestore = async (tripId) => {
    try {
      await api.patch(`/trips/${tripId}/restore`)
      const restored = archivedTrips.find(t => t.id === tripId)
      setArchivedTrips(archivedTrips.filter(t => t.id !== tripId))
      setTrips([...trips, { ...restored, is_archived: 0 }])
      setToast({ message: t('restoreSuccess'), type: 'success' })
    } catch { setToast({ message: 'Failed to restore trip', type: 'error' }) }
  }

  const handlePermanentDelete = async (tripId) => {
    setConfirmAction({
      message: t('areYouSure'),
      onConfirm: async () => {
        try {
          await api.delete(`/trips/${tripId}/permanent`)
          setArchivedTrips(archivedTrips.filter(t => t.id !== tripId))
          setToast({ message: t('deleteSuccess'), type: 'success' })
        } catch { setToast({ message: 'Failed to delete trip', type: 'error' }) }
        finally { setConfirmAction(null) }
      }
    })
  }

  const handleLogout = () => { logout(); navigate('/login') }

  const renderStars = (rating) => [1,2,3,4,5].map(star => (
    <span key={star} className={star <= rating ? 'text-yellow-400' : 'text-gray-300'}>★</span>
  ))

  if (loading) return (
    <div className="min-h-screen" style={{ backgroundColor: isDark ? '#0f1117' : '#f5f5f5' }}>
      <nav className="shadow px-6 py-3" style={{ backgroundColor: isDark ? '#0d1021' : '#1e2d5a' }}>
        <div className="skeleton h-10 w-40 opacity-30" />
      </nav>
      <div className="max-w-3xl mx-auto py-8 px-4">
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[1,2,3].map(i => (
            <div key={i} className="rounded-xl p-4 text-center shadow-sm" style={{ backgroundColor: isDark ? '#1a1d27' : 'white' }}>
              <div className="skeleton h-8 w-12 mx-auto mb-2" /><div className="skeleton h-3 w-20 mx-auto" />
            </div>
          ))}
        </div>
        {[1,2,3].map(i => (
          <div key={i} className="rounded-xl p-4 mb-3 border-l-4" style={{ backgroundColor: isDark ? '#1a1d27' : 'white', borderLeftColor: '#e0e0e0' }}>
            <div className="flex justify-between items-center">
              <div className="flex-1"><div className="skeleton skeleton-title w-2/3" /><div className="skeleton skeleton-text w-1/2" /></div>
              <div className="flex gap-2"><div className="skeleton skeleton-badge" /><div className="skeleton h-7 w-12 rounded" /></div>
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
              <p className="text-blue-200 text-xs">{t('university')} — {t('admin')}</p>
            </div>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex gap-4 items-center">
            <span className="text-blue-200 text-sm">Hi, {user?.name}</span>
            <button onClick={() => navigate('/manage-buses')} className="text-sm text-white border px-3 py-1 rounded-lg hover:bg-white hover:text-blue-900 transition" style={{ borderColor: 'rgba(255,255,255,0.4)' }}>{t('buses')}</button>
            <button onClick={toggleTheme} className="text-sm px-3 py-1 rounded-lg transition btn-press" style={{ backgroundColor: isDark ? '#f5f5f5' : 'rgba(255,255,255,0.15)', color: isDark ? '#1e2d5a' : 'white' }}>{isDark ? '☀️' : '🌙'}</button>
            <button onClick={toggleLanguage} className="text-sm px-3 py-1 rounded-lg transition btn-press font-medium" style={{ backgroundColor: isArabic ? '#f5f5f5' : 'rgba(255,255,255,0.15)', color: isArabic ? '#1e2d5a' : 'white' }}>{isArabic ? 'EN' : 'ع'}</button>
            <button onClick={handleLogout} className="text-sm px-3 py-1 rounded-lg text-white hover:opacity-90 transition btn-press" style={{ backgroundColor: '#8B1A2B' }}>{t('logout')}</button>
          </div>

          {/* Hamburger */}
          <button onClick={() => setMenuOpen(!menuOpen)} className="flex md:hidden flex-col gap-1.5 p-2">
            <span className="block w-6 h-0.5 bg-white" />
            <span className="block w-6 h-0.5 bg-white" />
            <span className="block w-6 h-0.5 bg-white" />
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden flex flex-col gap-2 pt-4 pb-2 fade-in"
            style={{ borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: '12px' }}>
            <span className="text-blue-200 text-sm">Hi, {user?.name}</span>
            <button onClick={() => { navigate('/manage-buses'); setMenuOpen(false) }} className="text-sm text-white border px-3 py-2 rounded-lg text-left" style={{ borderColor: 'rgba(255,255,255,0.4)' }}>{t('buses')}</button>
            <div className="flex gap-2">
              <button onClick={toggleTheme} className="flex-1 text-sm px-3 py-2 rounded-lg transition btn-press" style={{ backgroundColor: isDark ? '#f5f5f5' : 'rgba(255,255,255,0.15)', color: isDark ? '#1e2d5a' : 'white' }}>{isDark ? '☀️ Light' : '🌙 Dark'}</button>
              <button onClick={toggleLanguage} className="flex-1 text-sm px-3 py-2 rounded-lg transition btn-press font-medium" style={{ backgroundColor: isArabic ? '#f5f5f5' : 'rgba(255,255,255,0.15)', color: isArabic ? '#1e2d5a' : 'white' }}>{isArabic ? 'EN' : 'ع'}</button>
            </div>
            <button onClick={handleLogout} className="text-sm px-3 py-2 rounded-lg text-white text-left btn-press" style={{ backgroundColor: '#8B1A2B' }}>{t('logout')}</button>
          </div>
        )}
      </nav>

      <div className="max-w-3xl mx-auto py-6 px-4">

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="rounded-xl p-3 text-center shadow-sm border-t-4 card-hover fade-in-delay-1" style={{ backgroundColor: isDark ? '#1a1d27' : 'white', borderTopColor: '#1e2d5a' }}>
              <div className="text-xl font-bold" style={{ color: '#1e2d5a' }}>{stats.total_trips}</div>
              <div className="text-xs mt-1" style={{ color: isDark ? '#a0aec0' : '#6b7280' }}>{t('totalTrips')}</div>
            </div>
            <div className="rounded-xl p-3 text-center shadow-sm border-t-4 card-hover fade-in-delay-2" style={{ backgroundColor: isDark ? '#1a1d27' : 'white', borderTopColor: '#2d7a4f' }}>
              <div className="text-xl font-bold text-green-600">{stats.confirmed_trips}</div>
              <div className="text-xs mt-1" style={{ color: isDark ? '#a0aec0' : '#6b7280' }}>{t('confirmed')}</div>
            </div>
            <div className="rounded-xl p-3 text-center shadow-sm border-t-4 card-hover fade-in-delay-3" style={{ backgroundColor: isDark ? '#1a1d27' : 'white', borderTopColor: '#8B1A2B' }}>
              <div className="text-xl font-bold" style={{ color: '#8B1A2B' }}>{stats.total_bookings}</div>
              <div className="text-xs mt-1" style={{ color: isDark ? '#a0aec0' : '#6b7280' }}>{t('myBookings')}</div>
            </div>
          </div>
        )}

        {/* Trips */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold" style={{ color: isDark ? '#ffffff' : '#1e2d5a' }}>{t('trips')}</h2>
          <button onClick={() => navigate('/add-trip')} className="text-white px-3 py-2 rounded-lg text-sm hover:opacity-90 transition btn-press" style={{ backgroundColor: '#8B1A2B' }}>{t('addTrip')}</button>
        </div>

        {trips.map((trip, index) => (
          <div key={trip.id} className={`rounded-xl shadow-sm p-3 mb-3 border-l-4 card-hover fade-in-delay-${Math.min(index + 1, 5)}`} style={{ backgroundColor: isDark ? '#1a1d27' : 'white', borderLeftColor: '#1e2d5a' }}>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0 mr-2">
                  <h3 className="font-semibold text-sm truncate" style={{ color: isDark ? '#ffffff' : '#1a202c' }}>
                    {trip.direction === 'from_university' ? `${t('israTo')} ${trip.area}` : `${trip.area} ${t('toIsra')}`}
                  </h3>
                  <p className="text-xs mt-0.5" style={{ color: isDark ? '#a0aec0' : '#6b7280' }}>
                    Bus {trip.bus_number} · {new Date(trip.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {trip.booked_seats}/{trip.capacity}
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 ${trip.status === 'confirmed' ? 'bg-green-100 text-green-700' : trip.status === 'cancelled' ? 'bg-red-100 text-red-700' : trip.status === 'completed' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {t(trip.status)}
                </span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {trip.status !== 'cancelled' && trip.status !== 'completed' && (
                  <>
                    <button onClick={() => navigate(`/track/${trip.id}`)} className="text-xs px-2 py-1 rounded border hover:opacity-80 transition btn-press" style={{ color: '#1e2d5a', borderColor: '#1e2d5a' }}>{t('track')}</button>
                    <button onClick={() => navigate(`/add-trip?edit=${trip.id}&bus_id=${trip.bus_id}&area=${trip.area}&departure_time=${trip.departure_time}&direction=${trip.direction}`)} className="text-xs px-2 py-1 rounded border hover:opacity-80 transition btn-press text-green-600" style={{ borderColor: '#2d7a4f' }}>{t('edit')}</button>
                    <button onClick={() => handleCancel(trip.id)} className="text-xs px-2 py-1 rounded border hover:opacity-80 transition btn-press" style={{ color: '#8B1A2B', borderColor: '#8B1A2B' }}>{t('cancel')}</button>
                  </>
                )}
                {trip.status === 'completed' && (
                  <button onClick={() => navigate(`/track/${trip.id}`)} className="text-xs px-2 py-1 rounded border hover:opacity-80 transition btn-press" style={{ color: '#1e2d5a', borderColor: '#1e2d5a' }}>{t('track')}</button>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Archive */}
        <div className="mt-6 mb-4">
          <button onClick={() => setShowArchive(!showArchive)} className="flex items-center gap-2 hover:opacity-80 transition btn-press" style={{ color: isDark ? '#ffffff' : '#1e2d5a' }}>
            <span className="font-semibold text-sm">{t('archivedTrips')}</span>
            <span className="text-xs px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: '#1e2d5a' }}>{archivedTrips.length}</span>
            <span className="text-xs text-gray-400">{showArchive ? t('hide') : t('show')}</span>
          </button>
        </div>

        {showArchive && (
          archivedTrips.length === 0 ? (
            <div className="rounded-xl shadow-sm p-6 text-center mb-6 fade-in" style={{ backgroundColor: isDark ? '#1a1d27' : 'white' }}>
              <p className="text-gray-500">{t('noArchivedTrips')}</p>
            </div>
          ) : (
            archivedTrips.map((trip, index) => (
              <div key={trip.id} className={`rounded-xl p-3 mb-3 fade-in-delay-${Math.min(index + 1, 5)}`} style={{ backgroundColor: isDark ? '#1a1d27' : '#f9fafb', border: `1px solid ${isDark ? '#2d3748' : '#e5e7eb'}` }}>
                <div className="flex justify-between items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm truncate" style={{ color: isDark ? '#a0aec0' : '#4b5563' }}>
                      {trip.direction === 'from_university' ? `${t('israTo')} ${trip.area}` : `${trip.area} ${t('toIsra')}`}
                    </h3>
                    <p className="text-xs mt-0.5" style={{ color: isDark ? '#718096' : '#9ca3af' }}>
                      Bus {trip.bus_number} · {new Date(trip.departure_time).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => handleRestore(trip.id)} className="text-xs px-2 py-1 rounded border text-green-600 hover:bg-green-50 transition btn-press" style={{ borderColor: '#2d7a4f' }}>{t('restore')}</button>
                    <button onClick={() => handlePermanentDelete(trip.id)} className="text-xs px-2 py-1 rounded border hover:opacity-80 transition btn-press" style={{ color: '#8B1A2B', borderColor: '#8B1A2B' }}>{t('delete')}</button>
                  </div>
                </div>
              </div>
            ))
          )
        )}

        {/* Reviews */}
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-4" style={{ color: isDark ? '#ffffff' : '#1e2d5a' }}>
            {t('reviewsComplaints')} <span className="text-sm font-normal text-gray-400">({reviews.length})</span>
          </h2>
          {reviews.length === 0 ? (
            <div className="rounded-xl shadow-sm p-6 text-center fade-in" style={{ backgroundColor: isDark ? '#1a1d27' : 'white' }}>
              <p className="text-gray-500">{t('noReviews')}</p>
            </div>
          ) : (
            reviews.map((review, index) => (
              <div key={review.id} className={`rounded-xl shadow-sm p-4 mb-3 border-l-4 card-hover fade-in-delay-${Math.min(index + 1, 5)}`} style={{ backgroundColor: isDark ? '#1a1d27' : 'white', borderLeftColor: '#8B1A2B' }}>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1 min-w-0 mr-2">
                    <p className="font-medium text-sm truncate" style={{ color: isDark ? '#ffffff' : '#1a202c' }}>{review.student_name}</p>
                    <p className="text-xs mt-0.5" style={{ color: isDark ? '#a0aec0' : '#6b7280' }}>
                      {review.area} · {new Date(review.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <div className="flex">{renderStars(review.rating)}</div>
                    <span className="text-xs font-medium ml-1" style={{ color: isDark ? '#a0aec0' : '#4b5563' }}>{review.rating}/5</span>
                  </div>
                </div>
                {review.comment && (
                  <p className="text-sm rounded-lg px-3 py-2 mt-2" style={{ backgroundColor: isDark ? '#0f1117' : '#f9fafb', color: isDark ? '#a0aec0' : '#4b5563' }}>"{review.comment}"</p>
                )}
                <p className="text-xs text-gray-400 mt-2">{new Date(review.created_at).toLocaleDateString()}</p>
              </div>
            ))
          )}
        </div>

      </div>

      {confirmAction && <ConfirmModal message={confirmAction.message} onConfirm={confirmAction.onConfirm} onCancel={() => setConfirmAction(null)} />}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

    </div>
  )
}

export default Dashboard