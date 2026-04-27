import { AlertTriangle } from 'lucide-react';

function ConfirmDialog({ message, subMessage, onConfirm, onCancel, confirmLabel = 'Delete', confirmClassName }) {
  const isDanger = !confirmClassName || confirmClassName.includes('red');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(58,46,34,0.4)' }}>
      <div className="w-full max-w-sm p-6 text-center space-y-4" style={{ backgroundColor: '#ffffff', borderRadius: '20px' }}>
        <div className="flex justify-center">
          <div className="p-4 rounded-full" style={{ backgroundColor: '#fae0d8' }}>
            <AlertTriangle className="w-8 h-8" style={{ color: '#9e4f3b' }} />
          </div>
        </div>
        <div>
          <h3 className="text-lg" style={{ fontWeight: 800, color: '#3b2e22' }}>{message}</h3>
          {subMessage && <p className="text-sm mt-1" style={{ color: '#7a6558' }}>{subMessage}</p>}
        </div>
        <div className="flex gap-3 justify-center pt-2">
          <button
            onClick={onCancel}
            className="px-6 py-2 text-sm font-semibold transition-all duration-150"
            style={{ border: '1.5px solid #e8907a', borderRadius: '12px', color: '#e8907a', backgroundColor: 'transparent' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fae0d8'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-6 py-2 text-sm font-bold text-white transition-all duration-150"
            style={{ borderRadius: '12px', backgroundColor: isDanger ? '#9e4f3b' : '#e8907a' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = isDanger ? '#7a3929' : '#d97b63'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = isDanger ? '#9e4f3b' : '#e8907a'}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;
