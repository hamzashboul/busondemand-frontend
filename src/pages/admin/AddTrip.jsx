import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { useTranslation } from 'react-i18next'
import { useLanguage } from '../../context/LanguageContext'
import api from '../../api'

const AddTrip = () => {
  const [buses, setBuses] = useState([])
  const [form, setForm] = useState({
    bus_id: '',
    area: '',
    departure_time: '',
    direction: 'from_university'
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [editId, setEditId] = useState(null)

  const { logout } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const { t } = useTranslation()
  const { isArabic, toggleLanguage } = useLanguage()
  const navigate = useNavigate()

  useEffect(() => {
    fetchBuses()
    loadEditData()
  }, [])

  const fetchBuses = async () => {
    try {
      const response = await api.get('/buses')
      setBuses(response.data)
    } catch (error) {
      console.error('Failed to fetch buses:', error)
    }
  }

  const loadEditData = () => {
    const params = new URLSearchParams(window.location.search)
    const edit = params.get('edit')
    if (edit) {
      setEditId(parseInt(edit))
      setForm({
        bus_id: params.get('bus_id') || '',
        area: params.get('area') || '',
        departure_time: formatDateTimeLocal(params.get('departure_time')),
        direction: params.get('direction') || 'from_university'
      })
    }
  }

  const formatDateTimeLocal = (dateStr) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const offset = date.getTimezoneOffset()
    const localDate = new Date(date.getTime() - offset * 60 * 1000)
    return localDate.toISOString().slice(0, 16)
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    try {
      if (editId) {
        await api.put(`/trips/${editId}`, { ...form, status: 'pending' })
        setMessage(t('tripUpdated'))
      } else {
        await api.post('/trips', form)
        setMessage(t('tripAdded'))
        setForm({ bus_id: '', area: '', departure_time: '', direction: 'from_university' })
      }
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to save trip')
    } finally {
      setLoading(false)
    }
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
            <p className="text-blue-200 text-xs">{t('university')} — {t('admin')}</p>
          </div>
        </div>
        <div className="flex gap-4 items-center">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-sm text-white border px-3 py-1 rounded-lg hover:bg-white hover:text-blue-900 transition"
            style={{ borderColor: 'rgba(255,255,255,0.4)' }}
          >
            {t('dashboard')}
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
            onClick={() => { logout(); navigate('/login') }}
            className="text-sm px-3 py-1 rounded-lg text-white hover:opacity-90 transition btn-press"
            style={{ backgroundColor: '#8B1A2B' }}
          >
            {t('logout')}
          </button>
        </div>
      </nav>

      <div className="max-w-lg mx-auto py-8 px-4">
        <h2 className="text-lg font-semibold mb-6"
          style={{ color: isDark ? '#ffffff' : '#1e2d5a' }}>
          {editId ? t('editTrip') : t('addNewTrip')}
        </h2>

        {message && (
          <div className={`mb-4 p-3 rounded-lg text-sm text-center ${
            message.includes('successfully') || message.includes('نجاح') || message.includes('تم')
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="rounded-xl shadow-sm p-6 border-t-4"
          style={{
            backgroundColor: isDark ? '#1a1d27' : 'white',
            borderTopColor: '#1e2d5a'
          }}>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1"
              style={{ color: isDark ? '#ffffff' : '#1e2d5a' }}>
              {t('area')}
            </label>
            <input
              type="text"
              name="area"
              value={form.area}
              onChange={handleChange}
              placeholder="e.g. طبربور"
              required
              className="w-full border-2 rounded-lg px-3 py-2 text-sm focus:outline-none transition"
              style={{
                borderColor: isDark ? '#2d3748' : '#e5e7eb',
                backgroundColor: isDark ? '#0f1117' : 'white',
                color: isDark ? '#ffffff' : '#1a202c'
              }}
              onFocus={(e) => e.target.style.borderColor = '#1e2d5a'}
              onBlur={(e) => e.target.style.borderColor = isDark ? '#2d3748' : '#e5e7eb'}
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1"
              style={{ color: isDark ? '#ffffff' : '#1e2d5a' }}>
              {t('bus')}
            </label>
            <select
              name="bus_id"
              value={form.bus_id}
              onChange={handleChange}
              required
              className="w-full border-2 rounded-lg px-3 py-2 text-sm focus:outline-none transition"
              style={{
                borderColor: isDark ? '#2d3748' : '#e5e7eb',
                backgroundColor: isDark ? '#0f1117' : 'white',
                color: isDark ? '#ffffff' : '#1a202c'
              }}
              onFocus={(e) => e.target.style.borderColor = '#1e2d5a'}
              onBlur={(e) => e.target.style.borderColor = isDark ? '#2d3748' : '#e5e7eb'}
            >
              <option value="">{t('bus')}...</option>
              {buses.map(bus => (
                <option key={bus.id} value={bus.id}>
                  {bus.bus_number} — {bus.capacity} seats
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1"
              style={{ color: isDark ? '#ffffff' : '#1e2d5a' }}>
              {t('departureTime')}
            </label>
            <input
              type="datetime-local"
              name="departure_time"
              value={form.departure_time}
              onChange={handleChange}
              required
              className="w-full border-2 rounded-lg px-3 py-2 text-sm focus:outline-none transition"
              style={{
                borderColor: isDark ? '#2d3748' : '#e5e7eb',
                backgroundColor: isDark ? '#0f1117' : 'white',
                color: isDark ? '#ffffff' : '#1a202c'
              }}
              onFocus={(e) => e.target.style.borderColor = '#1e2d5a'}
              onBlur={(e) => e.target.style.borderColor = isDark ? '#2d3748' : '#e5e7eb'}
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-1"
              style={{ color: isDark ? '#ffffff' : '#1e2d5a' }}>
              {t('direction')}
            </label>
            <select
              name="direction"
              value={form.direction}
              onChange={handleChange}
              className="w-full border-2 rounded-lg px-3 py-2 text-sm focus:outline-none transition"
              style={{
                borderColor: isDark ? '#2d3748' : '#e5e7eb',
                backgroundColor: isDark ? '#0f1117' : 'white',
                color: isDark ? '#ffffff' : '#1a202c'
              }}
              onFocus={(e) => e.target.style.borderColor = '#1e2d5a'}
              onBlur={(e) => e.target.style.borderColor = isDark ? '#2d3748' : '#e5e7eb'}
            >
              <option value="from_university">{t('fromUniversity')}</option>
              <option value="to_university">{t('toUniversity')}</option>
            </select>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 text-white py-2 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition btn-press"
              style={{ backgroundColor: '#8B1A2B' }}
            >
              {loading ? t('saving') : editId ? t('saveChanges') : t('saveTrip')}
            </button>
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="flex-1 border-2 py-2 rounded-lg text-sm hover:opacity-80 transition btn-press"
              style={{
                borderColor: '#1e2d5a',
                color: isDark ? '#ffffff' : '#1e2d5a',
                backgroundColor: 'transparent'
              }}
            >
              {t('cancel')}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}

export default AddTrip