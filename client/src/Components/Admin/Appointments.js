import React, { useState, useEffect, useRef, useContext, useCallback } from 'react';
import BarLoader from '../Loaders/BarLoader';
import Book from '../Booking/Book';
import Calendar from '../Calendar';
import HeadingTextAlt from '../Styles/HeadingTextAlt';
import HeadingText from '../Styles/HeadingText';
import { IoMdRefresh } from "react-icons/io";
import { AppointmentContext } from './AppointmentContext';
import RemoveModal from '../RemoveModal';
import { getButtonStyle, getErrorMessageStyle, getInputStyle } from '../Styles/Styles';
import { useTouch } from '../../Context/TouchScreenContext';
import PoleLoader from '../Loaders/PoleLoader';
import baseUrl from '../Config';
import * as signalR from '@microsoft/signalr';

const Appointments = ({ selectedBarber }) => {

  const isTouchScreen = useTouch();

  const { users, setUsers } = useContext(AppointmentContext);

  const [appointments, setAppointments] = useState([]);
  const [allAppointments, setAllAppointments] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  });

  const [loading, setLoading] = useState(true);
  const [loadingAppointments, setLoadAppointments] = useState(false);
  const selectedBarberId = selectedBarber.id;

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState(null);

  const [showContactModal, setShowContactModal] = useState(false);
  const [contactMessage, setContactMessage] = useState('');
  const [appointmentToContact, setAppointmentToContact] = useState(null);

  const [hoveredAppointment, setHoveredAppointment] = useState(null);
  const [showManualBookModal, setShowManualBookModal] = useState(false);
  const [showModifyAppointmentModal, setShowModifyAppointmentModal] = useState(false);

  const [refreshingUsers, setRefreshingUsers] = useState(false);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [filterText, setFilterText] = useState('');
  const [guestName, setGuestName] = useState('');
  const [removeMessage, setRemoveMessage] = useState('');

  const selectedDateRef = useRef(selectedDate);
  const selectedBarberIdRef = useRef(selectedBarberId);
  const timeoutRef = useRef(null);

  useEffect(() => {
    selectedBarberIdRef.current = selectedBarberId;
    selectedDateRef.current = selectedDate;
  }, [selectedBarberId, selectedDate]);


  /*
   fetchAvailableTimes(barberId, date) fetches the default list of appointment times 
   for a given day, and then proceeds to call fetchAppointments(selectedBarberId) to 
   retrieve the booked appointments for the same day.

   These two lists are filtered to only display the current appointments alongside the
   avaliable times, removing duplicate times between the two.
 */
  const fetchAppointments = useCallback(async (barberId) => {
    try {
      const getAppointments = await fetch(`${baseUrl}/api/Barbers/with-appointment/${barberId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (getAppointments.ok) {
        const { appointments } = await getAppointments.json();
        const localAppointments = appointments.$values.map((appointment) => ({
          ...appointment,
          localDate: new Date(
            new Intl.DateTimeFormat('en-US', {
              timeZone: 'Europe/London',
            }).format(new Date(appointment.date))
          ),

        }));
        setAppointments(localAppointments);
      } else {
        const getAppointmentsResponse = await getAppointments.json();
        console.error('Backend failed to fetch appointments:', getAppointmentsResponse.message);
      }
    } catch (error) {
      console.error('Frontend failed to connect to backend:', error);
    } finally {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setHoveredAppointment(null);
      timeoutRef.current = setTimeout(() => {
        setLoading(false);
        setLoadAppointments(false);
      }, loading ? 2000 : 1000);
    }
  }, [loading]);

  const fetchAvailableTimes = useCallback(async (barberId, date) => {
    try {
      setLoadAppointments(true);
      const formattedDate = formatDate(new Date(date));
      const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
      const getAvailableTimes = await fetch(`${baseUrl}/api/Barbers/${barberId}/available-times?day=${dayOfWeek}&date=${formattedDate}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      const getAvailableTimesResponse = await getAvailableTimes.json();

      if (getAvailableTimes.ok) {
        setAllAppointments(getAvailableTimesResponse.$values || []);
      } else {
        console.error('Backend failed to fetch appointments:', getAvailableTimesResponse.message);
        setAllAppointments([]);
      }
    } catch (error) {
      console.error('Frontend failed to connect to backend:', error);
      setAllAppointments([]);
    } finally {
      fetchAppointments(barberId);
    }
  }, [fetchAppointments]);

  const handleReload = useCallback(() => {
    fetchAvailableTimes(selectedBarberId, selectedDate);
  }, [fetchAvailableTimes, selectedBarberId, selectedDate]);

  // SignalR websocket
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
      const offsetDate = new Date(currentSelectedDate.getTime() - currentSelectedDate.getTimezoneOffset() * 60000);
      if (admin && (offsetDate.toISOString().split('T')[0] === date)) handleReload();
    });

    return () => {
      if (connection) {
        connection.stop();
      }
    };
  }, [handleReload]);


  const handleDateClick = useCallback((date) => {
    setSelectedDate(date);
    fetchAvailableTimes(selectedBarberId, date);
    setHoveredAppointment(null);
  }, [selectedBarberId, fetchAvailableTimes]);



  useEffect(() => {
    handleDateClick(selectedDate);
  }, [loading, handleDateClick, selectedDate]);

  useEffect(() => {
    handleReload();
  }, [selectedBarberId, selectedBarber, loading, handleReload]);

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const formatDate = (date) => {
    const timeZone = 'Europe/London'; // Adjust this based on your region
    const options = { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' };
    const formattedDate = new Intl.DateTimeFormat('en-GB', options).format(date);
    const [day, month, year] = formattedDate.split('/');
    return `${year}-${month}-${day}`;
  };

  const formatDateUK = (dateString) => {
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  };

  /* 
  This version of handleCancelAppointment() has to consider whether the appointment being deleted
  is a standard user appointment or a guest appointment:

  Standard user appointment -> appUserId = !null, appUserName = !null, guestName = '' (empty)

  Guest user appointment -> appUserId = null, appUserName = null, guestName = !'' (!empty)

  It uses appointmentToCancel, which is set when clicking cancel within the mapped appointments
  */

  const closeCancelModal = () => {
    setShowCancelModal(false)
    setRemoveMessage('')
  }

  const [cancelling, setCancelling] = useState(false)
  const handleCancelAppointment = async () => {
    try {
      setCancelling(true);
      setRemoveMessage('');

      let url = `${baseUrl}/api/Appointments/Admin/Delete/${appointmentToCancel.id}`;
      url += appointmentToCancel.appUserId === null && appointmentToCancel.guestName
        ? `?guestName=${encodeURIComponent(appointmentToCancel.guestName)}`
        : `?appUserId=${encodeURIComponent(appointmentToCancel.appUserId)}`;

      const cancelAppointment = await fetch(url, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      const cancelAppointmentResponse = await cancelAppointment.json();

      if (cancelAppointment.ok) {
        if (appointmentToCancel.appUserId && appointmentToCancel.appUserName) {
          sendAdminRemovedBookingMessage(appointmentToCancel);
        }
        timeoutRef.current = setTimeout(() => {
          setShowCancelModal(false);
          setCancelling(false);
          fetchAvailableTimes(selectedBarberId, selectedDate);
        }, 1000);
      } else {
        timeoutRef.current = setTimeout(() => {
          setRemoveMessage(cancelAppointmentResponse.message);
          setCancelling(false);
        }, 1000);
        console.error(`Backend failed to cancel appointment: ${cancelAppointmentResponse.message}`);
      }
    } catch (error) {
      timeoutRef.current = setTimeout(() => {
        setRemoveMessage('Unable to connect to the server');
        setCancelling(false);
      }, 1000);
      console.error(`Frontend failed to connect to backend: ${error.message}`);
    }
  };

  // Fetch users
  const fetchUsers = useCallback(async () => {
    try {
      setRefreshingUsers(true);
      const getUsers = await fetch(`${baseUrl}/api/AppUsers/customer`, {
        method: 'GET',
        credentials: 'include',
      });

      const getUsersResponse = await getUsers.json();
      const usersArray = Array.isArray(getUsersResponse.$values) ? getUsersResponse.$values : [];

      if (getUsers.ok) {
        setUsers(usersArray);
        setFilteredUsers(usersArray);
      } else {
        console.error('Backend failed to fetch customers:', getUsersResponse.message);
      }
    } catch (error) {
      console.error('Frontend failed to connect to backend:', error);
    } finally {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setRefreshingUsers(false), 2000);
    }
  }, [setUsers]);

  useEffect(() => {
    if (users.length === 0) {
      fetchUsers();
    } else { setFilteredUsers(users) }
  }, [users, fetchUsers]);

  const refreshUsers = () => {
    fetchUsers();
  };

  // Book an appointment
  const [bookMessage, setBookMessage] = useState('')
  const [manualBookAppointment, setManualBookAppointment] = useState([]);

  const openManualBook = (appointment) => {
    setRefreshingUsers(false);
    setSelectedUser(null)
    setShowManualBookModal(true);
    setManualBookAppointment(appointment);
    setBookMessage('')
  };

  /* 
  This version of handleBookAppointment() has to consider whether the appointment being created
  is a standard user appointment or a guest appointment:

  Standard user appointment -> appUserId = !null, appUserName = !null, guestName = '' (empty)

  Guest user appointment -> appUserId = null, appUserName = null, guestName = !'' (!empty)

  It relies upon the manual book modal ensuring that selectedUser and guestName cannot both have
  values, but if that occurs the function, aswell as the backend, ensure these requirements are met.

  As a result if guestName = '', it strongly suggests that the selectedUser details are not null,
  and viceversa. (Again, this isn't the case, the backend will catch these errors.)
  */
  const [booking, setBooking] = useState(false)
  const handleBookAppointment = async () => {
    try {
      setBooking(true);
      setBookMessage('');
      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      if (selectedUser && guestName !== '') {
        console.error('Cannot include both user and guest details');
        timeoutRef.current = setTimeout(() => {
          setBooking(false);
          setBookMessage('Cannot include both user and guest details');
        }, 1000);
        return;
      }

      if (!selectedUser && !guestName) {
        console.error('Either user or guest must be entered');
        timeoutRef.current = setTimeout(() => {
          setBooking(false);
          setBookMessage('All fields cannot be blank');
        }, 1000);
        return;
      }

      const appointment = {
        day: new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long' }),
        time: manualBookAppointment.time,
        date: formatDate(new Date(selectedDate)),
        appUserId: selectedUser?.userId || null,
        barberId: selectedBarberId,
        appUserName: selectedUser?.username || null,
        guestName: guestName || ''
      };

      // guestName has a value, therefore appointment.appUserId/appUserName = null
      const url = guestName !== ''
        ? `${baseUrl}/api/Appointments/Admin/BookGuestAppointment`
        : selectedUser
          ? `${baseUrl}/api/Appointments/Admin/BookAppointment`
          : null;

      const bookAppointment = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(appointment),
      });

      const bookAppointmentResponse = await bookAppointment.json();

      if (bookAppointment.ok) {
        setBookMessage('');
        timeoutRef.current = setTimeout(() => {
          setBooking(false);
          fetchAvailableTimes(selectedBarberId, selectedDate);
          setShowManualBookModal(false);
          setGuestName('')
        }, 1000);
        if (selectedUser) sendAdminBookedConfirmation(appointment);
      } else {
        console.error('Backend failed to book appointment:', bookAppointmentResponse.message);
        timeoutRef.current = setTimeout(() => {
          setBooking(false);
          setBookMessage(bookAppointmentResponse.message);
        }, 1000);
      }
    } catch (error) {
      console.error('Frontend failed to connect to backend:', error);
      timeoutRef.current = setTimeout(() => {
        setBooking(false);
        setBookMessage('Unable to connect to the server');
      }, 1000);
    }
  };


  // SMS

  // Sends user message saying staff have booked them an appointment
  const sendAdminBookedConfirmation = async (appointment) => {
    try {
      const sendSMS = await fetch(`${baseUrl}/api/Appointments/Admin/Send/BookingConfirmation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(appointment),
      });

      const sendSmsResponse =  sendSMS.ok ? null : await sendSMS.json();
      if (!sendSMS.ok) console.error('Backend failed to send admin booking confirmation SMS:', sendSmsResponse.message);
    } catch (error) {
      console.error('Frontend failed to connect to backend:', error);
    }
  };

  // Sends user message saying that staff have removed their appointment
  const sendAdminRemovedBookingMessage = async (appointment) => {
    const payload = {
      Id: appointment.id,
      AppUserId: appointment.appUserId,
      AppUserName: appointment.appUserName,
      Time: appointment.time,
      Day: appointment.day,
      Date: appointment.date,
    };

    try {
      const sendSMS = await fetch(`${baseUrl}/api/Appointments/Admin/Send/BookingRemovalConfirmation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const sendSmsResponse =  sendSMS.ok ? null : await sendSMS.json();
      if (!sendSMS.ok) console.error('Backend failed to send admin booking cancellation SMS:', sendSmsResponse.message);
    } catch (error) {
      console.error('Frontend failed to connect to backend:', error);
    }
  };


  // Contact user
  const [messageSuccess, setMessageSuccess] = useState(false);
  const [contactMessageResponse, setContactMessageResponse] = useState('');
  const [contactMessageLoading, setContactMessageLoading] = useState(false);
  const handleSendContactMessage = async () => {
    setContactMessageLoading(true);
    setContactMessageResponse('');
    setMessageSuccess(false);
    if (timeoutRef.current) { clearTimeout(timeoutRef.current); }

    if (contactMessage === '') {
      timeoutRef.current = setTimeout(() => {
        setContactMessageResponse('Cannot send a blank message');
        setContactMessageLoading(false);
      }, 1000);
      return;
    }

    try {
      const sendSMS = await fetch(`${baseUrl}/api/AppUsers/contact?userId=${appointmentToContact.appUserId}&message=${contactMessage}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      const responseText = await sendSMS.text();
      const sendSmsResponse = responseText ? JSON.parse(responseText) : {};

      if (sendSMS.ok) {
        setMessageSuccess(true);
        timeoutRef.current = setTimeout(() => {
          setContactMessageLoading(false);
          setContactMessageResponse('Message has been sent to ' + appointmentToContact.appUserName);
          setTimeout(() => {
            setShowContactModal(false);
            setAppointmentToContact(null);
          }, 2000);
        }, 1000);

      } else {
        console.error('Backend failed to send message:', sendSmsResponse.message || 'No error message returned');
        const customErrorMessage = sendSmsResponse.message || 'An error occurred while sending the message';
        timeoutRef.current = setTimeout(() => {
          setContactMessageLoading(false);
          setContactMessageResponse(customErrorMessage);
        }, 1000);
      }
    } catch (error) {
      console.error('Frontend failed to connect to backend:', error);

      timeoutRef.current = setTimeout(() => {
        setContactMessageLoading(false);
        setContactMessageResponse('Unable to connect to the server');
      }, 1000);
    }
  };

  // Modify an appointment
  const [appointmentToModify, setAppointmentToModify] = useState([]);

  /* 
  When clicking the modify button on a appointment, it will set its value
  to appointmentToModify, which is passed into the the Book component within
  the showModify modal
  */
  const onModify = (appointment) => {
    setAppointmentToModify(appointment);
    setShowModifyAppointmentModal(true);
  };

  // Passed into Book component within the showModify modal to allow it to close upon completion
  const toggleAdmin = (reload = false) => {
    setShowModifyAppointmentModal(false);
    if (reload) {
      handleDateClick(selectedDate);
    }
  };

  // Used within showManualBookModal
  const handleFilterUsers = (text) => {
    setFilterText(text);
    const filtered = users.filter(user =>
      user.username.toLowerCase().includes(text.toLowerCase())
    );
    setFilteredUsers(filtered);
  };

  // Filters appointments and combines with available times 
  const filteredAppointments = appointments.filter((appointment) => {
    return (
      selectedDate &&
      appointment.localDate.toISOString().split('T')[0] === selectedDate.toISOString().split('T')[0]
    );
  });

  const freeSlots = allAppointments.filter((time) => {
    return !filteredAppointments.some((appointment) => appointment.time === time);
  });

  const combinedAppointments = [...filteredAppointments, ...freeSlots.map((time) => ({ time, status: 'Free' }))].sort((a, b) => (a.time > b.time ? 1 : -1));

  // Sets how long until an appointment becomes unbookable
  const isTimeInPast = (time) => {
    const now = new Date();
    const [hours, minutes] = time.split(':').map(Number);
    const appointmentTime = new Date(selectedDate);
    appointmentTime.setHours(hours, minutes, 0, 0);
    const timeDifference = appointmentTime - now;
    const halfHour = (60 * 60 * 1000) / 2
    return appointmentTime < now || timeDifference <= halfHour;
  };

  useEffect(() => {
    if (showModifyAppointmentModal || showManualBookModal || showCancelModal || showContactModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [showModifyAppointmentModal, showManualBookModal, showCancelModal, showContactModal]);

  if (loading) {
    return (
      <div className='h-[50dvh] justify-center items-center flex'>
        <div className=' min-h-[80dvh] items-center justify-center flex' style={{ transform: 'scale(0.65)', transformOrigin: 'center' }}>
          <PoleLoader />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 rounded-2xl shadow-md  bg-primary-dark">
      <div className="flex items-center  mb-4 space-x-3 ">
        <h2 className="md:text-2xl text-xl font-semibold font-bodoni text-center scale-y-125">
          APPOINTMENTS
        </h2>
      </div>

      <Calendar
        currentMonth={currentMonth}
        selectedDate={selectedDate}
        onDateClick={handleDateClick}
        onNextMonth={nextMonth}
        onPrevMonth={prevMonth}
        previousMonthAvailable={true}
        nextMonthAvailable={true}
      />

      <div className="mb-2 rounded-lg overflow">
        <div className='flex justify-center items-center space-x-2'>
          <h2 className="text-xl font-semibold font-bodoni text-center scale-y-125">
            {selectedDate ? `${selectedDate.toLocaleDateString()}` : 'SELECT A DATE TO VIEW APPOINTMENTS'}
          </h2>
          <button
            className="bg-dark-main hover:bg-darker-main text-white rounded-full duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-1 flex justify-center items-center md:h-8 md:w-8 w-6 h-6"
            onClick={handleReload}
          >
            <IoMdRefresh className="md:h-6 md:w-6 w-5 h-5" />
          </button>
        </div>

        {loadingAppointments ? (
          <BarLoader animationDuration='1.2s' />
        ) : (
          combinedAppointments.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 duration-300 mt-2">
              {combinedAppointments.map((appointment, index) => (
                <div
                  key={appointment.id || `free-slot-${index}`}
                  onMouseDown={() => setHoveredAppointment(index)}
                  className={`${isTimeInPast(appointment.time) ? 'opacity-50 pointer-events-none' : ''} p-3 flex-col shadow-sm flex items-center justify-between bg-secondary-dark transition rounded-2xl duration-300`}
                >
                  <div className='overflow-hidden'>
                    <HeadingTextAlt
                      title={appointment.time}
                      subtitle={appointment.status === 'Free'
                        ? (isTimeInPast(appointment.time) ? 'Closed' : 'Free')
                        : appointment.appUserName || appointment.guestName
                      }
                      titleSize='text-xl'
                      subtitleSize='md:text-base text-sm'
                      minWidth={
                        (appointment.appUserName?.length > 10 || appointment.guestName?.length > 10)
                          ? 'min-w-0'
                          : 'min-w-[25px] md:min-w-[50px]'
                      }
                    />
                  </div>
                  {hoveredAppointment === index && (
                    appointment.status === 'Free' ? (
                      <div className="scale-in-center w-full flex mt-2 rounded-md shadow-lg z-20 justify-between">
                        <button
                          onClick={() => openManualBook(appointment)}
                          className={`${getButtonStyle('standard', isTouchScreen)} w-full px-4 py-2 mt-2`}
                        >
                          Manually Book
                        </button>
                      </div>
                    ) : (
                      <div className="scale-in-center w-full flex flex-col items-center mt-2 rounded-md shadow-lg z-20">
                        <div className='flex flex-col md:flex-row justify-between w-full'>
                          {appointment.appUserId && appointment.appUserName && (
                            <button
                              onClick={() => {
                                setShowContactModal(true);
                                setAppointmentToContact(appointment);
                                setContactMessage('');
                                setContactMessageResponse('');
                                setContactMessageLoading(false);
                              }}
                              className={`${getButtonStyle('standard', isTouchScreen)} w-full px-4 py-2 mt-2 md:mr-1`}
                            >
                              Contact
                            </button>
                          )}
                          <button
                            onClick={() => onModify(appointment)}
                            className={`${getButtonStyle('standard', isTouchScreen)} w-full px-4 py-2 mt-2`}
                          >
                            Modify
                          </button>
                        </div>
                        <button
                          onClick={() => {
                            setShowCancelModal(true);
                            setAppointmentToCancel(appointment);
                            setCancelling(false);
                          }}
                          className={`${getButtonStyle('standard', isTouchScreen)} w-full px-4 py-2 mt-2`}
                        >
                          Remove
                        </button>
                      </div>
                    )
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="flex items-center justify-center h-32 text-gray-500">
              {selectedDate ? 'You have no appointment slots for this date' : ''}
            </p>
          )
        )}
      </div>

      {showCancelModal && (
        <RemoveModal
          title="CONFIRM CANCELLATION"
          body={`Are you sure you want to cancel ${appointmentToCancel.appUserName ? appointmentToCancel.appUserName : appointmentToCancel.guestName}'s appointment on ${formatDateUK(appointmentToCancel.date)} at ${appointmentToCancel.time}?`}
          action={cancelling ? null : handleCancelAppointment}
          message={removeMessage}
          cancel={closeCancelModal}
          loading={cancelling}
        />
      )}

      {showManualBookModal && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-secondary-dark text-white rounded-3xl shadow-lg w-full max-w-md duration-300 scale-in-center">
            <div className="p-4 w-full">
              <HeadingText customText={`MANUAL BOOK`} customWidth={'35%'} textSize='text-2xl' />
              <div className="mb-4">
                <div className="flex items-baseline justify-between">
                  <p className='px-1'>Select a User</p>
                  <button
                    className={`${getButtonStyle('standard', isTouchScreen)}  mb-2 !rounded-full  md:h-8 md:w-8 w-6 h-6 items-center justify-center flex`}
                    onClick={refreshUsers}
                  >
                    <IoMdRefresh className="md:h-6 md:w-6 w-5 h-5" />
                  </button>
                </div>
                <input
                  type="text"
                  value={filterText}
                  onChange={(e) => handleFilterUsers(e.target.value)}
                  placeholder="Filter Users By Username"
                  className="mb-2 mr-2 transition duration-150 ease-in-out w-full px-2 py-1.5 rounded-md shadow-sm focus:outline-none focus:bg-dark-textfield-dark focus:shadow-md focus:shadow-dark-main/30 bg-dark-textfield text-white"
                />
                <select
                  className="transition duration-150 ease-in-out w-full px-2 py-1.5 rounded-md shadow-sm focus:outline-none focus:bg-dark-textfield-dark focus:shadow-md focus:shadow-dark-main/30 bg-dark-textfield text-white"
                  value={selectedUser ? selectedUser.id : ''}
                  disabled={refreshingUsers}
                  onChange={(e) => {
                    const user = users.find(u => u.username === e.target.value);
                    setSelectedUser(user);
                  }}
                >
                  <option value="">{refreshingUsers ? 'Refreshing Users...' : 'Select a User'}</option>
                  {filteredUsers.map((user, index) => (
                    <option key={user.id ? user.id : `user-${index}`} value={user.id}>
                      {user.username}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <p className='px-1'>Or Enter Guest Name</p>
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => e.target.value.length <= 15 ? setGuestName(e.target.value) : null}
                  placeholder="Enter Guest Name"
                  className="transition duration-150 ease-in-out w-full px-2 py-1.5 rounded-md shadow-sm focus:outline-none focus:bg-dark-textfield-dark focus:shadow-md focus:shadow-dark-main/30 bg-dark-textfield text-white"
                />
                <p className={`${getErrorMessageStyle()} mt-1 px-1`} style={{ userSelect: (bookMessage !== '') ? 'text' : 'none' }}>
                  {bookMessage !== '' ? bookMessage : '\u00A0'}
                </p>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={booking ? null : handleBookAppointment}
                  className={`${getButtonStyle('standard', isTouchScreen)} w-24 px-4 py-2 ${booking ? '!bg-darker-main pointer-events-none' : ''} `}

                >
                  {booking ? <BarLoader text='' heightClass='h-0' animationDuration='1.2s' customWidth='65px' /> : 'Book'}
                </button>
                <button
                  onClick={() => { setShowManualBookModal(false); setBooking(false); setGuestName('') }}
                  className={`${getButtonStyle('cancel', isTouchScreen)}  w-24 ml-2  px-4 py-2 `}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showModifyAppointmentModal && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-0 overflow-y-auto">
          <div className="bg-secondary-dark container mx-auto rounded-2xl text-white  w-full duration-300 scale-in-center max-h-full overflow-y-auto">
            <Book adminModify={true} originalAppointment={appointmentToModify} toggleAdmin={toggleAdmin} />
          </div>
        </div>
      )}

      {showContactModal && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-secondary-dark text-white rounded-2xl shadow-lg w-full max-w-md duration-300 scale-in-center">
            <div className="p-4">
              <HeadingTextAlt title={`CONTACT`} subtitle={appointmentToContact.appUserName} customWidth={'35%'} titleSize='text-2xl' subtitleSize='text-xl' />

              <div>
                <p className="px-0.5 md:text-base text-sm duration-300">Message</p>
                <textarea
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  className={`${getInputStyle()}`}
                  rows="4"
                ></textarea>
              </div>
              <p
                className={`${getErrorMessageStyle()}`}
                style={{ color: messageSuccess ? 'green' : 'red', userSelect: contactMessageResponse !== '' ? 'text' : 'none' }}
              >
                {contactMessageResponse || '\u00A0'}
              </p>


              <div className="flex justify-end pt-4  mt-2">
                <button
                  onClick={contactMessageLoading ? null : handleSendContactMessage}
                  className={`${getButtonStyle('standard', isTouchScreen)} mr-2 px-4 py-2 w-24 ${contactMessageLoading ? 'pointer-events-none bg-darker-main' : ''}`}
                >
                  {contactMessageLoading ? <BarLoader text='' heightClass='h-0' animationDuration='1.2s' customWidth='65px' /> : 'Send'}
                </button>
                <button
                  onClick={() => setShowContactModal(false)}
                  className={`${getButtonStyle('cancel', isTouchScreen)}  px-4 py-2 w-24`}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Appointments;
