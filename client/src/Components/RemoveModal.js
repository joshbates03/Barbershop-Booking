import React from 'react';
import HeadingText from './Styles/HeadingText';
import BarLoader from './Loaders/BarLoader';
import { getButtonStyle, getErrorMessageStyle } from './Styles/Styles';
import { useTouch } from '../Context/TouchScreenContext';

const RemoveModal = ({ title, body, action, cancel, message = '', loading = false }) => {
  
  const isTouchScreen = useTouch();

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-secondary-dark text-white rounded-3xl shadow-md w-full max-w-md duration-300 scale-in-center">
        <div className="p-4">
          <HeadingText customText={title} customWidth='100%' textSize='text-2xl' />
          <p className="text-base">{body}</p>
          <p className={`${getErrorMessageStyle()}`} style={{ userSelect: message ? 'text' : 'none' }}>
            {message || '\u00A0'}
          </p>
          <div className="flex justify-end">
            <button
              onClick={action}
              className={`${getButtonStyle('standard', isTouchScreen)} w-24 mr-2 px-4 py-2 mt-2 ${loading ? 'pointer-events-none !bg-darker-main' : ''}`}
            >
              {loading ? <BarLoader text='' heightClass='h-4' animationDuration='1.2s' customWidth='65px' /> : 'Confirm'}
            </button>
            <button
              onClick={loading ? null : cancel}
              className={`${getButtonStyle('cancel', isTouchScreen)} w-24 px-4 py-2 mt-2`}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RemoveModal;
