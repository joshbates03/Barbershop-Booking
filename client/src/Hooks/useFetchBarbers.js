import { useState, useEffect, useRef, useCallback } from 'react';
import baseUrl from '../Components/Config.js';

const useFetchBarbers = () => {

  const [barbers, setBarbers] = useState(null);
  const [loadingBarbers, setLoadingBarbers] = useState(true);
  const [barberStatus, setBarberStatus] = useState('');
  const [barberFailedType, setBarberFailedType] = useState('ok')
  const [reloadingBarbers, setReloadingBarbers] = useState(false)
  const timeoutRef = useRef(null);

  const stopBarberLoad = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setLoadingBarbers(false);
    }, 1000);
  }

  const stopBarberReload = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setReloadingBarbers(false);
    }, 1000);
  }

  const setFailBarberType = (type) => {
    setTimeout(() => {
      setBarberFailedType(type)
    }, 1000);
  }

  const fetchBarbers = useCallback(async (reload = false) => {
    try {
      reload ? setReloadingBarbers(true) : setLoadingBarbers(true);

      setBarberFailedType('ok');
      const getBarbers = await fetch(`${baseUrl}/api/Barbers`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      const getBarberResponse = await getBarbers.json();

      if (getBarbers.ok) {
        setBarbers(getBarberResponse.$values);
        setBarberStatus('');
        setFailBarberType('ok');
      } else {
        console.error(`Backend failed to fetch barbers: ${getBarberResponse.message}`);
        setBarbers(null);
        setBarberStatus('Something went wrong');
        setFailBarberType('backend_error');
      }
    } catch (error) {
      console.error(`Frontend failed to connect to backend: ${error.message}`);
      setBarbers(null);
      setBarberStatus('???');
      setFailBarberType('network_error');
    } finally {
      reload ? stopBarberReload() : stopBarberLoad();
    }
  }, []); 

  useEffect(() => {
    fetchBarbers();
  }, [fetchBarbers]); 


  return { barbers, setBarbers, fetchBarbers, loadingBarbers, barberStatus, barberFailedType, reloadingBarbers };
};

export default useFetchBarbers;
