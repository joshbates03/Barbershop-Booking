import React from 'react';
import { getButtonStyle } from './Styles/Styles';
import { MdArrowBack } from "react-icons/md";
import HeadingText from './Styles/HeadingText';
import { MdArrowForward } from "react-icons/md";
import { useTouch } from '../Context/TouchScreenContext';
const Calendar = ({ currentMonth, selectedDate, onDateClick, onNextMonth, onPrevMonth, previousMonthAvailable, nextMonthAvailable }) => {

  const isTouchScreen = useTouch();

  const generateCalendar = (month) => {
    const startDay = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
    const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const calendar = [];
    let week = [];

    for (let i = 0; i < startDay; i++)  week.push(null);

    for (let day = 1; day <= daysInMonth; day++) {
      week.push(new Date(month.getFullYear(), month.getMonth(), day));
      if (week.length === 7) {
        calendar.push(week);
        week = [];
      }
    }

    if (week.length > 0)  calendar.push(week);

    return calendar;
  };

  return (
    <div className='shadow-md rounded-lg p-4 mb-4 bg-secondary-dark'>
      <div className="flex justify-between mb-4">
        <button
          className={`${getButtonStyle('standard', isTouchScreen)} ${previousMonthAvailable ? "" : "opacity-25 pointer-events-none"} !rounded-full md:w-7 md:h-7 w-6 h-6 flex justify-center items-center`}
          onClick={onPrevMonth}
          disabled={!previousMonthAvailable}
        >
          <MdArrowBack className="h-6 w-6" />
        </button>
  
        <div className='flex flex-col items-center'>
          <HeadingText customText={currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase()} />
        </div>
  
        <button
          className={`${getButtonStyle('standard', isTouchScreen)} ${nextMonthAvailable ? "" : "opacity-25 pointer-events-none"} !rounded-full md:w-7 md:h-7 w-6 h-6 flex justify-center items-center`}
          onClick={onNextMonth}
        >
          <MdArrowForward className="h-6 w-6" />
        </button>
      </div>
  
      <table className="w-full table-fixed border-collapse text-white bg-third-dark rounded-lg">
        <thead>
          <tr>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <th key={day} className="w-1/7 px-1 py-2 md:px-4 md:py-2">{day}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {generateCalendar(currentMonth).map((week, weekIndex) => (
            <tr key={weekIndex}>
              {week.map((day, dayIndex) => {
                const today = new Date().setHours(0, 0, 0, 0);
                const isPastDate = day && day < today;
                const isSelectedDate = day?.toDateString() === selectedDate?.toDateString();
                const isToday = day?.toDateString() === new Date().toDateString();
  
                return (
                  <td
                    key={dayIndex}
                    onClick={() => day && !isPastDate && onDateClick(day)}
                    className={`px-1 py-1.5 text-center cursor-pointer transition-colors duration-200 bg-third-dark ${
                      isSelectedDate ? '!bg-dark-main text-white shadow-md'
                      : isToday ? ''
                      : isPastDate ? '!bg-[#252525] border-2 border-[#252525] text-gray-600 cursor-not-allowed'
                      : 'hover:bg-darker-main text-white'
                    }`}
                  >
                    {day ? day.getDate() : ''}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
  
};

export default Calendar;
