import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { useTranslation } from 'react-i18next'
import { useLanguage } from '../../context/LanguageContext'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import io from 'socket.io-client'
import api from '../../api'
import Toast from '../../components/Toast'
import L from 'leaflet'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// إحداثيات جامعة الإسراء
const ISRA_UNIVERSITY = { lat: 31.9454, lng: 35.9284 }

const RouteColors = ['#1e2d5a', '#8B1A2B', '#2d7a4f']
const RouteLabels = ['🟢 Fastest', '🔵 Shortest', '🟡 Alternative']

const FitBounds = ({ bounds }) => {
  const map = useMap()
  useEffect(() => {
    if (bounds) map.fitBounds(bounds, { padding: [40, 40] })
  }, [bounds])
  return null
}

const GPSActive = () => {
  const [status, setStatus] = useState('Connecting...')
  const [coords, setCoords] = useState(null)
  const [error, setError] = useState('')
  const [ending, setEnding] = useState(false)
  const [toast, setToast] = useState(null)
  const [routes, setRoutes] = useState([])
  const [selectedRoute, setSelectedRoute] = useState(0)
  const [destination, setDestination] = useState(null)
  const [loadingRoutes, setLoadingRoutes] = useState(false)
  const [tripArea, setTripArea] = useState('')

  const socketRef = useRef(null)
  const watchRef = useRef(null)

  const { user } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const { t } = useTranslation()
  const { isArabic, toggleLanguage } = useLanguage()
  const navigate = useNavigate()

  const params = new URLSearchParams(window.location.search)
  const trip_id = params.get('trip_id')
  const driver_id = params.get('driver_id')
  const area = params.get('area')
  const direction = params.get('direction')

  useEffect(() => {
    if (!trip_id || !driver_id) {
      navigate('/my-trip')
      return
    }

    if (area) {
      setTripArea(area)
      fetchRoutes(area, direction)
    }

    socketRef.current = io('http://localhost:3000')

    socketRef.current.on('connect', () => {
      setStatus('Broadcasting')
      setToast({ message: '📡 GPS Broadcasting started!', type: 'success' })
      socketRef.current.emit('join_trip', trip_id)
    })

    socketRef.current.on('disconnect', () => {
      setStatus('Disconnected')
    })

    if (navigator.geolocation) {
      watchRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          setCoords({ latitude, longitude })
          socketRef.current?.emit('update_location', {
            trip_id: parseInt(trip_id),
            driver_id: parseInt(driver_id),
            latitude,
            longitude
          })
        },
        (err) => {
          setError('GPS not available: ' + err.message)
          setToast({ message: 'GPS not available', type: 'error' })
        },
        { enableHighAccuracy: true, timeout: 5000 }
      )
    } else {
      setError('Geolocation is not supported by your browser')
    }

    return () => {
      socketRef.current?.disconnect()
      if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current)
    }
  }, [])

  const fetchRoutes = async (areaName, dir) => {
    setLoadingRoutes(true)
    try {
      // 1. Geocoding — get destination coordinates
      const geoRes = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(areaName + '، الأردن')}&format=json&limit=1`,
        { headers: { 'Accept-Language': 'ar' } }
      )
      const geoData = await geoRes.json()

      if (!geoData || geoData.length === 0) {
        setToast({ message: 'Could not find destination location', type: 'error' })
        return
      }

      const destLat = parseFloat(geoData[0].lat)
      const destLng = parseFloat(geoData[0].lon)
      setDestination({ lat: destLat, lng: destLng })

      // from_university → destination, to_university → from destination
      const from = dir === 'from_university'
        ? [ISRA_UNIVERSITY.lng, ISRA_UNIVERSITY.lat]
        : [destLng, destLat]
      const to = dir === 'from_university'
        ? [destLng, destLat]
        : [ISRA_UNIVERSITY.lng, ISRA_UNIVERSITY.lat]

      // 2. Get routes from OpenRouteService
      const orsRes = await fetch(
        'https://api.openrouteservice.org/v2/directions/driving-car/geojson',
        {
          method: 'POST',
          headers: {
            'Authorization': import.meta.env.VITE_ORS_API_KEY,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            coordinates: [from, to],
            alternative_routes: {
              target_count: 3,
              weight_factor: 1.6
            }
          })
        }
      )

      const orsData = await orsRes.json()

      if (orsData.features && orsData.features.length > 0) {
        const parsedRoutes = orsData.features.map((feature, index) => {
          const coords = feature.geometry.coordinates.map(([lng, lat]) => [lat, lng])
          const summary = feature.properties.summary
          return {
            coords,
            distance: (summary.distance / 1000).toFixed(1),
            duration: Math.round(summary.duration / 60),
            label: RouteLabels[index] || `Route ${index + 1}`,
            color: RouteColors[index] || '#666'
          }
        })
        setRoutes(parsedRoutes)
        setToast({ message: `🗺️ ${parsedRoutes.length} routes found!`, type: 'success' })
      }
    } catch (err) {
      console.error('Route fetch error:', err)
      setToast({ message: 'Failed to load routes', type: 'error' })
    } finally {
      setLoadingRoutes(false)
    }
  }

  const handleEndTrip = async () => {
    setEnding(true)
    try {
      await api.patch(`/trips/${trip_id}/complete`)
    } catch (error) {
      console.error('Failed to complete trip:', error)
    } finally {
      socketRef.current?.disconnect()
      if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current)
      navigate('/my-trip')
    }
  }

  const mapBounds = routes.length > 0 && routes[selectedRoute]
    ? routes[selectedRoute].coords
    : null

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
        <div className="flex items-center gap-3">
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
        </div>
      </nav>

      <div className="max-w-2xl mx-auto py-6 px-4">
        <h2 className="text-lg font-semibold mb-4 fade-in"
          style={{ color: isDark ? '#ffffff' : '#1e2d5a' }}>
          {t('tripInProgress')} {tripArea && `— ${tripArea}`}
        </h2>

        {/* Status */}
        <div className="rounded-xl shadow-sm p-4 mb-4 fade-in"
          style={{ backgroundColor: isDark ? '#1a1d27' : 'white' }}>
          <div className="flex items-center gap-3 p-3 rounded-lg mb-3"
            style={{ backgroundColor: isDark ? '#0f1117' : '#f0f3fa' }}>
            <div className={`w-3 h-3 rounded-full ${
              status === 'Broadcasting' ? 'bg-green-500 pulse' :
              status === 'Disconnected' ? 'bg-red-500' :
              'bg-yellow-500 pulse'
            }`} />
            <span className={`font-medium text-sm ${
              status === 'Broadcasting' ? 'text-green-600' :
              status === 'Disconnected' ? 'text-red-600' :
              'text-yellow-600'
            }`}>
              {status === 'Broadcasting' ? t('broadcastingLive') :
               status === 'Disconnected' ? t('disconnected') :
               t('connectingStatus')}
            </span>
          </div>

          {coords && (
            <div className="grid grid-cols-2 gap-4 text-center p-3 rounded-lg"
              style={{ backgroundColor: isDark ? '#0f1117' : '#f0f3fa' }}>
              <div>
                <div className="text-xs mb-1" style={{ color: isDark ? '#a0aec0' : '#6b7280' }}>
                  {t('latitude')}
                </div>
                <div className="font-semibold text-sm" style={{ color: '#1e2d5a' }}>
                  {coords.latitude.toFixed(5)}
                </div>
              </div>
              <div>
                <div className="text-xs mb-1" style={{ color: isDark ? '#a0aec0' : '#6b7280' }}>
                  {t('longitude')}
                </div>
                <div className="font-semibold text-sm" style={{ color: '#1e2d5a' }}>
                  {coords.longitude.toFixed(5)}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Routes */}
        {loadingRoutes && (
          <div className="rounded-xl p-4 mb-4 text-center fade-in"
            style={{ backgroundColor: isDark ? '#1a1d27' : 'white' }}>
            <p className="text-sm text-gray-500">🗺️ Loading routes...</p>
          </div>
        )}

        {routes.length > 0 && (
          <div className="rounded-xl shadow-sm p-4 mb-4 fade-in"
            style={{ backgroundColor: isDark ? '#1a1d27' : 'white' }}>
            <h3 className="font-semibold text-sm mb-3"
              style={{ color: isDark ? '#ffffff' : '#1e2d5a' }}>
              🗺️ Suggested Routes
            </h3>

            <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
              {routes.map((route, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedRoute(index)}
                  className="flex-shrink-0 px-3 py-2 rounded-lg text-xs font-medium transition btn-press"
                  style={selectedRoute === index ? {
                    backgroundColor: RouteColors[index],
                    color: 'white'
                  } : {
                    backgroundColor: isDark ? '#0f1117' : '#f0f3fa',
                    color: isDark ? '#a0aec0' : '#1e2d5a',
                    border: `1.5px solid ${RouteColors[index]}`
                  }}
                >
                  <div>{route.label}</div>
                  <div className="mt-0.5 opacity-80">
                    {route.distance} km · {route.duration} min
                  </div>
                </button>
              ))}
            </div>

            {/* Map */}
            <div className="rounded-xl overflow-hidden border-2"
              style={{ borderColor: RouteColors[selectedRoute], height: '320px' }}>
              <MapContainer
                center={[ISRA_UNIVERSITY.lat, ISRA_UNIVERSITY.lng]}
                zoom={12}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; OpenStreetMap contributors'
                />

                {mapBounds && <FitBounds bounds={mapBounds} />}

                {/* All routes - faded */}
                {routes.map((route, index) => (
                  index !== selectedRoute && (
                    <Polyline
                      key={index}
                      positions={route.coords}
                      color={RouteColors[index]}
                      weight={3}
                      opacity={0.3}
                    />
                  )
                ))}

                {/* Selected route - bold */}
                {routes[selectedRoute] && (
                  <Polyline
                    positions={routes[selectedRoute].coords}
                    color={RouteColors[selectedRoute]}
                    weight={5}
                    opacity={0.9}
                  />
                )}

                {/* University marker */}
                <Marker position={[ISRA_UNIVERSITY.lat, ISRA_UNIVERSITY.lng]}>
                  <Popup>🏫 Isra University</Popup>
                </Marker>

                {/* Destination marker */}
                {destination && (
                  <Marker position={[destination.lat, destination.lng]}>
                    <Popup>📍 {tripArea}</Popup>
                  </Marker>
                )}

                {/* Driver location */}
                {coords && (
                  <Marker position={[coords.latitude, coords.longitude]}>
                    <Popup>🚌 You are here</Popup>
                  </Marker>
                )}

              </MapContainer>
            </div>

            {/* Selected route info */}
            <div className="mt-3 p-3 rounded-lg text-center"
              style={{ backgroundColor: isDark ? '#0f1117' : '#f0f3fa' }}>
              <p className="text-sm font-medium" style={{ color: RouteColors[selectedRoute] }}>
                {routes[selectedRoute]?.label}
              </p>
              <p className="text-xs mt-1" style={{ color: isDark ? '#a0aec0' : '#6b7280' }}>
                📏 {routes[selectedRoute]?.distance} km · ⏱️ {routes[selectedRoute]?.duration} min
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200 fade-in">
            {error}
          </div>
        )}

        <button
          onClick={handleEndTrip}
          disabled={ending}
          className="w-full text-white py-3 rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition btn-press"
          style={{ backgroundColor: '#8B1A2B' }}
        >
          {ending ? t('endingTrip') : t('endTrip')}
        </button>

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

export default GPSActive