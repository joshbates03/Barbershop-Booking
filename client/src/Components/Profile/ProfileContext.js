import React, { createContext, useState, useEffect, useRef, useContext, useCallback } from 'react';
import useFetchBarbers from '../../Hooks/useFetchBarbers';
import useFetchAppointments from '../../Hooks/useFetchAppointments';
import { AuthContext } from '../Authentication/AuthContext';
import baseUrl from '../Config';

// Create ProfileContext to manage profile-related state
export const ProfileContext = createContext();

// ProfileProvider component to handle profile logic and data fetching
export const ProfileProvider = ({ children, adminView = false, adminUserId = null }) => {
  const timeoutRef = useRef(null);
  const [profile, setProfile] = useState([]);
  const [profileStatus, setProfileStatus] = useState('');
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [reloadingProfile, setReloadingProfile] = useState(false);
  const [profileFailType, setProfileFailType] = useState('ok');

  const { userId: contextUserId } = useContext(AuthContext);
  const userId = adminView && adminUserId ? adminUserId : contextUserId;

  // Fetch user profile from the backend
  const fetchProfile = useCallback(async (userId, reload = false) => {
    try {
      reload ? setReloadingProfile(true) : setLoadingProfile(true);
      setProfileFailType('ok');

      const getProfile = await fetch(`${baseUrl}/api/AppUsers/${userId}/profile`, {
        method: 'GET',
        credentials: 'include',
      });

      if (getProfile.ok) {
        const getProfileResponse = await getProfile.json();
        setProfile(getProfileResponse);
        setFailProfileType('ok');
      } else {
        const getProfileResponse = await getProfile.json();
        console.error('Backend failed to fetch profile:', getProfileResponse.message);
        setFailProfileType('backend_error');
        setProfileStatus(`Something went wrong: ${getProfileResponse.message}`);
      }
    } catch (error) {
      console.error('Frontend failed to connect to backend:', error);
      setFailProfileType('network_error');
      setProfileStatus('Unable to connect to the server');
    } finally {
      reload ? stopProfileReload() : stopProfileLoad();
    }
  }, []); 


  // Fetch appointments and barbers using custom hooks
  const { appointments, fetchAppointments, appointmentStatus, loadingAppointments, appointmentFailType } = useFetchAppointments(userId);
  const { barbers, barberStatus, fetchBarbers, loadingBarbers, barberFailedType } = useFetchBarbers();

  // Manage loading states with timeout
  const stopProfileLoad = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setLoadingProfile(false);
    }, 1000);
  };

  const stopProfileReload = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setReloadingProfile(false);
    }, 1000);
  };

  const setFailProfileType = (type) => {
    setTimeout(() => {
      setProfileFailType(type);
    }, 1000);
  };

  // Effect to fetch profile when userId changes
  useEffect(() => {
    if (userId) fetchProfile(userId);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [userId, fetchProfile]);

  return (
    <ProfileContext.Provider
      value={{
        userId,
        profile, loadingProfile, profileFailType, fetchProfile, reloadingProfile, profileStatus,
        appointments, appointmentStatus, appointmentFailType, fetchAppointments,
        barbers, barberStatus, barberFailedType, fetchBarbers, loadingBarbers, loadingAppointments,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
};
