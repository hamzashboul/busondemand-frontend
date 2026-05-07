const ConfirmModal = ({ message, onConfirm, onCancel }) => {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        zIndex: 9998,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <div
        className="fade-in"
        style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '28px',
          width: '320px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
          borderTop: '4px solid #8B1A2B'
        }}
      >
        <div className="text-center mb-4">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
            style={{ backgroundColor: '#fff0f0' }}
          >
            <span style={{ fontSize: '24px' }}>⚠️</span>
          </div>
          <h3 className="font-bold text-base mb-2" style={{ color: '#1e2d5a' }}>
            Are you sure?
          </h3>
          <p className="text-sm text-gray-500">{message}</p>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onCancel}
            className="flex-1 border-2 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition btn-press"
            style={{ borderColor: '#1e2d5a', color: '#1e2d5a' }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 text-white py-2 rounded-xl text-sm font-medium hover:opacity-90 transition btn-press"
            style={{ backgroundColor: '#8B1A2B' }}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmModal