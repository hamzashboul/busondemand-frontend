import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { useTranslation } from 'react-i18next'
import { useLanguage } from '../../context/LanguageContext'
import api from '../../api'
import Toast from '../../components/Toast'
import ConfirmModal from '../../components/ConfirmModal'
import html2pdf from 'html2pdf.js'

const MyBookings = () => {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [cancellingId, setCancellingId] = useState(null)
  const [confirmBookingId, setConfirmBookingId] = useState(null)
  const [toast, setToast] = useState(null)
  const [reviewingId, setReviewingId] = useState(null)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [reviewLoading, setReviewLoading] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const { user, logout } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const { t } = useTranslation()
  const { isArabic, toggleLanguage } = useLanguage()
  const navigate = useNavigate()

  useEffect(() => {
    fetchBookings()
  }, [])

  const fetchBookings = async () => {
    try {
      const response = await api.get('/bookings/my')
      setBookings(response.data)
    } catch (error) {
      console.error('Failed to fetch bookings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async (bookingId) => {
    setCancellingId(bookingId)
    try {
      await api.delete(`/bookings/${bookingId}`)
      setBookings(bookings.filter(b => b.id !== bookingId))
      setToast({ message: t('cancelSuccess'), type: 'success' })
    } catch (error) {
      setToast({ message: error.response?.data?.message || 'Cancel failed', type: 'error' })
    } finally {
      setCancellingId(null)
      setConfirmBookingId(null)
    }
  }

  const handleReviewSubmit = async (tripId) => {
    if (rating === 0) {
      setToast({ message: 'Please select a rating ⭐', type: 'error' })
      return
    }
    setReviewLoading(true)
    try {
      await api.post('/reviews', { trip_id: tripId, rating, comment })
      setToast({ message: t('reviewSuccess'), type: 'success' })
      setReviewingId(null)
      setRating(0)
      setComment('')
    } catch (error) {
      setToast({ message: error.response?.data?.message || 'Failed to submit review', type: 'error' })
    } finally {
      setReviewLoading(false)
    }
  }

  const handlePrintTicket = (booking) => {
    const ticketHTML = `
      <div style="font-family: Arial, sans-serif; width: 400px; margin: 0 auto; border: 2px solid #1e2d5a; border-radius: 12px; overflow: hidden; direction: ${isArabic ? 'rtl' : 'ltr'};">
        <div style="background-color: #1e2d5a; padding: 20px; text-align: center;">
          <h2 style="color: white; margin: 0; font-size: 20px;">${isArabic ? 'باص أون ديماند' : 'BusOnDemand'}</h2>
          <p style="color: #a8c4e0; margin: 4px 0 0; font-size: 12px;">${isArabic ? 'جامعة الإسراء — نظام النقل' : 'Isra University — Transportation System'}</p>
        </div>
        <div style="background-color: #8B1A2B; height: 4px;"></div>
        <div style="padding: 24px; background: white;">
          <div style="text-align: center; margin-bottom: 20px;">
            <div style="background-color: #f0f3fa; border-radius: 8px; padding: 12px; display: inline-block;"><span style="font-size: 32px;">🚌</span></div>
            <h3 style="color: #1e2d5a; margin: 8px 0 0; font-size: 16px;">${isArabic ? 'تذكرة الحجز' : 'Booking Ticket'}</h3>
          </div>
          <div style="border-top: 1px dashed #e5e7eb; margin: 16px 0;"></div>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="color: #6b7280; font-size: 12px; padding: 6px 0;">${isArabic ? 'رقم الحجز' : 'Booking ID'}</td><td style="color: #1e2d5a; font-weight: bold; font-size: 12px; text-align: ${isArabic ? 'left' : 'right'};">#${booking.id}</td></tr>
            <tr><td style="color: #6b7280; font-size: 12px; padding: 6px 0;">${isArabic ? 'المسار' : 'Route'}</td><td style="color: #1e2d5a; font-weight: bold; font-size: 12px; text-align: ${isArabic ? 'left' : 'right'};">${booking.direction === 'from_university' ? isArabic ? `جامعة الإسراء ← ${booking.area}` : `Isra University → ${booking.area}` : isArabic ? `${booking.area} ← جامعة الإسراء` : `${booking.area} → Isra University`}</td></tr>
            <tr><td style="color: #6b7280; font-size: 12px; padding: 6px 0;">${isArabic ? 'الباص' : 'Bus'}</td><td style="color: #1e2d5a; font-weight: bold; font-size: 12px; text-align: ${isArabic ? 'left' : 'right'};">${booking.bus_number}</td></tr>
            <tr><td style="color: #6b7280; font-size: 12px; padding: 6px 0;">${isArabic ? 'وقت المغادرة' : 'Departure'}</td><td style="color: #1e2d5a; font-weight: bold; font-size: 12px; text-align: ${isArabic ? 'left' : 'right'};">${new Date(booking.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td></tr>
            <tr><td style="color: #6b7280; font-size: 12px; padding: 6px 0;">${isArabic ? 'الحالة' : 'Status'}</td><td style="text-align: ${isArabic ? 'left' : 'right'};"><span style="background-color: ${booking.trip_status === 'confirmed' ? '#dcfce7' : '#fef9c3'}; color: ${booking.trip_status === 'confirmed' ? '#166534' : '#854d0e'}; padding: 2px 8px; border-radius: 20px; font-size: 11px; font-weight: bold;">${isArabic ? booking.trip_status === 'confirmed' ? 'مؤكدة' : booking.trip_status === 'pending' ? 'معلقة' : booking.trip_status === 'cancelled' ? 'ملغاة' : 'مكتملة' : booking.trip_status}</span></td></tr>
            <tr><td style="color: #6b7280; font-size: 12px; padding: 6px 0;">${isArabic ? 'التاريخ' : 'Date'}</td><td style="color: #1e2d5a; font-weight: bold; font-size: 12px; text-align: ${isArabic ? 'left' : 'right'};">${new Date(booking.departure_time).toLocaleDateString()}</td></tr>
            <tr><td style="color: #6b7280; font-size: 12px; padding: 6px 0;">${isArabic ? 'الطالب' : 'Student'}</td><td style="color: #1e2d5a; font-weight: bold; font-size: 12px; text-align: ${isArabic ? 'left' : 'right'};">${user?.name}</td></tr>
          </table>
          <div style="border-top: 1px dashed #e5e7eb; margin: 16px 0;"></div>
          <div style="text-align: center;">
            <p style="color: #9ca3af; font-size: 10px; margin: 0;">${isArabic ? 'يرجى تقديم هذه التذكرة للسائق' : 'Please present this ticket to the driver'}</p>
            <p style="color: #9ca3af; font-size: 10px; margin: 4px 0 0;">📞 0798872267 | 0775443500</p>
          </div>
        </div>
        <div style="background-color: #8B1A2B; padding: 8px; text-align: center;">
          <p style="color: white; font-size: 10px; margin: 0;">${isArabic ? 'جامعة الإسراء — نظام باص أون ديماند' : 'Isra University — BusOnDemand System'}</p>
        </div>
      </div>
    `
    const element = document.createElement('div')
    element.innerHTML = ticketHTML
    html2pdf().set({ margin: 10, filename: `ticket-${booking.id}.pdf`, html2canvas: { scale: 2 }, jsPDF: { unit: 'mm', format: 'a5', orientation: 'portrait' } }).from(element).save()
    setToast({ message: t('ticketDownloaded'), type: 'success' })
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
            <button onClick={() => navigate('/trips')} className="text-sm text-white border px-3 py-1 rounded-lg hover:bg-white hover:text-blue-900 transition" style={{ borderColor: 'rgba(255,255,255,0.4)' }}>{t('trips')}</button>
            <button onClick={() => navigate('/schedule')} className="text-sm text-white border px-3 py-1 rounded-lg hover:bg-white hover:text-blue-900 transition" style={{ borderColor: 'rgba(255,255,255,0.4)' }}>📅 {t('schedule')}</button>
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
            <button onClick={() => { navigate('/trips'); setMenuOpen(false) }} className="text-sm text-white border px-3 py-2 rounded-lg text-left" style={{ borderColor: 'rgba(255,255,255,0.4)' }}>{t('trips')}</button>
            <button onClick={() => { navigate('/schedule'); setMenuOpen(false) }} className="text-sm text-white border px-3 py-2 rounded-lg text-left" style={{ borderColor: 'rgba(255,255,255,0.4)' }}>📅 {t('schedule')}</button>
            <div className="flex gap-2">
              <button onClick={toggleTheme} className="flex-1 text-sm px-3 py-2 rounded-lg transition btn-press" style={{ backgroundColor: isDark ? '#f5f5f5' : 'rgba(255,255,255,0.15)', color: isDark ? '#1e2d5a' : 'white' }}>{isDark ? '☀️ Light' : '🌙 Dark'}</button>
              <button onClick={toggleLanguage} className="flex-1 text-sm px-3 py-2 rounded-lg transition btn-press font-medium" style={{ backgroundColor: isArabic ? '#f5f5f5' : 'rgba(255,255,255,0.15)', color: isArabic ? '#1e2d5a' : 'white' }}>{isArabic ? 'EN' : 'ع'}</button>
            </div>
            <button onClick={handleLogout} className="text-sm px-3 py-2 rounded-lg text-white text-left btn-press" style={{ backgroundColor: '#8B1A2B' }}>{t('logout')}</button>
          </div>
        )}
      </nav>

      <div className="max-w-2xl mx-auto py-6 px-4">
        <h2 className="text-lg font-semibold mb-4" style={{ color: isDark ? '#ffffff' : '#1e2d5a' }}>
          {t('myBookingsTitle')}
        </h2>

        {bookings.length === 0 ? (
          <div className="text-center py-12 fade-in">
            <p className="text-gray-500 mb-4">{t('noBookings')}</p>
            <button onClick={() => navigate('/trips')} className="text-white px-6 py-2 rounded-lg text-sm hover:opacity-90 transition btn-press" style={{ backgroundColor: '#8B1A2B' }}>{t('browseTrips')}</button>
          </div>
        ) : (
          bookings.map((booking, index) => (
            <div key={booking.id} className={`rounded-xl shadow-sm p-4 mb-4 border-l-4 card-hover fade-in-delay-${Math.min(index + 1, 5)}`} style={{ backgroundColor: isDark ? '#1a1d27' : 'white', borderLeftColor: '#1e2d5a' }}>
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1 mr-2">
                  <h3 className="font-semibold text-sm" style={{ color: isDark ? '#ffffff' : '#1a202c' }}>
                    {booking.direction === 'from_university' ? `${t('israTo')} ${booking.area}` : `${booking.area} ${t('toIsra')}`}
                  </h3>
                  <p className="text-xs mt-1" style={{ color: isDark ? '#a0aec0' : '#6b7280' }}>
                    Bus {booking.bus_number} · {new Date(booking.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full flex-shrink-0 ${booking.trip_status === 'confirmed' ? 'bg-green-100 text-green-700' : booking.trip_status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {t(booking.trip_status)}
                </span>
              </div>

              <div className="flex flex-wrap gap-2 mb-3">
                <button onClick={() => setConfirmBookingId(booking.id)} disabled={cancellingId === booking.id} className="flex-1 border py-2 rounded-lg text-xs font-medium disabled:opacity-50 hover:opacity-80 transition btn-press" style={{ borderColor: '#8B1A2B', color: '#8B1A2B', minWidth: '80px' }}>
                  {cancellingId === booking.id ? t('cancelling') : t('cancelBooking')}
                </button>
                <button onClick={() => handlePrintTicket(booking)} className="flex-1 border py-2 rounded-lg text-xs font-medium hover:opacity-80 transition btn-press" style={{ borderColor: '#1e2d5a', color: isDark ? '#ffffff' : '#1e2d5a', minWidth: '80px' }}>
                  {t('printTicket')}
                </button>
                <button onClick={() => { setReviewingId(reviewingId === booking.trip_id ? null : booking.trip_id); setRating(0); setComment('') }} className="flex-1 border py-2 rounded-lg text-xs font-medium hover:opacity-80 transition text-white btn-press" style={{ backgroundColor: '#1e2d5a', borderColor: '#1e2d5a', minWidth: '80px' }}>
                  {reviewingId === booking.trip_id ? t('close') : t('rateTrip')}
                </button>
              </div>

              {reviewingId === booking.trip_id && (
                <div className="rounded-lg p-4 mt-2 fade-in" style={{ backgroundColor: isDark ? '#0f1117' : '#f8f9ff' }}>
                  <h4 className="text-sm font-semibold mb-3" style={{ color: isDark ? '#ffffff' : '#1e2d5a' }}>{t('rateThisTrip')}</h4>
                  <div className="flex gap-2 mb-3 justify-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button key={star} onClick={() => setRating(star)} className={`text-2xl transition-transform hover:scale-110 btn-press ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}>★</button>
                    ))}
                  </div>
                  <p className="text-center text-xs text-gray-500 mb-3">
                    {rating === 0 ? t('selectRating') : rating === 1 ? t('poor') : rating === 2 ? t('fair') : rating === 3 ? t('good') : rating === 4 ? t('veryGood') : t('excellent')}
                  </p>
                  <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder={t('commentPlaceholder')} rows={3} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none mb-3 transition" style={{ borderColor: isDark ? '#2d3748' : '#d1d5db', backgroundColor: isDark ? '#1a1d27' : 'white', color: isDark ? '#ffffff' : '#1a202c' }} onFocus={(e) => e.target.style.borderColor = '#1e2d5a'} onBlur={(e) => e.target.style.borderColor = isDark ? '#2d3748' : '#d1d5db'} />
                  <button onClick={() => handleReviewSubmit(booking.trip_id)} disabled={reviewLoading || rating === 0} className="w-full text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50 hover:opacity-90 transition btn-press" style={{ backgroundColor: '#8B1A2B' }}>
                    {reviewLoading ? t('submitting') : t('submitReview')}
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {confirmBookingId && (
        <ConfirmModal message={t('areYouSure')} onConfirm={() => handleCancel(confirmBookingId)} onCancel={() => setConfirmBookingId(null)} />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

    </div>
  )
}

export default MyBookings