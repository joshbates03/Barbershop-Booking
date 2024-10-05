import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getButtonStyle, getErrorMessageStyle, getInputStyle } from '../Styles/Styles';
import HeadingText from '../Styles/HeadingText';
import BarLoader from '../Loaders/BarLoader'; // Assuming you have this component
import { useTouch } from '../../Context/TouchScreenContext';
import baseUrl from '../Config';

const ResetPassword = () => {

  const isTouchScreen = useTouch();
  const nav = useNavigate();
  const location = useLocation();
  const [userId, setUserId] = useState('');
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [resetting, setResetting] = useState(false);
  const timeoutRef = useRef(null);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const userId = queryParams.get('jHyfnKF1k');
    const token = queryParams.get('lqYt57v');

    if (userId && token) {
      setUserId(userId);
      setToken(token);
    } else {
      nav('/');
      setMessage('Invalid reset link.');
      setIsError(true);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [location.search, nav]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    if (password !== confirmPassword) {
      timeoutRef.current = setTimeout(() => {
        setMessage('Passwords do not match.');
        setIsError(true);
        setResetting(false);
      }, 1000);
      return;
    }

    setResetting(true);
    setMessage('');

    try {
      const resetPassword = await fetch(`${baseUrl}/api/Account/ResetPassword`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', },
        body: JSON.stringify({ userId, token, newPassword: password, confirmPassword }),
      });

      const resetPasswordResponse = await resetPassword.json();

      timeoutRef.current = setTimeout(() => {
        if (resetPassword.ok) {
            setMessage('Password has been reset successfully.');
            setIsError(false);
        } else {
            console.error('Backend failed to reset password:', resetPasswordResponse);
            setMessage(resetPasswordResponse.errors.$values[0]);
            setIsError(true);
        }
        setResetting(false);
    }, 1000);
    } catch (error) {
      console.error('Frontend failed to connect to backend:', error);
      timeoutRef.current = setTimeout(() => {
        setMessage('Unable to connect to the server.');
        setIsError(true);
        setResetting(false);
      }, 1000);
    }
  };

  return (
    <div className="flex    justify-center items-center  min-h-[80dvh] p-4 ">
      <div className="  max-w-sm w-full h-fit mx-auto p-6 rounded-2xl shadow-md bg-primary-dark text-white">
        <HeadingText customWidth="80%" customText="RESET PASSWORD" textSize="text-2xl" />
        <form className="mt-4" onSubmit={handleSubmit}>
          <div className="mb-5">
            <p className="flex px-0.5 text-gray-300 text-sm">New Password</p>
            <input
              type="password"
              id="password"
              className={`${getInputStyle()}`}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="mb-5">
            <p className="flex px-0.5 text-gray-300 text-sm">Confirm New Password</p>
            <input
              type="password"
              id="confirmPassword"
              className={`${getInputStyle()}`}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <div className={`${getErrorMessageStyle()} rounded-md mt-1 ${isError ? 'text-razoredgered ' : 'bg-green-500 text-green'}`}  style={{ userSelect: (message !== '') ? 'text' : 'none' }}s>
              {message || '\u00A0'}
            </div>
          </div>
          
          <button
            type="submit"
            className={`w-full ${getButtonStyle('standard', isTouchScreen)} px-6 py-3 transition duration-300 ease-in-out ${resetting ? 'bg-darker-main pointer-events-none' : ''}`}
          >
            {resetting ? <BarLoader customWidth="280px" text="" heightClass="h-6" animationDuration="1.2s" /> : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
