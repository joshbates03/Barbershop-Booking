import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getErrorMessageStyle, getInputStyle, getButtonStyle } from '../Styles/Styles';
import baseUrl from '../Config';
import { useTouch } from '../../Context/TouchScreenContext';
import BarLoader from '../Loaders/BarLoader';
import HeadingText from '../Styles/HeadingText';
import { LuEye, LuEyeOff } from "react-icons/lu";

const Register = () => {

  const isTouchScreen = useTouch();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registering, setRegistering] = useState(false);
  
  const timeoutRef = useRef(null); 

  const validatePhoneNumber = (number) => {
    const phoneRegex = /^(07\d{9}|44\d{10}|\+44\d{10})$/;
    return phoneRegex.test(number);
  };

  const handleSubmit = async (e) => {

    e.preventDefault();
    setErrors({});
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setRegistering(true); 
    let formErrors = {};

    if (!username) formErrors.username = 'Username is required';
    if (!email) formErrors.email = 'Email is required';
    if (!password) formErrors.password = 'Password is required';
    if (password !== confirmPassword) formErrors.confirmPassword = 'Passwords do not match';
    if (!validatePhoneNumber(phoneNumber)) formErrors.phoneNumber = 'Invalid phone number format';

    if (Object.keys(formErrors).length === 0) {
      if (!acceptTerms) {
        formErrors.acceptTerms = 'Please agree to the terms and conditions';
      }
    }

    if (Object.keys(formErrors).length !== 0) {
      timeoutRef.current = setTimeout(() => {
        setRegistering(false);
        setErrors(formErrors);
      }, 1000);
      return;
    }

    const payload = { username, email, password, confirmPassword, phoneNumber };
    
    try {
      const response = await fetch(`${baseUrl}/api/Account/Register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        credentials: 'include',
      });

      setErrors({}); 
      const data = await response.json();

      if (!response.ok) {
        timeoutRef.current = setTimeout(() => {
          setRegistering(false); 
          if (data.errors) {
            setErrors(data.errors);
          } 
        }, 1000);
        return;
      }

      timeoutRef.current = setTimeout(() => {
        setRegistering(false); 
        navigate('/signin');
      }, 1000);

    } catch (error) {
      console.error('Error:', error);
      timeoutRef.current = setTimeout(() => {
        setRegistering(false); 
      }, 1000);
    }
  };

  const basename = process.env.NODE_ENV === 'production' ? '/barbershopbooking' : '';

  return (
    <div className="flex justify-center items-center min-h-[80dvh] p-4">
      <div className="max-w-sm w-full h-fit mx-auto p-6 rounded-2xl shadow-md bg-primary-dark text-white">
      <HeadingText customWidth='35%' customText='REGISTER' textSize='text-2xl' />
        <form onSubmit={handleSubmit}>
          <div className="mb-1">
            <p className="flex px-0.5 text-gray-300 text-sm">Username</p>
            <input
              type="text"
              id="username"
              autoComplete="username"
              className={`${getInputStyle()}`}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <p className={`${getErrorMessageStyle()} mt-0.5 `} >{errors.username || '\u00A0'}</p>
          </div>
          <div className="mb-1">
            <p className="flex px-0.5 text-gray-300 text-sm">Email</p>
            <input
              id="email"
              autoComplete="username"
              className={`${getInputStyle()}`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <p className={`${getErrorMessageStyle()} mt-0.5`}>{errors.email || '\u00A0'}</p>
          </div>
          <div className="mb-1 relative">
            <p className="flex px-0.5 text-gray-300 text-sm">Password</p>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                autoComplete="new-password"
                className={`${getInputStyle()} pr-10`} 
                value={password}
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
            <p className={`${getErrorMessageStyle()} mt-0.5`}>{errors.password || '\u00A0'}</p>
          </div>
          <div className="mb-1 relative">
            <p className="flex px-0.5 text-gray-300 text-sm">Confirm Password</p>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                autoComplete="new-password"
                className={`${getInputStyle()} pr-10`} 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <div
                className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <LuEyeOff className="hover:scale-110 duration-300" />
                ) : (
                  <LuEye className="hover:scale-110 duration-300" />
                )}
              </div>
            </div>
            <p className={`${getErrorMessageStyle()} mt-0.5`}>{errors.confirmPassword || '\u00A0'}</p>
          </div>
          <div className="mb-3">
            <p className="flex px-0.5 text-gray-300 text-sm">Phone Number</p>
            <input
              type="text"
              id="phoneNumber"
              className={`${getInputStyle()}`}
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
            <p className={`${getErrorMessageStyle()} mt-0.5`}>{errors.phoneNumber || '\u00A0'}</p>
          </div>
          <hr className="border-white mb-4" />
          <div className=" ">
            <p className="text-sm mb-2">Please read the following policies carefully:</p>
            <ul className="list-disc list-inside space-y-1 items-center">
              <li>
                <a href={`${basename}/privacy-policy`} target="_blank" rel="noopener noreferrer" className="text-dark-main text-sm underline">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href={`${basename}/booking-policy`} target="_blank" rel="noopener noreferrer" className="text-dark-main text-sm underline">
                  Booking Policy
                </a>
              </li>
            </ul>

            <div className="mb-1 mt-2 flex items-center space-x-3">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="ui-checkbox"
              />
              <label htmlFor="acceptTerms" className="text-sm">
                I have read and accept the policies
              </label>
            </div>
            <p className={`${getErrorMessageStyle()}  mb-2`}>{errors.acceptTerms || '\u00A0'}</p>
          </div>
          <button
            type="submit"
            className={`${getButtonStyle('standard', isTouchScreen)} w-full px-6 py-3 transition duration-300 ease-in-out ${registering ? 'bg-darker-main pointer-events-none' : ''}`}
          >
            {registering ? <BarLoader customWidth='280px' text='' heightClass='h-6' animationDuration='1.2s' /> : 'Register'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Register;
