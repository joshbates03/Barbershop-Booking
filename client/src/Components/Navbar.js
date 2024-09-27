import React, { useState, useEffect, useContext, useLayoutEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from './Authentication/AuthContext';
import HeadingTextAlt from './Styles/HeadingTextAlt';
import logo from '../Images/logo.png';
import RemoveModal from './RemoveModal';
import HeadingText from './Styles/HeadingText';
import Banner from './Banner';
import { RxCross2 } from 'react-icons/rx';
import { FaBars, FaTimes } from 'react-icons/fa';
import { IoMdNotifications } from "react-icons/io";
import baseUrl from './Config';
import * as signalR from '@microsoft/signalr';

const Navbar = ({ darkMode, toggleDarkMode }) => {

  const navigate = useNavigate();
  const { isLoggedIn, logout } = useContext(AuthContext);
  const { isAdmin } = useContext(AuthContext);
  const { isBarber } = useContext(AuthContext);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const [links, setLinks] = useState([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [popupNotif, setPopupNotif] = useState(null);

  const timeoutRef = useRef(null);

  useEffect(() => {
      setTimeout(() => {
        setLoading(false);
      }, 1000);
  }, []);

  // SignalR websocket
  useEffect(() => {
    if (isAdmin) {
      const connection = new signalR.HubConnectionBuilder()
        .withUrl(`${baseUrl}/bookingHub`, { withCredentials: true })
        .withAutomaticReconnect()
        .configureLogging(signalR.LogLevel.Error)
        .build();

      connection.start()
        .then()
        .catch(err => console.error('SignalR Connection Error: ', err));

      connection.on('ReceiveBookingUpdate', (date, userId_, admin, showNotif) => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        if (showNotif && showNotif.message) {
          setPopupNotif({
            messageType: showNotif.messageType,
            message: showNotif.message,
            date: new Date(showNotif.date).toLocaleString('en-GB', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            }),
          });

          setNotifications(prevNotifications => [
            {
              messageType: showNotif.messageType,
              message: showNotif.message,
              date: showNotif.date
            },
            ...prevNotifications
          ]);

          timeoutRef.current = setTimeout(() => {
            setPopupNotif(null);
          }, 5000);
        }
      });

      return () => {
        if (connection) {
          connection.stop();
        }
      };
    }
  }, [isAdmin]);

  // Fetch notifications if the user is an admin
  const fetchNotifications = async () => {
    if (!isAdmin && !isBarber) return;
  
    try {
      setLoadingNotifications(true);
  
      const getNotiflications = await fetch(`${baseUrl}/api/userActivity/Notiflications`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
  
      const getNotiflicationsResponse = await getNotiflications.json();
   
      if (getNotiflications.ok) {
        setNotifications(getNotiflicationsResponse.$values.reverse());
        setError('');
      } else {
        setError('Failed to fetch notifications');
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setError('Unable to connect to the server');
    } finally {
      setLoadingNotifications(false);
    }
  };
  
  const menuNavigate = useCallback((url) => {
    setMenuOpen(false);
    navigate(url);
  }, [navigate]);

  // Determines what links will be visible on the menus
  useLayoutEffect(() => {
    if (isLoggedIn !== false || isAdmin != null || isBarber != null) {
      setLinks([
        { id: 1, link: 'Home', onClick: () => menuNavigate('/') },
        { id: 2, link: 'Gallery', onClick: () => menuNavigate('/gallery') },
        !isLoggedIn && { id: 3, link: 'Sign In', onClick: () => menuNavigate('/signin') },
        !isLoggedIn && { id: 4, link: 'Register', onClick: () => menuNavigate('/register') },
        isLoggedIn && { id: 5, link: 'Book', onClick: () => menuNavigate('/book') },
        isLoggedIn && { id: 6, link: 'Profile', onClick: () => menuNavigate('/profile') },
        (isAdmin || isBarber) && { id: 7, link: 'Admin', onClick: () => menuNavigate('/admin-hub') },
        isLoggedIn && { id: 8, link: 'Logout', onClick: () => setShowLogout(true) },
      ].filter(Boolean));
    }
  }, [isLoggedIn, isAdmin, isBarber, menuNavigate]);

  // Logging out 
  const [loggingOut, setLoggingOut] = useState(false);
  const handleLogout = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setLoggingOut(true);
    timeoutRef.current = setTimeout(() => {
      setShowLogout(false);
      setLoggingOut(false);
      logout();
    }, 1000);
  };

  // Toggle notifications sidebar
  const toggleNotifications = () => {
    setNotificationsOpen(!notificationsOpen);
    if (!notificationsOpen && (isAdmin || isBarber)) {
      if (notifications.length === 0) {
        fetchNotifications();
      }
    }
  };

  // Disable scroll when a pop up is open
  useEffect(() => {
    if (showLogout || menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [showLogout, menuOpen]);

  return (
    <div className="z-50">
      <Banner />
      <div className="flex justify-between items-center w-full h-16 px-4 bg-black">
        <div className="md:flex-grow flex justify-center">
          <div className="md:items-center flex">
            <img
              className="object-cover h-16 transition-transform duration-300"
              src={logo}
              alt="Cover"
              onClick={() => navigate('/')}
            />
          </div>
        </div>

        <div className="flex flex-row space-x-5">
          {(isAdmin || isBarber) && (
            <IoMdNotifications
              size={24}
              className="text-white cursor-pointer hover:scale-110 transition-transform duration-200"
              onClick={toggleNotifications} 
            />
          )}

          <div
            onClick={() => setMenuOpen(!menuOpen)}
            className={`flex cursor-pointer ${menuOpen ? 'text-white' : 'text-white'} dark:text-white mr-2 md:hidden hover:scale-105 duration-200 z-50 items-end ml-auto`}
          >
            {menuOpen ? <FaTimes className='' size={24} /> : <FaBars size={24} />}
          </div>
        </div>
      </div>

      {/* Notification pop up */}
      {(popupNotif && (isAdmin || isBarber)) && (
        <div onClick={() => {
          setPopupNotif(null);
          setNotificationsOpen(true);
        }}
          className="fixed md:top-[100px] top-[70px] right-4  bg-primary-dark  shadow-dark-main text-white p-5 rounded-2xl shadow-md z-50 transition-opacity scale-in-center">
          <HeadingTextAlt title={popupNotif.messageType} subtitle={popupNotif.date} titleSize='text-2xl' subtitleSize='text-xl' />
          <div className='text-center'><p>{popupNotif.message}</p></div>
        </div>
      )}

      {/* MD: links */}
      <div className="hidden md:flex justify-center items-center w-full h-6 px-4 py-4 bg-black md:shadow-md">
        <div className="hidden md:flex items-center">
          {!loading ? ((
            <>
              <ul className="flex">
                {links.map((link) => (
                  <li
                    key={link.id}
                    className="px-3 text-md font-semibold font-bodoni text-center text-white hover:scale-y-125 scale-y-125 cursor-pointer capitalize hover:scale-105 duration-200"
                    onClick={link.onClick ? link.onClick : () => { }}
                  >
                    {link.link.toUpperCase()}
                  </li>
                ))}
              </ul>
            </>
          )) : (<p className="px-3 text-md font-semibold font-bodoni text-center text-white hover:scale-y-125 scale-y-125 cursor-pointer capitalize hover:scale-105 duration-200">LOADING...</p>)}
        </div>
      </div>

      {/* Notification sidebar */}
      <div className={`fixed top-0 right-0 h-screen w-2/3 md:w-[400px] bg-primary-dark border-l-[10px] border-secondary-dark shadow-xl. text-white z-50 transition-transform duration-300 ${notificationsOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-4 h-full flex flex-col">
          <HeadingText customText={'NOTIFLICATIONS'} textSize='md:text-2xl text-base' />
          <div className="mt-2 overflow-y-auto flex-grow  p-0.5">
            {loadingNotifications ? (
              <p>Loading...</p>
            ) : error ? (
              <p className="text-dark-main">{error}</p>
            ) : (
              <ul>
                {notifications.length > 0 ? (
                  notifications.map((notif, index) => (

                    <li key={index} className="text-base mb-2 p-4 rounded-2xl bg-secondary-dark">
                      <HeadingTextAlt
                        title={notif.messageType}
                        subtitle={new Date(notif.date).toLocaleString('en-GB', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false
                        })}
                        titleSize='md:text-xl text-sm'
                        subtitleSize='md:text-lg text-sm'
                        minWidth='md:min-w-[50px] min-w-[10px]'
                      />
                      <div className='text-sm text-center'>{notif.message}</div>
                    </li>
                  ))
                ) : (
                  <li className="text-gray-500 mb-2 text-center">No new notifications</li>
                )}
              </ul>
            )}
          </div>
          <button
            className="absolute md:top-[17px] top-[20px] right-4 text-white hover:scale-105 duration-200"
            onClick={toggleNotifications}
          >
            <RxCross2 className='md:text-2xl text-lg' />
          </button>
        </div>
      </div>


      {/* SM: links */}
      {menuOpen && (
        <ul className="background-with-scissors-menu bg-black overflow-hidden z-30 absolute flex flex-col justify-center items-center top-0 left-0 w-full h-screen ">
          {links.map((link, index) => (
            <React.Fragment key={link.id}>
              <li
                className="px-4 text-2xl font-semibold font-bodoni text-center text-dark-main  hover:scale-y-125 scale-y-125 cursor-pointer capitalize mt-4 hover:scale-105 duration-200"
                onClick={link.onClick ? link.onClick : () => setMenuOpen(false)}
              >
                {link.link.toUpperCase()}
              </li>

              {index !== links.length - 1 && ( <div style={{  background: 'linear-gradient(90deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 1) 50%, rgba(255, 255, 255, 0) 100%)' , height: '1px' }} className="w-1/4 mt-2"></div>)}
            </React.Fragment>
          ))}
        </ul>
      )}

      {showLogout && (
        <RemoveModal
          title="LOG OUT"
          body={`Are you sure you want to log out?`}
          action={handleLogout}
          cancel={() => setShowLogout(false)}
          loading={loggingOut}
        />
      )}
    </div>
  );
};

export default Navbar;
