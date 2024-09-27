import React, { useState, useContext, useEffect, useRef } from 'react';
import baseUrl from '../Config';
import { AuthContext } from './AuthContext';
import HeadingText from '../Styles/HeadingText';
import { useNavigate } from 'react-router-dom';
import { getButtonStyle, getErrorMessageStyle, getInputStyle } from '../Styles/Styles';
import { useTouch } from '../../Context/TouchScreenContext';
import BarLoader from '../Loaders/BarLoader';
import { LuEye } from "react-icons/lu";
import { LuEyeOff } from "react-icons/lu";

const SignIn = () => {

  const isTouchScreen = useTouch();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false)
  const [signingIn, setSigningIn] = useState(false);
  const { login, isLoggedIn } = useContext(AuthContext);

  const timeoutRef = useRef(null);


  useEffect(() => {
    if (isLoggedIn) navigate('/profile');
  }, [isLoggedIn, navigate]);

  const handleSignIn = async (e) => {

    e.preventDefault();
    setMessage('');
    setSigningIn(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    if (!email || !password) {
      timeoutRef.current = setTimeout(() => {
        setSigningIn(false);
        setMessage('Please fill in all fields');
      }, 1000);
      return;
    }

    try {
      const signIn = await fetch(`${baseUrl}/api/Account/Login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: email, password }),
        credentials: 'include',
      });

      const signInResponse = await signIn.json();

      timeoutRef.current = setTimeout(() => {
        if (signIn.ok) {
          login();
        } else {
          setMessage(signInResponse.message);
        }
        setSigningIn(false);
      }, 1000);

    } catch {
      timeoutRef.current = setTimeout(() => {
        setSigningIn(false);
        setMessage('Unable to connect to the server');
      }, 1000);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[80vh] p-4">
      <div className="max-w-sm w-full h-fit mx-auto p-6 rounded-2xl shadow-md bg-primary-dark text-white">
      <HeadingText customWidth='35%' customText='SIGN IN' textSize='text-2xl' />
        <form onSubmit={handleSignIn}>
          <div className="mb-3">
            <p className="flex px-0.5 text-gray-300 text-sm">Username</p>
            <input
              type="text"
              id="email"
              className={getInputStyle()}
              value={email}
              autoComplete="username"
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="mb-1.5 relative">
            <p className="flex px-0.5 text-gray-300 text-sm">Password</p>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                className={`${getInputStyle()} pr-10`}
                value={password}
                autoComplete="current-password"
                onChange={(e) => setPassword(e.target.value)}
              />
              <div
                className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <LuEyeOff className="hover:scale-110 duration-300" />
                ) : (
                  <LuEye className="hover:scale-110 duration-300" />
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col mb-5">
            <button type="button" className="text-dark-main text-sm font-light ml-auto" onClick={() => navigate('/forgot-password')}>
              Forgot password?
            </button>
            <p className={getErrorMessageStyle()} style={{ userSelect: message ? 'text' : 'none' }}>
              {message || '\u00A0'}
            </p>
          </div>
          <button
            type="submit"
            className={`${getButtonStyle('standard', isTouchScreen)} w-full px-6 py-3 transition duration-300 ease-in-out ${signingIn ? 'bg-darker-main pointer-events-none' : ''}`}
          >
            {signingIn ? <BarLoader customWidth='280px' text='' heightClass='h-6' animationDuration='1.2s' /> : 'Sign In'}
          </button>
          <p className="text-white mt-6 text-center text-sm font-light">
            Don't have an account? <button className="text-dark-main ml-1 font-light" onClick={() => navigate('/register')}>Click here</button>
          </p>
        </form>
      </div>
    </div>
  );
};

export default SignIn;
