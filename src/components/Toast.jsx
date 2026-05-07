import { useEffect, useState } from 'react'

const Toast = ({ message, type = 'success', onClose }) => {
  const [hiding, setHiding] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setHiding(true)
      setTimeout(onClose, 300)
    }, 3000)
    return () => clearTimeout(timer)
  }, [])

  const icon = type === 'success' ? '✅' : '❌'

  return (
    <div className={`toast ${type} ${hiding ? 'hide' : ''}`}>
      <span>{icon}</span>
      <span>{message}</span>
    </div>
  )
}

export default Toast