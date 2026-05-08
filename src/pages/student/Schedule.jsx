import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { useTranslation } from 'react-i18next'
import { useLanguage } from '../../context/LanguageContext'
import api from '../../api'
import Toast from '../../components/Toast'

const daysEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday']
const daysAr = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس']

const Schedule = () => {
  const [schedule, setSchedule] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)

  const { user, logout } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const { t } = useTranslation()
  const { isArabic, toggleLanguage } = useLanguage()
  const navigate = useNavigate()

  useEffect(() => {
    fetchSchedule()
  }, [])

  const fetchSchedule = async () => {
    try {
      const response = await api.get('/schedules/my')
      setSchedule(response.data)
    } catch (error) {
      console.error('Failed to fetch schedule:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const groupByDay = () => {
    const grouped = {}
    daysEn.forEach(day => {
      grouped[day] = schedule.filter(s => s.day === day)
    })
    return grouped
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: isDark ? '#0f1117' : '#f5f5f5' }}>
      <p className="text-gray-500">Loading...</p>
    </div>
  )

  const grouped = groupByDay()

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
            <button onClick={() => navigate('/my-bookings')} className="text-sm text-white border px-3 py-1 rounded-lg hover:bg-white hover:text-blue-900 transition" style={{ borderColor: 'rgba(255,255,255,0.4)' }}>{t('myBookings')}</button>
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
            <button onClick={() => { navigate('/my-bookings'); setMenuOpen(false) }} className="text-sm text-white border px-3 py-2 rounded-lg text-left" style={{ borderColor: 'rgba(255,255,255,0.4)' }}>{t('myBookings')}</button>
            <div className="flex gap-2">
              <button onClick={toggleTheme} className="flex-1 text-sm px-3 py-2 rounded-lg transition btn-press" style={{ backgroundColor: isDark ? '#f5f5f5' : 'rgba(255,255,255,0.15)', color: isDark ? '#1e2d5a' : 'white' }}>{isDark ? '☀️ Light' : '🌙 Dark'}</button>
              <button onClick={toggleLanguage} className="flex-1 text-sm px-3 py-2 rounded-lg transition btn-press font-medium" style={{ backgroundColor: isArabic ? '#f5f5f5' : 'rgba(255,255,255,0.15)', color: isArabic ? '#1e2d5a' : 'white' }}>{isArabic ? 'EN' : 'ع'}</button>
            </div>
            <button onClick={handleLogout} className="text-sm px-3 py-2 rounded-lg text-white text-left btn-press" style={{ backgroundColor: '#8B1A2B' }}>{t('logout')}</button>
          </div>
        )}
      </nav>

      <div className="max-w-2xl mx-auto py-6 px-4">

        <div className="flex items-center gap-3 mb-6">
          <h2 className="text-lg font-semibold" style={{ color: isDark ? '#ffffff' : '#1e2d5a' }}>
            📅 {t('mySchedule')}
          </h2>
          <span className="text-xs px-2 py-1 rounded-full text-white" style={{ backgroundColor: '#1e2d5a' }}>
            {schedule.length} {t('lectures')}
          </span>
        </div>

        {/* Info Card */}
        <div className="rounded-xl p-4 mb-6 fade-in"
          style={{ backgroundColor: isDark ? '#1a1d27' : '#f0f3fa', border: `1px solid ${isDark ? '#2d3748' : '#c7d2e8'}` }}>
          <p className="text-sm" style={{ color: isDark ? '#a0aec0' : '#1e2d5a' }}>
            ℹ️ {t('scheduleImported')}
          </p>
        </div>

        {schedule.length === 0 ? (
          <div className="rounded-xl shadow-sm p-8 text-center fade-in"
            style={{ backgroundColor: isDark ? '#1a1d27' : 'white' }}>
            <p className="text-gray-500">{t('noSchedule')}</p>
          </div>
        ) : (
          daysEn.map((day, dayIndex) => (
            <div key={day} className="mb-5 fade-in">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#8B1A2B' }} />
                <h3 className="font-semibold text-sm" style={{ color: isDark ? '#ffffff' : '#1e2d5a' }}>
                  {isArabic ? daysAr[dayIndex] : day}
                </h3>
                <span className="text-xs text-gray-400">
                  {grouped[day].length === 0 ? t('noLectures') : `${grouped[day].length} ${t('lectureCount')}`}
                </span>
              </div>

              {grouped[day].length === 0 ? (
                <div className="rounded-xl p-3 text-center"
                  style={{ backgroundColor: isDark ? '#1a1d27' : '#f9fafb', border: `1px dashed ${isDark ? '#2d3748' : '#e5e7eb'}` }}>
                  <p className="text-xs text-gray-400">{t('freeDay')}</p>
                </div>
              ) : (
                grouped[day].map(lecture => (
                  <div key={lecture.id} className="rounded-xl p-3 mb-2 flex items-center gap-3 card-hover"
                    style={{ backgroundColor: isDark ? '#1a1d27' : 'white', border: `1px solid ${isDark ? '#2d3748' : '#e5e7eb'}` }}>
                    <div className="w-1 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: '#1e2d5a' }} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate" style={{ color: isDark ? '#ffffff' : '#1a202c' }}>
                        {lecture.subject || (isArabic ? 'محاضرة' : 'Lecture')}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: isDark ? '#a0aec0' : '#6b7280' }}>
                        🕐 {lecture.start_time.slice(0, 5)} — {lecture.end_time.slice(0, 5)}
                      </p>
                    </div>
                    <div className="text-xs px-2 py-1 rounded-full flex-shrink-0"
                      style={{ backgroundColor: isDark ? '#0f1117' : '#f0f3fa', color: isDark ? '#a0aec0' : '#1e2d5a' }}>
                      {parseInt(lecture.end_time.slice(0, 2)) >= 12 ? isArabic ? 'م' : 'PM' : isArabic ? 'ص' : 'AM'}
                    </div>
                  </div>
                ))
              )}
            </div>
          ))
        )}

      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

    </div>
  )
}

export default Schedule