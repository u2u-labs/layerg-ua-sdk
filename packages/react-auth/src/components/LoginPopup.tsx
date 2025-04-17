import React from 'react';
import { LoginUI } from './LoginUI';

interface LoginPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (user: any) => void;
  title?: string;
  logoUrl?: string;
}

export const LoginPopup: React.FC<LoginPopupProps> = ({
  isOpen,
  onClose,
  onSuccess,
  title,
  logoUrl
}) => {
  if (!isOpen) return null;

  // Success handler that also closes the popup
  const handleSuccess = (user: any) => {
    if (onSuccess) {
      onSuccess(user);
    }
    onClose();
  };

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          maxWidth: '450px',
          width: '100%',
          position: 'relative',
          padding: '20px'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: 'none',
            border: 'none',
            fontSize: '20px',
            cursor: 'pointer'
          }}
          onClick={onClose}
        >
          ✕
        </button>
        
        <LoginUI 
          onSuccess={handleSuccess}
          title={title}
          logoUrl={logoUrl}
        />
      </div>
    </div>
  );
};