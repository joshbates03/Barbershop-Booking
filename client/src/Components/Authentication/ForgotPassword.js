import React, { useState, useRef } from 'react';
import HeadingText from '../Styles/HeadingText';
import { getButtonStyle, getInputStyle, getErrorMessageStyle } from '../Styles/Styles';
import BarLoader from '../Loaders/BarLoader';
import { useTouch } from '../../Context/TouchScreenContext';
import baseUrl from '../Config';

const ForgotPassword = () => {

  const isTouchScreen = useTouch();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const timeoutRef = useRef(null);

  const [sendingEmail, setSendingEmail] = useState(false);
  const handleSendEmail = async (e) => {

    e.preventDefault();
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setSendingEmail(true)
    setMessage('')

    const payload = {  email: email };

    if (email === '') {
      timeoutRef.current = setTimeout(() => {
        setIsError(true)
        setSendingEmail(false)
        setMessage('Please enter your email')
      }, 1000);
      return;
    }

    try {
      const sendReset = await fetch(`${baseUrl}/api/Account/PasswordResetRequest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      timeoutRef.current = setTimeout(() => {
        if (sendReset.ok) {
          setMessage('Sent password reset');
          setIsError(false);
        } else {
          setMessage('Sent password reset');
          setIsError(true);
        }
        setSendingEmail(false);
      }, 1000);
      
    } catch (error) {
      console.error('Error:', error);
      timeoutRef.current = setTimeout(() => {
        setIsError(true);
        setMessage('Unable to connect to the server');
        setSendingEmail(false)
      }, 1000);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[80dvh] p-4">
      <div className="max-w-sm w-full h-fit mx-auto p-6 rounded-2xl shadow-md bg-primary-dark text-white">
        <HeadingText customWidth='80%' customText='FORGOT PASSWORD?' textSize='text-2xl' />
        <form onSubmit={handleSendEmail}>
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-300" htmlFor="email">Email</label>
            <input
              type="text"
              id="email"
              className={`${getInputStyle()}`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <div className={`${getErrorMessageStyle()} rounded-md  mt-1 ${isError ? 'text-razoredgered ' : 'bg-green-500 text-green'}`}>
              {message || '\u00A0'}
            </div>
          </div>

          <button
            onClick={handleSendEmail}
            type="submit"
            className={`${getButtonStyle('standard', isTouchScreen)} w-full  px-6 py-3 transition duration-300 ease-in-out ${sendingEmail ? 'bg-darker-main pointer-events-none' : ''} `}
          >
            {sendingEmail ? <BarLoader customWidth='280px' text='' heightClass='h-6' animationDuration='1.2s' /> : 'Send Password Reset'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
