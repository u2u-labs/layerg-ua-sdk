import { ReactNode, useMemo } from 'react';
import ReactDOM from 'react-dom';
import '../assets/styles/login-popup.scss';
import { useLoginPopup } from '../hooks/useLoginPopup';
import { LoginUI } from './LoginUI';

interface Props {
  isOpen?: boolean;
  onClose?: () => void;
  onSuccess?: (user: any) => void;
  title?: string;
  logoUrl?: string;
  children?: ReactNode;
}

export const LoginPopup = ({
  isOpen = undefined,
  onClose = undefined,
  // onSuccess = undefined,
  title,
}: Props) => {
  const { isOpen: isOpenPopup, closeLoginPopup } = useLoginPopup();

  const isOpenReal = useMemo(() => {
    if (isOpen !== undefined) {
      return isOpen;
    }

    return isOpenPopup;
  }, [isOpen, isOpenPopup]);

  const handleOnClose = () => {
    if (typeof onClose !== 'undefined') {
      onClose();
    } else {
      closeLoginPopup();
    }
  };

  // Success handler that also closes the popup
  // const handleSuccess = (user: any) => {
  //   if (onSuccess) {
  //     onSuccess(user);
  //   }
  //   handleOnClose();
  // };

  return (
    typeof document !== 'undefined' &&
    typeof window !== 'undefined' &&
    ReactDOM.createPortal(
      <div
        style={{
          display: isOpenReal ? 'flex' : 'none',
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) handleOnClose();
        }}
        className="layerg-login-popup-background"
      >
        <div
          className="layerg-login-popup-block"
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <div className="layerg-login-popup-content">
            <div
              className="layerg-login-popup-btn-close"
              onClick={(e) => {
                e.stopPropagation();

                handleOnClose();
              }}
            >
              ✕
            </div>
            <LoginUI
              // onSuccess={handleSuccess}
              title={title}
              // logoUrl={logoUrl}
            />
          </div>
        </div>
      </div>,
      document.body,
    )
  );

  return;
};
