import React, { useState, useRef, useEffect, useContext } from 'react';
import { FaClock } from "react-icons/fa";
import { FaScissors } from "react-icons/fa6";
import HeadingTextAlt from '../Styles/HeadingTextAlt';
import { useNavigate } from 'react-router-dom';
import { IoMdRefresh } from "react-icons/io";
import RemoveModal from '../RemoveModal';
import BarLoader from '../Loaders/BarLoader';
import { ProfileContext } from './ProfileContext';
import { getButtonStyle } from '../Styles/Styles';
import { useTouch } from '../../Context/TouchScreenContext';
import HeadingText from '../Styles/HeadingText';
import baseUrl from '../Config';

const UserAppointments = ({ adminView = false, adminUserId }) => {
  const isTouchScreen = useTouch();
  const {
    userId,
    barbers, fetchBarbers, barberStatus, reloadingBarbers,
    appointments, fetchAppointments, appointmentStatus, appointmentFailType
  } = useContext(ProfileContext);

  const navigate = useNavigate();
  const [appointmentMessage, setAppointmentMessage] = useState('');
  const [hoveredAppointment, setHoveredAppointment] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState(null);
  const [reloadingAppointments, setReloadingAppointments] = useState(adminView ? true : false);
  const timeoutRef = useRef(null);
  const listContainerRef = useRef(null);
  const [listHeight, setListHeight] = useState('auto');

  // Fake load - used for AdminHandleUser.js
  useEffect(() => {
    if (adminView) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        setReloadingAppointments(false);
      }, 2000);
    }
  }, [adminView]);

  const openCancelAppointmentModal = (appointment) => {
    setAppointmentToCancel(appointment);
    setShowCancelModal(true);
    setAppointmentMessage('');
  };

  const reloadAppointments = async () => {
    setReloadingAppointments(true);

    // Captures the current height of the appointments div
    if (listContainerRef.current && appointments.length !== 0) {
      setListHeight(`${listContainerRef.current.clientHeight}px`);
    }

    try {
      await fetchAppointments(userId, true);
    } catch (error) {
      console.error("Failed to fetch appointments on reload: ", error);
    } finally {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setReloadingAppointments(false);
        setListHeight('auto');
      }, 2000);
    }
  };

  const sendCancellationConfirmation = async () => {
    try {
      const url = adminView ? `${baseUrl}/api/Appointments/Admin/Send/BookingRemovalConfirmation` : `${baseUrl}/api/Appointments/Send/BookingRemovalConfirmation`;
    
      const sendSMS = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          AppointmentId: appointmentToCancel.id,
          AppUserId: userId,
          AppointmentTime: appointmentToCancel.time,
          AppointmentDate: appointmentToCancel.date,
          AppUserName: appointmentToCancel.appUserName
        })
      });

      const sendSmsResponse = await sendSMS.json();

   
      if (!sendSMS.ok) console.error('Backend failed to send booking cancellation confirmation SMS:', sendSmsResponse.message);
    } catch (error) {
      console.error('Frontend failed to connect to backend:', error);
    }
};

  // CANCEL Appointment
  const [cancelling, setCancelling] = useState(false);
  const handleCancelAppointment = async () => {
   
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setAppointmentMessage('');
    setCancelling(true);
    if (!appointmentToCancel) return;

    try {
      const cancelAppointment = await fetch(`${baseUrl}/api/Appointments?adminView=${adminView}&AppointmentId=${appointmentToCancel.id}&AppUserId=${userId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });

      if (cancelAppointment.ok) {
        timeoutRef.current = setTimeout(() => {
          setShowCancelModal(false);
          sendCancellationConfirmation();
          setAppointmentToCancel(null);
          reloadAppointments();
          setCancelling(false);
        }, 2000);
      } else {
        const cancelAppointmentResponse = await cancelAppointment.json();
        console.error('Backend failed to cancel appointment:', cancelAppointmentResponse.message);
        timeoutRef.current = setTimeout(() => {
      
          setAppointmentMessage(cancelAppointmentResponse.message);
          setCancelling(false);
        }, 2000);
      }
    } catch (error) {
      console.error('Front end failed to connect to backend: ', error);
      timeoutRef.current = setTimeout(() => {
        setAppointmentMessage('Unable to connect to the server');
        setCancelling(false);
      }, 2000);
    }
  };

  const appointmentHeader = (
    <>
      <div className="flex items-center justify-between mb-4 ">
        <h2 className="md:text-2xl text-lg font-semibold font-bodoni flex text-white scale-y-125">{adminView ? 'APPOINTMENTS' : 'MY APPOINTMENTS'}</h2>
        <button
        className={`${getButtonStyle('standard', isTouchScreen)} !rounded-full md:h-8 md:w-8 h-7 w-7 items-center justify-center flex`}
          onClick={reloadingAppointments ? null : reloadAppointments}
        >
          <IoMdRefresh className="md:h-6 md:w-6 w-5 h-5" />
        </button>
      </div>
      <div className='flex items-center justify-center h-[75%]'>
        {reloadingAppointments && (
          <BarLoader />
        )}
      </div>
    </>
  );

  if (reloadingAppointments) {
    return (
      <div className={`${adminView ? 'bg-secondary-dark' : 'bg-primary-dark'} p-4 rounded-b-2xl -mt-2 `} style={{ height: listHeight }}>
        {appointmentHeader}
      </div>
    );
  }

  return (
    <div className={`${adminView ? 'bg-secondary-dark' : 'bg-primary-dark'} p-4 rounded-b-2xl -mt-2`} ref={listContainerRef}>
      {appointmentHeader}
      {appointments !== null && appointments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {appointments
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .map((appointment) => (
              <div key={appointment.id} className={`${adminView ? 'bg-primary-dark' : 'bg-secondary-dark'} p-4 rounded-lg shadow-md flex flex-col`} onMouseDown={() => setHoveredAppointment(appointment.id)}>
                <div className='flex items-center justify-center'><HeadingText customText={new Date(appointment.date).toLocaleDateString()} /></div>
                <div className='items-center justify-center flex flex-col'>
                  <div className="flex items-center justify-center space-x-2">
                    <FaClock className="text-dark-main mb-1" /><p className="text-white">{appointment.time}</p>
                  </div>
                  <div className="flex items-center w-full justify-center">
                    <div className="text-white flex flex-row items-center justify-center w-full">
                      {!reloadingBarbers ? (
                        <div className="flex items-center justify-center space-x-2">
                          <FaScissors className="text-dark-main mb-0.5" />
                          <p className="text-center">{reloadingBarbers ? 'Reloading...' : (barberStatus || barbers.find(barber => barber.id === appointment.barberId)?.name || 'Unknown')}</p>
                          {barbers === null && (
                            <button className={`${getButtonStyle('standard', isTouchScreen)} !rounded-full flex justify-center items-center h-6 w-6`} onClick={() => fetchBarbers(true)}>
                              <IoMdRefresh className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      ) : (<BarLoader heightClass='h-6' text='' customWidth='70px' />)}
                    </div>
                  </div>
                </div>
                {(hoveredAppointment === appointment.id && barbers !== null) && (
                  <div className="scale-in-center w-full flex flex-row right-0 mt-2 rounded-md shadow-lg z-20 opacity-4 justify-between">
                    <button onClick={() => openCancelAppointmentModal(appointment)} className={`${getButtonStyle('standard', isTouchScreen)} w-full px-4 py-2 mt-2`}>Cancel Booking</button>
                  </div>
                )}
              </div>
            ))}
        </div>
      ) : (
        <>
          {!adminView ? (
            appointments == null ? (
              <p className='text-white p-1'>{appointmentStatus}</p>
            ) : (
              <div className="p-4 rounded-lg flex flex-col justify-center items-center">
                <HeadingTextAlt title={'YOU HAVE NO APPOINTMENTS'} subtitle={'CLICK BELOW TO BOOK ONE'} titleSize="md:text-2xl text-lg" subtitleSize="md:text-xl text-base" minWidth='md:min-w-[50px] min-w-[10px]' />
                <div className="flex justify-center items-center">
                  <button onClick={() => { navigate('/book'); }} className={`${getButtonStyle('standard', isTouchScreen)} px-4 py-2 mt-1`}>Book</button>
                </div>
              </div>
            )
          ) : (
            <div className='flex items-center justify-center h-32'>
              <p className='text-gray-500'>
                {appointments === null ? (appointmentFailType !== 'ok' ? (appointmentFailType === "backend_error" ? "Something went wrong" : "Unable to connect to the server") : ('No appointments found')) : 'No appointments found'}
              </p>
            </div>
          )}
        </>
      )}
      {showCancelModal && (
        <RemoveModal
          title="CANCEL APPOINTMENT"
          body={`Are you sure you want to cancel your appointment on ${new Date(appointmentToCancel.date).toLocaleDateString()} at ${appointmentToCancel.time}?`}
          action={handleCancelAppointment}
          cancel={() => setShowCancelModal(false)}
          message={appointmentMessage}
          loading={cancelling}
        />
      )}
    </div>
  );
  
};

export default UserAppointments;
