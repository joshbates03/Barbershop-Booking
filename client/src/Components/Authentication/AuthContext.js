import React, { createContext, useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import HeadingText from '../Styles/HeadingText';
import { getButtonStyle } from '../Styles/Styles';
import BarLoader from '../Loaders/BarLoader';
import { useTouch } from '../../Context/TouchScreenContext';
import baseUrl from '../Config';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const isTouchScreen = useTouch();
    const navigate = useNavigate();
    const location = useLocation();
    const [isLoggedIn, setIsLoggedIn] = useState(null);
    const [isAdmin, setIsAdmin] = useState(null);
    const [isBarber, setIsBarber] = useState(null);
    const [userId, setUserId] = useState('');
    const [username, setUsername] = useState('');
    const [expires, setExpires] = useState(null);
    const [showExpiryAlert, setShowExpiryAlert] = useState(false);
    const [hasShownAlert, setHasShownAlert] = useState(false);
    const [failure, setFailure] = useState(false);
    const [failureType, setFailureType] = useState('');
    const timeoutRef = useRef(null);
    
    const logout = useCallback(async (skipNavigate = false) => {
        try {
            const attemptLogout = await fetch(`${baseUrl}/api/Account/Logout`, {
                method: 'POST',
                credentials: 'include',
            });
            if (!attemptLogout.ok) throw new Error('Network response was not ok');
            setShowExpiryAlert(false);
            setIsLoggedIn(false);
            setIsAdmin(false);
            setIsBarber(false);
            setExpires(null)
            setUserId('');
            setUsername('');
            
            !skipNavigate && navigate('/');
        } catch (error) {
            console.error('Error:', error);
        }
    }, [ navigate]);

    const validateToken = useCallback(async (reset = false) => {
        try {
            const tokenValidation = await fetch(`${baseUrl}/api/Account/ValidateToken`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
            });
    
            const tokenValidationResponse = await tokenValidation.json();
    
            if (tokenValidation.ok) {
                if (tokenValidationResponse.message === 'Token is valid') {
                    setUserId(tokenValidationResponse.userId);
                    setUsername(tokenValidationResponse.userName);
                    setIsLoggedIn(true);
                    setExpires(new Date(tokenValidationResponse.expiryTime));
                    setShowExpiryAlert(false);
                    setHasShownAlert(false);
                    setFailure(false);
                    if (tokenValidationResponse.roles?.$values) {
                        tokenValidationResponse.roles.$values.forEach((role) => {
                            if (role === 'Admin') setIsAdmin(true);
                            if (role === 'Barber') setIsBarber(true);
                        });
                    }
                    if (reset) {
                        timeoutRef.current = setTimeout(() => setRefreshingToken(false), 1000);
                    }
                } else if (location.pathname !== '/') {
                    setFailure(true);
                    setIsLoggedIn(false);
                    setFailureType('backend_error');
                }
            } else {
                setIsLoggedIn(false);
                const skipPaths = ['/gallery', '/signin', '/register', '/privacy-policy', '/booking-policy'];
                location.pathname !== '/' && !skipPaths.includes(location.pathname) ? logout() : logout(true);
            }
        } catch {
            location.pathname !== '/' && setFailure(true) && setFailureType('network_error');
        }
    }, [logout, location.pathname]);
    
    
    const [refreshingToken, setRefreshingToken] = useState(false);
    const refreshToken = async () => {
        try {
            setRefreshingToken(true);
     
            const refreshToken = await fetch(`${baseUrl}/api/Account/RefreshToken`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userId),
            });
            const refreshTokenResponse = await refreshToken.json();
            if (refreshToken.ok && refreshTokenResponse.message === 'Refresh successful') {
                validateToken(true);
            } else {
                setTimeout(() => logout(), 1000);
            }
        } catch {
            setTimeout(() => logout(), 1000);
        }
    };

    useEffect(() => {
        validateToken();
        return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
    }, [validateToken]);

    useEffect(() => {
        const interval = setInterval(() => expires && new Date() >= expires && validateToken(true), 60000);
        return () => clearInterval(interval);
    }, [expires, validateToken]);

    useEffect(() => {
        const alertInterval = setInterval(() => {
            if (expires) {
                const timeRemaining = (expires - new Date()) / 1000;
                if (timeRemaining <= 60 && timeRemaining > 0 && !showExpiryAlert && !hasShownAlert) {
                    setShowExpiryAlert(true);
                    setHasShownAlert(true);
                }
            }
        }, 10000);
        return () => clearInterval(alertInterval);
    }, [expires, showExpiryAlert, hasShownAlert]);

    const login = () => validateToken();
   
    useEffect(() => {
        if (showExpiryAlert) {
          document.body.style.overflow = 'hidden';
        } else {
          document.body.style.overflow = 'auto';
        }
    
        return () => {
          document.body.style.overflow = 'auto';
        };
      }, [showExpiryAlert]);

    return (
        <AuthContext.Provider value={{ isLoggedIn, login, logout, isAdmin, isBarber, userId, username, refreshToken, failure, failureType, validateToken }}>
            {children}
            {showExpiryAlert && (
                <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-secondary-dark text-white rounded-2xl shadow-lg w-full max-w-md duration-300 scale-in-center">
                        <div className="p-4">
                            <HeadingText customText={'SESSION EXPIRY'} customWidth={'100%'} textSize='text-2xl' />
                            <span className="block mb-2 md:text-base text-sm duration-300">Your session will expire in less than a minute.</span>
                            <div className="flex justify-end">
                                <button
                                    onClick={refreshingToken ? null : refreshToken}
                                    className={`${getButtonStyle('standard', isTouchScreen)} w-24 px-4 py-2 mt-2 ${refreshingToken ? 'pointer-events-none bg-darker-main' : ''}`}
                                >
                                    {refreshingToken ? <BarLoader text='' heightClass='h-0' animationDuration='1.2s' customWidth='60px' /> : 'Refresh'}
                                </button>
                                <button onClick={() => setShowExpiryAlert(false)} className={`${getButtonStyle('cancel', isTouchScreen)} w-24 ml-2 px-4 py-2 mt-2`}>
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AuthContext.Provider>
    );
};
