import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { useTranslation } from 'react-i18next'
import { useLanguage } from '../../context/LanguageContext'
import api from '../../api'

const ManageBuses = () => {
  const [buses, setBuses] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ bus_number: '', capacity: '', driver_name: '' })
  const [editingId, setEditingId] = useState(null)
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

  const { logout } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const { t } = useTranslation()
  const { isArabic, toggleLanguage } = useLanguage()
  const navigate = useNavigate()

  useEffect(() => {
    fetchBuses()
  }, [])

  const fetchBuses = async () => {
    try {
      const response = await api.get('/buses')
      setBuses(response.data)
    } catch (error) {
      console.error('Failed to fetch buses:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleEdit = (bus) => {
    setEditingId(bus.id)
    setForm({
      bus_number: bus.bus_number,
      capacity: bus.capacity,
      driver_name: bus.driver_name || ''
    })
    setMessage('')
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setForm({ bus_number: '', capacity: '', driver_name: '' })
    setMessage('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    try {
      if (editingId) {
        await api.put(`/buses/${editingId}`, { ...form, is_active: true })
        setBuses(buses.map(b => b.id === editingId ? { ...b, ...form } : b))
        setMessage(t('busUpdated'))
        setEditingId(null)
      } else {
        await api.post('/buses', form)
        setMessage(t('busAdded'))
        fetchBuses()
      }
      setForm({ bus_number: '', capacity: '', driver_name: '' })
    } catch (error) {
      setMessage(error.response?.data?.message || 'Operation failed')
    } finally {
      setSaving(false)
    }
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

      <div className="max-w-2xl mx-auto py-8 px-4">

        <h2 className="text-lg font-semibold mb-4"
          style={{ color: isDark ? '#ffffff' : '#1e2d5a' }}>
          {t('manageBuses')}
        </h2>

        {message && (
          <div className={`mb-4 p-3 rounded-lg text-sm text-center ${
            message.includes('successfully') || message.includes('تم')
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="rounded-xl shadow-sm p-5 mb-6 border-t-4"
          style={{
            backgroundColor: isDark ? '#1a1d27' : 'white',
            borderTopColor: '#1e2d5a'
          }}>
          <h3 className="font-semibold mb-4" style={{ color: isDark ? '#ffffff' : '#1e2d5a' }}>
            {editingId ? t('editBus') : t('addNewBus')}
          </h3>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div>
              <label className="block text-xs font-medium mb-1"
                style={{ color: isDark ? '#a0aec0' : '#1e2d5a' }}>
                {t('busNumber')}
              </label>
              <input
                type="text"
                name="bus_number"
                value={form.bus_number}
                onChange={handleChange}
                placeholder="e.g. B-03"
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
            <div>
              <label className="block text-xs font-medium mb-1"
                style={{ color: isDark ? '#a0aec0' : '#1e2d5a' }}>
                {t('capacity')}
              </label>
              <input
                type="number"
                name="capacity"
                value={form.capacity}
                onChange={handleChange}
                placeholder="e.g. 45"
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
            <div>
              <label className="block text-xs font-medium mb-1"
                style={{ color: isDark ? '#a0aec0' : '#1e2d5a' }}>
                {t('driverName')}
              </label>
              <input
                type="text"
                name="driver_name"
                value={form.driver_name}
                onChange={handleChange}
                placeholder="e.g. Ahmad"
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
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 text-white py-2 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition btn-press"
              style={{ backgroundColor: '#8B1A2B' }}
            >
              {saving ? t('saving') : editingId ? t('saveChanges') : t('addBus')}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="flex-1 border-2 py-2 rounded-lg text-sm hover:opacity-80 transition btn-press"
                style={{
                  borderColor: '#1e2d5a',
                  color: isDark ? '#ffffff' : '#1e2d5a',
                  backgroundColor: 'transparent'
                }}
              >
                {t('cancel')}
              </button>
            )}
          </div>
        </form>

        <div className="rounded-xl shadow-sm overflow-hidden"
          style={{ backgroundColor: isDark ? '#1a1d27' : 'white' }}>
          <table className="w-full text-sm">
            <thead style={{ backgroundColor: isDark ? '#0d1021' : '#1e2d5a' }}>
              <tr>
                <th className="px-4 py-3 text-left text-white text-xs font-medium">{t('bus')}</th>
                <th className="px-4 py-3 text-left text-white text-xs font-medium">{t('capacity')}</th>
                <th className="px-4 py-3 text-left text-white text-xs font-medium">{t('driverName')}</th>
                <th className="px-4 py-3 text-left text-white text-xs font-medium">{t('status')}</th>
                <th className="px-4 py-3 text-left text-white text-xs font-medium">{t('action')}</th>
              </tr>
            </thead>
            <tbody>
              {buses.map((bus) => (
                <tr
                  key={bus.id}
                  className="transition"
                  style={{
                    borderTop: `1px solid ${isDark ? '#2d3748' : '#f3f4f6'}`,
                    backgroundColor: editingId === bus.id
                      ? isDark ? '#1e2d5a22' : '#eff6ff'
                      : 'transparent'
                  }}
                >
                  <td className="px-4 py-3 font-medium"
                    style={{ color: isDark ? '#ffffff' : '#1a202c' }}>
                    {bus.bus_number}
                  </td>
                  <td className="px-4 py-3" style={{ color: isDark ? '#a0aec0' : '#4b5563' }}>
                    {bus.capacity} seats
                  </td>
                  <td className="px-4 py-3" style={{ color: isDark ? '#a0aec0' : '#4b5563' }}>
                    {bus.driver_name || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      bus.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {bus.is_active ? t('active') : t('inactive')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleEdit(bus)}
                      className="text-xs px-2 py-1 rounded border hover:opacity-80 transition btn-press text-white"
                      style={{ backgroundColor: '#1e2d5a', borderColor: '#1e2d5a' }}
                    >
                      {t('edit')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  )
}

export default ManageBuses