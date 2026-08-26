import { ShieldAlert, CheckCircle2 } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string; // null이나 undefined면 Alert 형태로 작동
  type?: 'danger' | 'success' | 'info';
  onConfirm: () => void;
  onCancel?: () => void;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = '확인',
  cancelText,
  type = 'danger',
  onConfirm,
  onCancel
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return (
          <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '8px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 size={20} style={{ color: 'var(--color-success)' }} />
          </div>
        );
      case 'danger':
      default:
        return (
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '8px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldAlert size={20} style={{ color: 'var(--color-error)' }} />
          </div>
        );
    }
  };

  const getConfirmButtonColor = () => {
    switch (type) {
      case 'success':
        return 'var(--color-success)';
      case 'danger':
      default:
        return 'var(--color-error)';
    }
  };

  return (
    <div className="modal-backdrop" style={{ zIndex: 110 }}>
      <div 
        className="modal-content" 
        style={{ 
          maxWidth: '400px',
          background: 'rgba(17, 24, 39, 0.85)',
          backdropFilter: 'blur(16px)',
          border: '1px solid var(--color-divider)',
          borderRadius: '16px',
          boxShadow: 'var(--shadow-lg)'
        }}
      >
        <div className="modal-header" style={{ padding: '20px 24px', borderBottom: 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
          {getIcon()}
          <h3 className="modal-title" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            {title}
          </h3>
        </div>

        <div className="modal-body" style={{ padding: '0 24px 24px 24px', fontSize: '14px', color: 'var(--color-text-muted)', lineHeight: '1.6' }}>
          {message}
        </div>

        <div className="modal-footer" style={{ 
          padding: '16px 24px', 
          borderTop: 'none', 
          display: 'flex', 
          justifyContent: 'flex-end', 
          gap: '12px',
          backgroundColor: 'transparent'
        }}>
          {cancelText && onCancel && (
            <button 
              type="button" 
              className="btn-secondary" 
              style={{ padding: '8px 16px', height: '38px', borderRadius: '8px' }}
              onClick={onCancel}
            >
              {cancelText}
            </button>
          )}
          <button 
            type="button" 
            className="btn-primary" 
            style={{ 
              padding: '8px 16px', 
              height: '38px', 
              borderRadius: '8px',
              backgroundColor: getConfirmButtonColor(),
              color: type === 'success' ? 'var(--color-text-inverted)' : '#ffffff',
              border: 'none'
            }}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
