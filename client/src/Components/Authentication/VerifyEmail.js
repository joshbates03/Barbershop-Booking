import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import HeadingTextAlt from '../Styles/HeadingTextAlt';
import baseUrl from '../Config';

const VerifyEmail = () => {

  const timeoutRef = useRef(null);
  const location = useLocation();
  const nav = useNavigate();
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [verifying, setVerifying] = useState(false);

  const verifyEmail = useCallback(async () => {
    const queryParams = new URLSearchParams(location.search);
    const userId = queryParams.get('X7dxcsafs');
    const token = queryParams.get('7NSmdnsid');

    if (!userId || !token) {
      setTitle('FAILURE');
      setSubtitle('INCORRECT OR INVALID LINK');
      nav('/');
      return;
    }

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setVerifying(true);

    try {
      const response = await fetch(`${baseUrl}/api/Account/VerifyEmail?userId=${userId}&token=${encodeURIComponent(token)}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      timeoutRef.current = setTimeout( async () => {
        if (response.ok) {
          setTitle('SUCCESS');
          setSubtitle('YOUR EMAIL HAS BEEN VERIFIED');
        } else {
          const data = await response.json();
          console.error('Backend failed to verify email:', data.message);
          setTitle('FAILURE');
          setSubtitle('INCORRECT OR INVALID LINK');
        }
        setVerifying(false);
      }, 1000);
    } catch (error) {
      console.error('Frontend failed to connect to backend:', error);
      timeoutRef.current = setTimeout(() => {
        setTitle('FAILURE');
        setSubtitle('INCORRECT OR INVALID LINK');
        setVerifying(false);
      }, 1000);
    }
  }, [location.search, nav]);


  useEffect(() => {
    verifyEmail();
  }, [location.search, verifyEmail]);

  return (
    <div className='min-h-[80vh] flex flex-col items-center justify-center'>
      {verifying ? (
        <HeadingTextAlt title={'Verifying'} subtitle={'Please wait'} titleSize='md:text-2xl text-xl' subtitleSize='text-lg md:text-xl' />
      ) : (
        <HeadingTextAlt title={title} subtitle={subtitle} titleSize='md:text-2xl text-xl' subtitleSize='text-lg md:text-xl' />
      )}
    </div>
  );
};

export default VerifyEmail;
