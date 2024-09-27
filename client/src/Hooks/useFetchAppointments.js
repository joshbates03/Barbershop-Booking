import { useState, useEffect, useRef, useCallback } from 'react';
import baseUrl from '../Components/Config.js';

const useFetchAppointments = (userId) => {

  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [appointments, setAppointments] = useState(null); 
  const [appointmentStatus, setAppointmentStatus] = useState(false);
  const [appointmentFailType, setAppointmentFailType] = useState('ok') 
  const timeoutRef = useRef(null);

  const stopAppointmentLoad = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setLoadingAppointments(false);
    }, 1000);
  }

  const setFailAppointmentType = (type) => {
    setTimeout(() => {
      setAppointmentFailType(type)
    }, 1000);
  }

  const fetchAppointments = useCallback(async (id, reload = false) => {
    try {
      setAppointmentFailType('ok');
      if (!reload) setLoadingAppointments(true);

      const getAppointments = await fetch(`${baseUrl}/api/Appointments/ByUser/${id}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (getAppointments.ok) {
        const getAppointmentsResponse = await getAppointments.json();
        setAppointments(getAppointmentsResponse.$values ? getAppointmentsResponse.$values : getAppointmentsResponse.appointments.$values);
        setAppointmentStatus('');
        setFailAppointmentType('ok');
      } else {
        setAppointments(null);
        const getAppointmentsResponse = await getAppointments.json();
        console.error('Backend failed to fetch appointments:', getAppointmentsResponse.message);
        setAppointmentStatus(`Something went wrong: ${getAppointmentsResponse.message}`);
        setFailAppointmentType('backend_error');
      }
    } catch (error) {
      setAppointments(null);
      console.error('Frontend failed to connect to backend:', error);
      setAppointmentStatus('Unable to connect to the server');
      setFailAppointmentType('network_error');
    } finally {
      if (!reload) stopAppointmentLoad();
    }
  }, []);

  useEffect(() => {
    if (userId) {
      fetchAppointments(userId);
    }
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [userId, fetchAppointments]);

  return { appointments, setAppointments, fetchAppointments, appointmentStatus, loadingAppointments, appointmentFailType };
};

export default useFetchAppointments;
