import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import HeadingText from '../Styles/HeadingText';
import Calendar from '../Calendar';
import BookingConfirmationModal from './BookingConfirmationModal';
import ServerDown from '../ServerDown';
import BarLoader from '../Loaders/BarLoader';
import PoleLoader from '../Loaders/PoleLoader';
import useFetchBarbers from '../../Hooks/useFetchBarbers';
import { AuthContext } from '../Authentication/AuthContext';
import { useTouch } from '../../Context/TouchScreenContext';
import { getButtonStyle, getInputStyle } from '../Styles/Styles';
import baseUrl from '../Config';
import { IoMdRefresh } from "react-icons/io";
import { FaClock } from "react-icons/fa";
import { MdDateRange } from "react-icons/md";
import * as signalR from '@microsoft/signalr';


/*
adminModify, originalAppointment and toggleAdmin are passed through when the 
Book component is utilised within Appointments.js, allowing admins to modify
their customers existing appointments if necessary.

adminModify is used to determine whether this is true, meaning originalAppointment
and toggleAdmin are null if it is false.
*/
const Book = ({ adminModify = false, originalAppointment, toggleAdmin }) => {

  const isTouchScreen = useTouch();
  const navigate = useNavigate();
  const { userId, username, failure, failureType, validateToken, isLoggedIn } = useContext(AuthContext);
  const { barbers, fetchBarbers, barberFailedType } = useFetchBarbers();

  const [selectedBarberId, setSelectedBarberId] = useState('0');
  const [selectedDate, setSelectedDate] = useState(new Date(1970, 0, 1));
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [availableTimes, setAvailableTimes] = useState([]);
  const [showConfirmBookingModal, setShowConfirmBookingModal] = useState(false);
  const [selectedTime, setSelectedTime] = useState('');
  const [cantBook, setCantBook] = useState(false);
  const [existingAppointment, setExistingAppointment] = useState(null);
  const [previousMonthAvailable, setPreviousMonthAvailable] = useState(false);
  const [nextMonthAvailable, setNextMonthAvailable] = useState(false);
  const [bookingMessage, setBookingMessage] = useState('');
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const timeoutRef = useRef(null);
  const selectedDateRef = useRef(selectedDate);
  const selectedBarberIdRef = useRef(selectedBarberId);
  const userIdRef = useRef(userId);

  // Send back to homepage if not logged in
  useEffect(() => {
    if (isLoggedIn === false) {
      navigate('/');
    }
  }, [isLoggedIn, navigate]);


  useEffect(() => {
    selectedBarberIdRef.current = selectedBarberId;
    userIdRef.current = userId;
    selectedDateRef.current = selectedDate;
  }, [selectedBarberId, userId, selectedDate]);

  // SignalR Websocket
  useEffect(() => {
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${baseUrl}/bookingHub`, { withCredentials: true })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Error)
      .build();

    connection.start()
      .then()
      .catch(err => console.error('SignalR Connection Error: ', err));

    connection.on('ReceiveBookingUpdate', (date, userId_, admin) => {
      const currentSelectedDate = selectedDateRef.current
      const currentSelectedBarberId = selectedBarberIdRef.current
      const currentUserId = userIdRef.current

      if (currentUserId !== '') {
        if (!adminModify) {
          if ((currentSelectedDate.toISOString().split('T')[0] === date) && userId_ !== currentUserId) {
            fetchAvailableTimes(currentSelectedBarberId, currentSelectedDate);
          }
        }
      }
    });

    return () => {
      if (connection) {
        connection.stop();
      }
    };
  }, [adminModify]);


  // Fake loader to match other pages which require loading
  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  }, []);

  useEffect(() => {
    if (!barbers) {
      fetchBarbers();
    }
  }, [barbers, fetchBarbers]);

  useEffect(() => {
    if (selectedBarberId !== "0" && (new Date(selectedDate).toISOString() !== "1969-12-31T23:00:00.000Z")) {
      fetchAvailableTimes(selectedBarberId, selectedDate)
    } else {
      setAvailableTimes([]);
    }
  }, [selectedBarberId, selectedDate]);

  useEffect(() => {
    setSelectedBarberId("0")
    setAvailableTimes([])
  }, [barberFailedType, barbers]);

  const reloadAppointments = async () => {
    setLoadingAppointments(true);
    try {
      await fetchAvailableTimes(selectedBarberId, selectedDate);
    } catch (error) {
      console.error("Failed to reload: refresh failed");
    } finally {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setLoadingAppointments(false), 1000);
    }
  };

  const [fetchAvailableTimesResultType, setFetchAvailableTimesResultType] = useState('')
  const fetchAvailableTimes = async (barberId, date) => {
    setLoadingAppointments(true);
    setFetchAvailableTimesResultType('');

    try {
      const formattedDate = date.toISOString().split('T')[0];
      const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
      const getAvailableTimes = await fetch(`${baseUrl}/api/Barbers/${barberId}/available-times?day=${dayOfWeek}&date=${formattedDate}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      const getAvailableTimesResponse = await getAvailableTimes.json();
      setAvailableTimes(getAvailableTimes.ok ? getAvailableTimesResponse.$values || [] : []);
      setFetchAvailableTimesResultType(getAvailableTimes.ok ? 'ok' : 'backend_error');
      if (!getAvailableTimes.ok) console.error('Backend failed:', getAvailableTimesResponse.message);
    } catch (error) {
      console.error('Frontend failed:', error);
      setAvailableTimes([]);
      setFetchAvailableTimesResultType('network_error');
    } finally {
      timeoutRef.current && clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setLoadingAppointments(false), 1000);
    }
  };

  const messages = {
    ok: 'No available times',
    backend_error: 'Something went wrong',
    network_error: 'Unable to connect to the server',
  };

  const getAvailableTimesMessage = () => {
    if (selectedBarberId === '0') return 'Please select a barber'
    return messages[fetchAvailableTimesResultType] || 'No available times';
  };


  // Calendar related functions
  const handleDateClick = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    if (selectedDate >= today) {
      setSelectedDate(selectedDate);
    }
  };

  const nextMonth = () => {
    const today = new Date();
    const maxDate = adminModify ? new Date(today.getFullYear(), today.getMonth() + 12, 1) : new Date(today.getFullYear(), today.getMonth() + 2, 1);
    const nextMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    if (nextMonth <= maxDate) {
      setCurrentMonth(nextMonth);
      setPreviousMonthAvailable(true);
    }
  };

  const prevMonth = () => {
    const today = new Date();
    const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const previousMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    if (previousMonth >= currentMonthStart) {
      setCurrentMonth(previousMonth);
    }
  };

  useEffect(() => {
    const today = new Date();
    const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const previousMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    const nextMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    const maxDate = adminModify ? new Date(today.getFullYear(), today.getMonth() + 12, 1) : new Date(today.getFullYear(), today.getMonth() + 2, 1);
    setPreviousMonthAvailable(previousMonth >= currentMonthStart);
    setNextMonthAvailable(nextMonth <= maxDate);
  }, [currentMonth, adminModify]);

  const handleTimeClick = (time) => {
    setSelectedTime(time);
    setShowConfirmBookingModal(true);
  };

  const isTimeInPast = (time) => {
    const now = new Date();
    const [hours, minutes] = time.split(':').map(Number);
    const appointmentTime = new Date(selectedDate);
    appointmentTime.setHours(hours, minutes, 0, 0);
    const timeDifference = appointmentTime - now;
    const halfHour = (60 * 60 * 1000) / 2;
    return appointmentTime < now || timeDifference <= halfHour;
  };


  /*
  On a first attempt, handleBookAppointment(cancelled = false, existing = null) will
  execute with the parameters inital values, false and null. If the API returns an existing 
  appointment within the week which the user is attempting to book an appointment, they will be
  given the option to cancel this existing appointment in order to book a new one, where the values
  will change.

  cancelled determines whether an attempt to book an appointment has been made, in which it failed
  due to another appointment existing.

  If cancelled is true, existing will contain the existing appointment which was found.

  For users accessing this component via /book, adminModify will be set to false, this means
  that it should result in the appointment object containing a non-null appUserId and appUserName.
  The url in which the API call is made to will also be the standard appointments post request.

  For admin, who can access this endpoint via Appointment.js (where adminModify, originalAppointment
  and toggleAdmin have values), depending on the values within originalAppointment, the appointment 
  object will determine whether guestName is empty, or if appUserId and appUserName are null - both 
  cannot be populated. Additonally, a different url will be used within the API call, which further differentiates
  depending on whether the appointment belongs to a user or is a guest appointment.
  */
  const handleBookAppointment = async (cancelled = false, existing = null) => {
    try {
      if (!cancelled) setConfirming(true);
      setBookingMessage('');

      const appUserId = adminModify ? originalAppointment.appUserId : userId;
      const appUserName = adminModify ? originalAppointment.appUserName : username;
      const guestName = adminModify ? originalAppointment.guestName : '';

      const appointment = {
        day: selectedDate.toLocaleDateString('en-US', { weekday: 'long' }),
        time: selectedTime,
        date: selectedDate.toISOString().split('T')[0],
        appUserId,
        barberId: selectedBarberId,
        appUserName,
        guestName
      };

      if (guestName !== '' && (appUserId !== null || appUserName !== null)) {
        console.error("handleBookAppointment(): both guestName and either appUserName and appUserId have values");
        return;
      }

      function handleFailure(message) {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          setConfirming(false);
          setBookingMessage(message);
        }, 1000);
      }

      // adminModify is true, meaning an admin is attempting to update an existing appointment - therefore we should cancel the original appointment to avoid conflict
      if (adminModify) {
        try {
          const cancelResponse = await adminCancelAppointment(originalAppointment);
          if (!cancelResponse.ok) {
            handleFailure(`Failed to remove booking on ${formatDate(originalAppointment.date)} at ${originalAppointment.time}`);
            return;
          }
        } catch (error) {
          console.error('Front end failed to connect to backend: ', error);
          handleFailure('Unable to connect to the server');
          return;
        }
      }

      let url = adminModify
        ? originalAppointment.guestName === '' ? `${baseUrl}/api/Appointments/Admin/BookAppointment` : `${baseUrl}/api/Appointments/Admin/BookGuestAppointment`
        : `${baseUrl}/api/Appointments`;

      const bookAppointment = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(appointment),
      });

      if (bookAppointment.ok) {
        setBookingMessage('');
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          setConfirming(false);
          fetchAvailableTimes(selectedBarberId, selectedDate);
          setShowConfirmBookingModal(false);
        }, 1000);

        if (!adminModify) {
          cancelled ? updateBookingConfirmation(existing, appointment) : sendBookingConfirmation(appointment);
        } else {
          if (appointment.guestName === '') sendBookingModification(appointment);
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          timeoutRef.current = setTimeout(() => toggleAdmin(true), 1000);
        }
      } else {
        const bookAppointmentResponse = await bookAppointment.json();
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          setConfirming(false);
          console.error('Backend failed to book appointment:', bookAppointmentResponse.message);
          if (adminModify) {
            setBookingMessage('Failed to book new appointment');
            return;
          }
          if (bookAppointmentResponse.message === 'You can only book one appointment per week') {
            setCantBook(true);
            setExistingAppointment(bookAppointmentResponse.existingAppointment.$values || null);
          } else setBookingMessage(bookAppointmentResponse.message);
        }, 1000);
      }
    } catch (error) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setConfirming(false);
        setBookingMessage('Unable to connect to the server');
      }, 1000);
      console.error('Frontend failed to connect to backend:', error);
    }
  };


  /*
  cancelAndRebook(appointmentId) is used when 'if (bookAppointment.ok)' is false
  within handleBookAppointment() via the setCantBook(true).

  It takes in the paramter appointmentId, which is used to create  the existing_Appointment
  payload, with the help of the existingAppointment variable which was also set within handleBookAppointment().

  If the existing appointment is successfully removed, then handleBookAppointment() is called again with its 
  parameters updated: cancelled = true, existing = existing_Appointment. This should allow for the API call
  to complete as there should be no existing appointments found. Additionally, it checks whether cancelled is 
  true to determine which SMS message to send the user.

  Should only be called when a user account is on /book
  */
  const [cancelRebooking, setCancelRebooking] = useState(false)
  const [cancelAndRebookMessage, setCancelAndRebookMessage] = useState('')
  const cancelAndRebook = async (appointmentId) => {
    setCancelRebooking(true);
    setCancelAndRebookMessage('');
    const appointmentTime = existingAppointment[0].time;
    const appointmentDate = existingAppointment[0].date;
    const appUserId = adminModify ? originalAppointment.AppUserId : userId;
  
    try {
      const cancelAppointment = await fetch(
        `${baseUrl}/api/Appointments?AppointmentId=${appointmentId}&AppUserId=${appUserId}&AppointmentTime=${appointmentTime}&AppointmentDate=${appointmentDate}`,
        { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, credentials: 'include' }
      );
  
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (cancelAppointment.ok) {
        if (!adminModify) {
          await handleBookAppointment(true, { AppointmentId: appointmentId, AppUserId: appUserId, AppointmentTime: appointmentTime, AppointmentDate: appointmentDate });
        }
        timeoutRef.current = setTimeout(() => {
          setCantBook(false);
          setCancelRebooking(false);
        }, 1000);
      } else {
        const cancelAppointmentResponse = await cancelAppointment.json();
        console.error('Backend failed to delete appointment:', cancelAppointmentResponse.message || 'No message returned');
        timeoutRef.current = setTimeout(() => {
          setCancelAndRebookMessage(cancelAppointmentResponse.message);
          setCancelRebooking(false);
        }, 1000);
      }
    } catch (error) {
      console.error('Frontend failed to connect to backend:', error);
      timeoutRef.current = setTimeout(() => {
        setCancelAndRebookMessage('Unable to connect to the server');
        setCancelRebooking(false);
      }, 1000);
    }
  };
  
  const adminCancelAppointment = async (originalAppointment) => {
    try {
      let url = `${baseUrl}/api/Appointments/Admin/Delete/${originalAppointment.id}`;
      url += originalAppointment.appUserId === null && originalAppointment.guestName !== ''
        ? `?guestName=${encodeURIComponent(originalAppointment.guestName)}`
        : `?appUserId=${encodeURIComponent(originalAppointment.appUserId)}`;
  
      const cancelAppointment = await fetch(url, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
  
      return cancelAppointment;
    } catch (error) {
      console.error('Frontend failed to connect to backend: ', error);
    }
  };
  
  // SMS Functions

  // Send booking confirmation when user books an appointment
  const sendBookingConfirmation = async (appointment) => {
    try {
      const sendSMS = await fetch(`${baseUrl}/api/Appointments/Send/BookingConfirmation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(appointment),
      });
  
      const sendSmsResponse =  sendSMS.ok ? null : await sendSMS.json();
      if (!sendSMS.ok) console.error('Backend failed to send booking confirmation SMS:', sendSmsResponse.message);
    } catch (error) {
      console.error('Frontend failed to connect to backend:', error);
    }
  };
  
  // Send booking updated message 
  const updateBookingConfirmation = async (oldAppointment, appointment) => {
    const payload = {
      AppUserId: appointment.appUserId,
      AppointmentTime: appointment.time,
      AppointmentDate: appointment.date,
      OldAppointmentTime: oldAppointment.AppointmentTime,
      OldAppointmentDate: oldAppointment.AppointmentDate
    };
  
    try {
      const sendSMS = await fetch(`${baseUrl}/api/Appointments/Send/ChangeAppointment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
  
      const sendSmsResponse =  sendSMS.ok ? null : await sendSMS.json();
      if (!sendSMS.ok) console.error('Backend failed to send update booking confirmation SMS:', sendSmsResponse.message);
    } catch (error) {
      console.error('Frontend failed to connect to backend:', error);
    }
  };
  
  // Send booking confirmation when user books an appointment
  const sendBookingModification = async (appointment) => {
    const payload = {
      AppUserId: appointment.appUserId,
      AppointmentTime: appointment.time,
      AppointmentDate: appointment.date,
      OldAppointmentTime: originalAppointment.time,
      OldAppointmentDate: originalAppointment.date
    };
  
    try {
      const sendSMS = await fetch(`${baseUrl}/api/Appointments/Admin/SendModifiedAppointment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
  
      const sendSmsResponse =  sendSMS.ok ? null : await sendSMS.json();
      if (!sendSMS.ok) console.error('Backend failed to send booking modification SMS:', sendSmsResponse.message);
    } catch (error) {
      console.error('Frontend failed to connect to backend:', error);
    }
  };
  
  // Formats date to DD/MM/YYY 
  const formatDate = (dateString) => {
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  };

  // When clicking cancel on showConfirmBookingModal
  const closeConfirmBookingModal = () => {
    setCantBook(false);
    setShowConfirmBookingModal(false);
    setConfirming(false)
    setBookingMessage('');
    reloadAppointments()
  };

  // Disable scroll if a modal is open
  useEffect(() => {
    if (showConfirmBookingModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [showConfirmBookingModal]);

  if (failure) {
    return (
      <ServerDown retry={() => validateToken()} isTouchScreen={isTouchScreen} failureType={failureType} />
    )
  }

  return (
    <div>
      {isLoading ?
        (<div className={` ${adminModify ? '' : 'min-h-[80vh] '}items-center justify-center flex`} style={{ transform: 'scale(0.65)', transformOrigin: 'center' }}>
          <PoleLoader />
        </div>)
        :
        (<div className="container mx-auto p-4 ">
          <div className="rounded-2xl p-4 bg-primary-dark  bg-opacity-90 shadow-md ">
            <div className="mb-4">
              {adminModify && (
                <div className='flex flex-row justify-between w-full     items-center'>
                  <div className='flex flex-col'>
                    <h2 className="md:text-xl text-base  font-semibold font-bodoni text-white scale-y-125 mt-2 "> MODIFYING {originalAppointment ? `${originalAppointment.appUserName ? originalAppointment.appUserName.toUpperCase() : originalAppointment.guestName.toUpperCase()}'S APPOINTMENT ` : ''}</h2>
                    <div className='flex flex-row space-x-2 mb-2'>
                      <div className='flex flex-row space-x-1'>
                        <MdDateRange size={18} className='mt-0.5 text-dark-main' />
                        <h2 className="text-base font-roboto text-white ">  {formatDate(originalAppointment.date)}</h2>
                      </div>
                      <div className='flex flex-row space-x-1'>
                        <FaClock className='mt-0.5 text-dark-main' />
                        <h2 className="text-base  font-roboto text-white ">  {originalAppointment.time}</h2>
                      </div>
                    </div>
                  </div>
                  <button className={`${getButtonStyle('cancel', isTouchScreen)} px-3 py-1 mb-2`} onClick={toggleAdmin}>Close</button>
                </div>
              )}

              <h2 className="text-xl font-semibold font-bodoni text-white scale-y-125 mt-2 mb-1">SELECT A BARBER</h2>
              <select
                value={selectedBarberId}
                onChange={(e) => setSelectedBarberId(e.target.value)}
                className={`${getInputStyle()}`}
              >
                <option value="0">{barberFailedType !== 'ok' ? barberFailedType === 'backend_error' ? 'Something went wrong' : 'Unable to connect to the server' : "Select a Barber"}</option>
                {barbers?.map((barber) => (
                  <option key={barber.id} value={barber.id}>
                    {barber.name}
                  </option>
                ))}
              </select>
            </div>

            <Calendar
              currentMonth={currentMonth}
              selectedDate={selectedDate}
              onDateClick={handleDateClick}
              onNextMonth={nextMonth}
              onPrevMonth={prevMonth}
              previousMonthAvailable={previousMonthAvailable}
              nextMonthAvailable={nextMonthAvailable}
            />

            <div className="flex items-center justify-center   space-x-3 mt-4 ">
              <h2 className="text-xl font-semibold font-bodoni text-white text-center scale-y-125">
                {selectedDate.getTime() === new Date(1970, 0, 1).getTime() ? 'SELECT A DATE' : `${selectedDate.toLocaleDateString('en-GB')}`}
              </h2>
              {selectedDate && selectedDate.getTime() !== new Date(1970, 0, 1).getTime() && selectedBarberId !== '0' && (
                <button
                  className="bg-dark-main hover:bg-darker-main text-white rounded-full duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-1 flex justify-center items-center md:h-8 md:w-8 w-6 h-6"
                  onClick={reloadAppointments}
                >
                  <IoMdRefresh className="md:h-6 md:w-6 w-5 h-5" />
                </button>
              )}
            </div>

            {loadingAppointments ? (<BarLoader animationDuration='1.2s' />) : (
              <>
                {selectedDate && selectedDate.getTime() !== new Date(1970, 0, 1).getTime() && (
                  <div className="mt-3">
                    {availableTimes.length > 0 ? (
                      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 transition-all duration-300 ">
                        {availableTimes.map((time, index) => (
                          <div
                            key={index}
                            className={`p-3 rounded-2xl shadow-md flex flex-col   items-center justify-between ${isTimeInPast(time) ? 'opacity-50 pointer-events-none ' : ''} bg-secondary-dark transition duration-300 ease-in-out `}
                          >

                            <HeadingText customText={time} customWidth={'100%'} textSize='md:text-2xl text-xl' />
                            <button
                              onClick={() => handleTimeClick(time)}
                              disabled={isTimeInPast(time)}

                              className={` ${getButtonStyle('standard', isTouchScreen)} w-full text-white md:px-4 md:py-2 px-2 py-2  duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-1 mt-2 ${isTimeInPast(time) ? 'opacity-50 pointer-events-none bg-gray-800 ' : 'bg-dark-main hover:bg-darker-main'} `}
                            >
                              {isTimeInPast(time) ? 'Closed' : 'Book'}
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className={`items-center justify-center flex flex-col h-[116px] text-center text-gray-500  `}>

                        {getAvailableTimesMessage()}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {showConfirmBookingModal && (
            <BookingConfirmationModal
              bookingMessage={bookingMessage}
              cantBook={cantBook}
              confirming={confirming}
              cancelRebooking={cancelRebooking}
              handleBookAppointment={() => handleBookAppointment(false)}
              removeModal={closeConfirmBookingModal}
              selectedDate={selectedDate}
              selectedTime={selectedTime}
              existingAppointment={existingAppointment}
              cancelAndRebook={cancelAndRebook}
              cancelAndRebookMessage={cancelAndRebookMessage}
            />
          )}

        </div>)
      }
    </div>
  );
};

export default Book;
