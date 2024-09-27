import React, { useState } from 'react';
import HeadingText from '../Styles/HeadingText';
import BarLoader from '../Loaders/BarLoader';
import { getButtonStyle, getErrorMessageStyle } from '../Styles/Styles';
import { useTouch } from '../../Context/TouchScreenContext';

const BookingConfirmationModal = ({
  bookingMessage,
  cantBook,
  confirming,
  cancelRebooking,
  handleBookAppointment,
  removeModal,
  selectedDate,
  selectedTime,
  existingAppointment,
  cancelAndRebook,
  cancelAndRebookMessage
}) => {

  const isTouchScreen = useTouch();
  const [flipOldDate, setFlipOldDate] = useState(false);
  const [flipNewDate, setFlipNewDate] = useState(false);

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-secondary-dark text-white rounded-2xl shadow-lg w-full max-w-md duration-0 scale-in-center transition-all overflow-hidden" style={{ transition: 'height 0.3s ease' }}>
        <div className={`p-4`}>
          <div>
            <HeadingText customText="BOOK APPOINTMENT" textSize='text-2xl' />
            <p>
              Booking details:&nbsp;
              <strong className='cursor-pointer' onMouseDown={() => setFlipNewDate(!flipNewDate)}>
                {flipNewDate
                  ? `${selectedDate.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}, ${selectedTime}`
                  : `${selectedDate.toLocaleDateString()}, ${selectedTime}`}
              </strong>
            </p>
            <p className={`${getErrorMessageStyle()} mt-1`} style={{ userSelect: bookingMessage !== '' ? 'text' : 'none' }}>{bookingMessage || '\u00A0'}</p>
            <div className="flex justify-end">
              <button
                disabled={confirming}
                onClick={confirming ? null : handleBookAppointment}
                className={`${getButtonStyle('standard', isTouchScreen)} mr-2 px-4 py-2 mt-2 w-24 ${confirming ? 'pointer-events-none bg-darker-main' : ''} ${cantBook ? 'pointer-events-none opacity-25 ' : ''}`}
              >
                {confirming ? <BarLoader text='' heightClass='h-4' animationDuration='1.2s' customWidth='60px' /> : 'Confirm'}
              </button>
              <button
                onClick={removeModal}
                className={`${getButtonStyle('cancel', isTouchScreen)}  px-4 py-2  mt-2 w-24`}
              >
                Close
              </button>
            </div>
          </div>

          <div className={`transition-height duration-1000 ease-in-out  ${cantBook ? 'max-h-screen' : 'max-h-0'}`}>
            {cantBook && (
              <div className=''>
                <hr className="my-4 " />
                <p className={`${getErrorMessageStyle()} mt-2 `}>
                  Appointments are limited to one per week. Cancel your booking to proceed.
                </p>
                <ul className="mt-2">
                  {existingAppointment.length > 0 ? (
                    (() => {
                      const appointment = existingAppointment[0]; // Use the first appointment
                      const appointmentDate = new Date(appointment.date);
                      const day = appointmentDate.toLocaleDateString('en-GB', { weekday: 'long' });
                      const date = appointmentDate.getDate();
                      const month = appointmentDate.toLocaleDateString('en-GB', { month: 'long' });

                      return (
                        <div className='flex flex-col'>
                          <li key={appointment.id} className="mb-2 justify-between flex items-center">
                            <div onMouseDown={() => setFlipOldDate(!flipOldDate)} className='cursor-pointer font-semibold whitespace-nowrap'>
                              {flipOldDate ? (
                                `${appointmentDate.toLocaleDateString()}, ${appointment.time}`
                              ) : (
                                `${day} ${date} ${month}, ${appointment.time}`
                              )}
                            </div>

                            <button
                              onClick={cancelRebooking ? null : () => { cancelAndRebook(appointment.id) }}
                              className={`${getButtonStyle('standard', isTouchScreen)}  px-4 py-2  ml-4 ${cancelRebooking ? 'pointer-events-none bg-darker-main' : ''}`}
                            >
                              {cancelRebooking ? <BarLoader text='' heightClass='h-6' animationDuration='1.2s' customWidth='85px' /> : 'Reschedule'}
                            </button>
                          </li>
                          <p className={`${getErrorMessageStyle()} mt-1`}>{cancelAndRebookMessage}</p>
                        </div>
                      );
                    })()
                  ) : (
                    <li>No available times</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmationModal;
