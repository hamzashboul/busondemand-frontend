import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api'

const Login = () => {
  const [universityId, setUniversityId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const response = await api.post('/auth/login', {
        university_id: universityId,
        password: password
      })
      login({
        token: response.data.token,
        role: response.data.role,
        name: response.data.name,
        id: response.data.id
      })
      if (response.data.role === 'student') navigate('/trips')
      else if (response.data.role === 'admin') navigate('/dashboard')
      else if (response.data.role === 'driver') navigate('/my-trip')
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">

      {/* Left Side - University Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center"
        style={{ backgroundColor: '#1e2d5a' }}>
        <div className="text-center px-12">
          <div className="mb-6">
            <img
              src="/logo.png"
              alt="Isra University"
              className="w-32 h-32 mx-auto mb-4 object-contain"
            />
           
          </div>
          <div className="w-16 h-1 mx-auto mb-6 rounded" style={{ backgroundColor: '#8B1A2B' }}></div>
          <h3 className="text-white text-2xl font-bold mb-3">BusOnDemand</h3>
          <p className="text-blue-200 text-sm leading-relaxed">
            Smart Transportation Booking System
          </p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-gray-50 px-8">
        <div className="w-full max-w-md">

          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <img
              src="/logo.png"
              alt="Isra University"
              className="w-16 h-16 mx-auto mb-3 object-contain"
            />
            <h1 className="text-xl font-bold" style={{ color: '#1e2d5a' }}>BusOnDemand</h1>
            <p className="text-gray-500 text-sm">Isra University</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-1" style={{ color: '#1e2d5a' }}>Welcome Back</h2>
              <p className="text-gray-500 text-sm">Sign in to your account</p>
            </div>

            <form onSubmit={handleLogin}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2" style={{ color: '#1e2d5a' }}>
                  University ID
                </label>
                <input
                  type="text"
                  value={universityId}
                  onChange={(e) => setUniversityId(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors"
                  onFocus={(e) => e.target.style.borderColor = '#1e2d5a'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                  placeholder="e.g. AF0684"
                  required
                />
              </div>

              <div className="mb-5">
                <label className="block text-sm font-medium mb-2" style={{ color: '#1e2d5a' }}>
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors"
                  onFocus={(e) => e.target.style.borderColor = '#1e2d5a'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                  placeholder="••••••••"
                  required
                />
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-xl text-sm text-center bg-red-50 text-red-600 border border-red-200">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full text-white py-3 rounded-xl text-sm font-semibold transition-opacity disabled:opacity-50 hover:opacity-90"
                style={{ backgroundColor: '#8B1A2B' }}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-100 text-center">
              <p className="text-xs text-gray-400">
                Isra University — Transportation System
              </p>
            </div>
          </div>

        </div>
      </div>

    </div>
  )
}

export default Login