import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BiPlus } from 'react-icons/bi';
import HeadingText from '../Styles/HeadingText';
import RemoveModal from '../RemoveModal';
import BarLoader from '../Loaders/BarLoader';
import { getButtonStyle, getInputStyle, getErrorMessageStyle } from '../Styles/Styles'
import { useTouch } from '../../Context/TouchScreenContext';
import PoleLoader from '../Loaders/PoleLoader';
import baseUrl from '../Config';

const Schedules = ({ selectedBarber }) => {

  const isTouchScreen = useTouch();
  const timeoutRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [schedules, setSchedules] = useState([]);
  const [specialSchedules, setSpecialSchedules] = useState([]);

  const [showEditScheduleModal, setShowEditScheduleModal] = useState(null);
  const [showAddScheduleModal, setShowAddScheduleModal] = useState(null);
  const [showAddSpecialScheduleModal, setShowAddSpecialScheduleModal] = useState(null);
  const [showScheduleToDeleteModal, setShowScheduleToDeleteModal] = useState(null);
  const [showSpecialScheduleToDeleteModal, setShowSpecialScheduleToDeleteModal] = useState(null);

  const [editDay, setEditDay] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [editTimes, setEditTimes] = useState('');

  const [addDay, setAddDay] = useState('');
  const [addStartDate, setAddStartDate] = useState('');
  const [addEndDate, setAddEndDate] = useState('');
  const [addTimes, setAddTimes] = useState('');
  const [isHoliday, setIsHoliday] = useState(false);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [increment, setIncrement] = useState('');

  const [hoveredSchedule, setHoveredSchedule] = useState(null);
  const [hoveredSpecialSchedule, setHoveredSpecialSchedule] = useState(null);
  const [refreshSchedules, setRefreshSchedules] = useState('');


  // Generates a list of times automatically
  const generateIncrementalTimes = (startTime, endTime, increment) => {
    if (increment <= 0 || !startTime || !endTime || isNaN(parseInt(increment))) return;

    const padTime = (time) => time.split(':').map(t => t.padStart(2, '0')).join(':');

    const times = [];
    let currentTime = new Date(`1970-01-01T${padTime(startTime)}:00`);
    const endTimeDate = new Date(`1970-01-01T${padTime(endTime)}:00`);

    while (currentTime < endTimeDate) {
      times.push(currentTime.toTimeString().slice(0, 5));
      currentTime.setMinutes(currentTime.getMinutes() + parseInt(increment));
    }

    if (times.length && times[times.length - 1] === padTime(endTime)) {
      times.pop();
    }

    setAddTimes(times.join(', '));
    setStartTime('');
    setEndTime('');
    setIncrement('');
  };

  // Get special schedules
  const [gotSpecialSchedules, setGotSpecialSchedules] = useState(false);
  const [specialScheduleStatusMessage, setSpecialScheduleStatusMessage] = useState('');
  const [reloadingSpecialSchedules, setReloadingSpecialSchedules] = useState(false);
  const fetchSpecialSchedules = useCallback(async (barberId, reloading = false) => {
    try {
      if (reloading) setReloadingSpecialSchedules(true);

      setGotSpecialSchedules(false);

      const getSpecialSchedules = await fetch(`${baseUrl}/api/SpecialSchedule`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (getSpecialSchedules.ok) {
        setGotSpecialSchedules(true);
        const getSpecialSchedulesResponse = await getSpecialSchedules.json();
        const filteredData = getSpecialSchedulesResponse.$values.filter(schedule => schedule.barberId === barberId);
        setSpecialSchedules(filteredData);
      } else {
        setGotSpecialSchedules(false);
        const getSpecialSchedulesResponse = await getSpecialSchedules.json();
        console.error('Backend failed to fetch special schedules:', getSpecialSchedulesResponse.message);
        setSpecialScheduleStatusMessage(getSpecialSchedulesResponse.message);
      }
    } catch (error) {
      setGotSpecialSchedules(false);
      console.error('Frontend failed to connect to backend:', error);
      setSpecialScheduleStatusMessage('Unable to connect to the server');
    } finally {
      setTimeout(() => {
        setLoading(false);
      }, 2000);
      setTimeout(() => {
        setRefreshSchedules('');
        setReloadingSpecialSchedules(false);
      }, 1000);
    }
  }, []);

  // Get schedules
  const [gotSchedules, setGotSchedules] = useState(false)
  const [scheduleStatusMessage, setScheduleStatusMessage] = useState('')
  const [reloadingSchedules, setReloadingSchedules] = useState(false)
  const fetchSchedules = useCallback(async (barberId, refresh = '', reloadEverything = false, reload) => {
    try {
      if (reload || reloadEverything || reload !== '') {
        // Do nothing
      } else {
        setGotSchedules(false);
      }

      if (reloadEverything) setLoading(true);

      if (reload) setReloadingSchedules(true);

      setRefreshSchedules(refresh);

      const getSchedules = await fetch(`${baseUrl}/api/Schedule`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', },
        credentials: 'include',
      });

      if (getSchedules.ok) {
        setGotSchedules(true);
        const getSchedulesData = await getSchedules.json();
        const filteredSchedules = getSchedulesData.$values.filter(schedule => schedule.barberId === barberId);
        setSchedules(filteredSchedules);
      } else {
        setGotSchedules(false);
        const getSchedulesResponse = await getSchedules.json();
        console.error('Backend failed to fetch schedules:', getSchedulesResponse.message);
        setScheduleStatusMessage(getSchedulesResponse.message);
      }
    } catch (error) {
      setGotSchedules(false);
      console.error('Frontend failed to connect to backend:', error);
      setScheduleStatusMessage('Unable to connect to the server');
    } finally {
      setTimeout(() => {
        setReloadingSchedules(false);
        setRefreshSchedules('');
      }, 1000);

      if (reloadEverything) {
        fetchSpecialSchedules(barberId);
      }
    }
  }, [fetchSpecialSchedules]);


  useEffect(() => {
    fetchSchedules(selectedBarber.id, '', true, false);
  }, [selectedBarber, fetchSchedules]);


  const isMatchingDay = (date, selectedDay) => {
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const day = new Date(date).getDay();
    return daysOfWeek[day] === selectedDay;
  };

  // Edit schedule
  const openEditSchedule = (schedule) => {
    setShowEditScheduleModal(schedule);
    setEditDay(schedule.day);
    setEditStartDate(schedule.startDate);
    setEditEndDate(schedule.endDate ? schedule.endDate : '');
    setEditTimes(schedule.times.$values.join(', '));
    setUpdateScheduleMessage('')
  };

  const closeEditSchedule = () => {
    setShowEditScheduleModal(null);
    setUpdateScheduleMessage('');
  };

  const [updatingSchedule, setUpdatingSchedule] = useState(false)
  const [updateScheduleMessage, setUpdateScheduleMessage] = useState('');
  const handleUpdateSchedule = async () => {
    try {

      setUpdatingSchedule(true)
      setUpdateScheduleMessage('')
      if (timeoutRef.current) { clearTimeout(timeoutRef.current); }

      const updatedSchedule = {
        id: showEditScheduleModal.id,
        day: editDay,
        times: editTimes ? editTimes.split(',').map(time => time.trim()) : [],
        barberId: showEditScheduleModal.barberId,
        startDate: editStartDate,
        endDate: editEndDate ? editEndDate : null
      };

      const updateSchedule = await fetch(`${baseUrl}/api/Schedule/${updatedSchedule.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updatedSchedule),
      });

      const updateScheduleResponse = await updateSchedule.json();

      timeoutRef.current = setTimeout(() => {
        if (updateSchedule.ok) {
          setShowEditScheduleModal(null);
          setUpdateScheduleMessage('');
          fetchSchedules(selectedBarber.id, updatedSchedule.day);
        } else {
          console.error('Backend failed to update schedule:', updateScheduleResponse.message);
          setUpdateScheduleMessage(updateScheduleResponse.message);
        }
        setUpdatingSchedule(false);
      }, 1000);
    } catch (error) {
      console.error('Frontend failed to connect to backend:', error);
      timeoutRef.current = setTimeout(() => {
        setUpdateScheduleMessage('Unable to connect to the server');
        setUpdatingSchedule(false)
      }, 1000);
    }
  };

  // Add special schedule
  const openAddSpecialSchedule = () => {
    setShowAddSpecialScheduleModal(true);
    setAddStartDate('');
    setAddTimes('');
    setIsHoliday(false);
    setAddSpecialScheduleMessage('')
  };

  const closeAddSpecialSchedule = () => {
    setShowAddSpecialScheduleModal(null);
    setAddEndDate('')
    setAddStartDate('')
    setAddTimes('');
    setAddSpecialScheduleMessage('');
  };

  const [addSpecialScheduleMessage, setAddSpecialScheduleMessage] = useState('');
  const [addingSpecialSchedule, setAddingSpecialSchedule] = useState('')
  const handleAddSpecialSchedule = async () => {
    try {
      if (timeoutRef.current) { clearTimeout(timeoutRef.current); }
      setAddingSpecialSchedule(true)
      setAddSpecialScheduleMessage('')

      const specialScheduleData = {
        startDate: addStartDate,
        endDate: addEndDate ? addEndDate : addStartDate,
        times: isHoliday ? [] : (addTimes ? addTimes.split(',').map(time => time.trim()) : []),
        isHoliday: isHoliday,
        barberId: selectedBarber.id,
      };

      if (addStartDate === '') {
        timeoutRef.current = setTimeout(() => {
          setAddSpecialScheduleMessage('Please enter a start date');
          setAddingSpecialSchedule(false)
        }, 1000);
        return
      }

      const addSpecialSchedule = await fetch(`${baseUrl}/api/SpecialSchedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(specialScheduleData),
      });

      const addSpecialScheduleResponse = await addSpecialSchedule.json();

      timeoutRef.current = setTimeout(() => {
        if (addSpecialSchedule.ok) {
          setAddSpecialScheduleMessage('');
          setStartTime('');
          setEndTime('');
          setAddEndDate('');
          setShowAddSpecialScheduleModal(null);
          fetchSpecialSchedules(selectedBarber.id, true);
        } else {
          console.error('Backend failed to add special schedule:', addSpecialScheduleResponse.message);
          setAddSpecialScheduleMessage(addSpecialScheduleResponse.message);
        }
        setAddingSpecialSchedule(false);
      }, 1000);
    } catch (error) {
      console.error('Frontend failed to connect to backend:', error);
      timeoutRef.current = setTimeout(() => {
        setAddSpecialScheduleMessage('Unable to connect to the server');
        setAddingSpecialSchedule(false)
      }, 1000);
    }
  };


  // Add schedule
  const openAddSchedule = () => {
    setShowAddScheduleModal(true);
    setAddDay('');
    setAddStartDate('');
    setAddEndDate('');
    setAddTimes('');
    setAddScheduleMessage('')
    setAddingSchedule(false)
  };

  const closeAddSchedule = () => {
    setShowAddScheduleModal(null);
    setAddScheduleMessage('');
    setStartTime('');
    setEndTime('');
    setIncrement('');
  };

  const [addScheduleMessage, setAddScheduleMessage] = useState('');
  const [addingSchedule, setAddingSchedule] = useState(false);
  const handleAddSchedule = async () => {
    try {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setAddScheduleMessage('');
      setAddingSchedule(true);

      if (addDay === '' && addStartDate === '') {
        timeoutRef.current = setTimeout(() => {
          setAddScheduleMessage('Please fill in required fields');
          setAddingSchedule(false);
        }, 1000);
        return;
      }

      if (!isMatchingDay(addStartDate, addDay)) {
        timeoutRef.current = setTimeout(() => {
          setAddScheduleMessage(addDay ? `Start date must be a ${addDay}` : '');
          setAddingSchedule(false);
        }, 1000);
        return;
      }

      if (addEndDate && !isMatchingDay(addEndDate, addDay)) {
        timeoutRef.current = setTimeout(() => {
          setAddScheduleMessage(addDay ? `End date must be a ${addDay}` : '');
          setAddingSchedule(false);
        }, 1000);
        return;
      }

      const newScheduleData = {
        day: addDay,
        times: addTimes ? addTimes.split(',').map(time => time.trim()) : [],
        barberId: selectedBarber.id,
        startDate: addStartDate,
        endDate: addEndDate || null
      };

      const saveNewSchedule = await fetch(`${baseUrl}/api/Schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newScheduleData),
      });

      const saveNewScheduleResponse = await saveNewSchedule.json();

      timeoutRef.current = setTimeout(() => {
        if (saveNewSchedule.ok) {
          setAddScheduleMessage('');
          setShowAddScheduleModal(null);
          fetchSchedules(selectedBarber.id, addDay);
        } else {
          console.error('Backend failed to add schedule:', saveNewScheduleResponse.message);
          setAddScheduleMessage(saveNewScheduleResponse.message);
        }
        setAddingSchedule(false);
      }, 1000);

    } catch (error) {
      console.error('Frontend failed to connect to backend:', error);
      timeoutRef.current = setTimeout(() => {
        setAddScheduleMessage('Unable to connect to the server');
        setAddingSchedule(false);
      }, 1000);
    }
  };


  // Delete schedule
  const [deletingSchedule, setDeletingSchedule] = useState(false)
  const [deleteScheduleMessage, setDeleteScheduleMessage] = useState('')
  const handleDeleteSchedule = async (schedule) => {
    try {
      setDeletingSchedule(true);
      setDeleteScheduleMessage('');
      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      const deleteSchedule = await fetch(`${baseUrl}/api/Schedule/${schedule.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      const deleteScheduleResponse = await deleteSchedule.json();

      timeoutRef.current = setTimeout(() => {
        if (deleteSchedule.ok) {
          setShowScheduleToDeleteModal(null);
          schedulesByDay[schedule.day].length === 1
            ? fetchSchedules(selectedBarber.id, '', false, true)
            : fetchSchedules(selectedBarber.id, schedule.day);
        } else {
          console.error('Backend failed to delete schedule:', deleteScheduleResponse.message);
          setDeleteScheduleMessage(deleteScheduleResponse.message);
        }
        setDeletingSchedule(false);
      }, 1000);

    } catch (error) {
      console.error('Frontend failed to connect to backend:', error);
      timeoutRef.current = setTimeout(() => {
        setDeletingSchedule(false);
        setDeleteScheduleMessage('Unable to connect to the server');
      }, 1000);
    }
  };


  // Delete special schedule
  const [deletingSpecialSchedule, setDeletingSpecialSchedule] = useState(false)
  const [deleteSpecialScheduleMessage, setDeleteSpecialScheduleMessage] = useState('')
  const handleDeleteSpecialSchedule = async (scheduleId) => {
    try {
      setDeletingSpecialSchedule(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      const deleteSpecialSchedule = await fetch(`${baseUrl}/api/SpecialSchedule/${scheduleId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      const deleteSpecialScheduleResponse = await deleteSpecialSchedule.json();

      timeoutRef.current = setTimeout(() => {
        if (deleteSpecialSchedule.ok) {
          setShowSpecialScheduleToDeleteModal(null);
          fetchSpecialSchedules(selectedBarber.id, true);
        } else {
          console.error('Backend failed to delete special schedule:', deleteSpecialScheduleResponse.message);
          setDeleteSpecialScheduleMessage(deleteSpecialScheduleResponse.message);
        }
        setDeletingSpecialSchedule(false);
      }, 1000);

    } catch (error) {
      console.error('Frontend failed to connect to backend:', error);
      timeoutRef.current = setTimeout(() => {
        setDeletingSpecialSchedule(false);
        setDeleteSpecialScheduleMessage('Unable to connect to the server');
      }, 1000);
    }
  };

  // Orders schedules
  const dayOrder = { 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6, 'Sunday': 7, };

  const orderedSchedules = schedules
    .sort((a, b) => {
      const dayComparison = dayOrder[a.day] - dayOrder[b.day];
      if (dayComparison !== 0) {
        return dayComparison;
      }
      return new Date(a.startDate) - new Date(b.startDate);
    });

  const orderedSpecialSchedules = specialSchedules
    .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

  const groupSchedulesByDay = (schedules) => {
    return schedules.reduce((groupedSchedules, schedule) => {
      const day = schedule.day;
      if (!groupedSchedules[day]) {
        groupedSchedules[day] = [];
      }
      groupedSchedules[day].push(schedule);
      return groupedSchedules;
    }, {});
  };

  const schedulesByDay = groupSchedulesByDay(orderedSchedules);

  const formatDate = (dateString) => {
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  };

  // Disable scroll when a pop up is open
  useEffect(() => {
    if (showEditScheduleModal || showAddScheduleModal || showAddSpecialScheduleModal || showScheduleToDeleteModal || showSpecialScheduleToDeleteModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [showEditScheduleModal, showAddScheduleModal, showAddSpecialScheduleModal, showScheduleToDeleteModal, showSpecialScheduleToDeleteModal]);


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
    <div className="mt-4 mb-4 h-min text-white " >
      {selectedBarber.id && (
        <div className="rounded-lg">
          <div className=' p-4 bg-primary-dark rounded-2xl mb-2'>
            <div className="flex items-center justify-between mb-4 space-x-3">
              <h2 className="md:text-2xl text-xl font-semibold font-bodoni text-center scale-y-125">
                {selectedBarber ? 'SCHEDULES' : 'Unknown'}
              </h2>
              {gotSchedules && !reloadingSchedules && (
                <button
                  className={`${getButtonStyle('standard', isTouchScreen)}  md:h-8 md:w-8 h-6 w-6 justify-center items-center flex !rounded-full`}
                  onClick={openAddSchedule}
                >
                  <BiPlus className="h-6 w-6" />
                </button>
              )}
            </div>

            {gotSchedules && !reloadingSchedules ? (
              Object.keys(schedulesByDay).length === 0 ? (
                <div className=" flex flex-col h-32 justify-center items-center" >
                  <p className="w-full text-center text-gray-500 mb-5">You have no schedules!</p>
                </div>
              ) : (
                Object.keys(schedulesByDay).map(day => (
                  <React.Fragment key={day}>
                    {refreshSchedules === day ? (
                      <div className=' '>
                        <HeadingText customText={day.toUpperCase()} customWidth={'100%'} textSize="md:text-2xl text-xl" />
                        <div className="flex flex-row justify-center items-center">
                          <BarLoader animationDuration='1.2s' />
                        </div>
                      </div>
                    ) : (
                      <>
                        <HeadingText customText={day.toUpperCase()} customWidth={'100%'} textSize="md:text-2xl text-xl" />
                        <div className=' my-2    items-center rounded-2xl ' >

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-5">
                            {schedulesByDay[day].map((schedule) => (
                              <div
                                key={schedule.id}
                                className="bg-secondary-dark p-4 rounded-2xl shadow-md   flex flex-col"
                                onMouseDown={() => setHoveredSchedule(schedule.id)}
                              >
                                <div className='items-center justify-center flex flex-col '>
                                  <HeadingText customText={`${formatDate(schedule.startDate)}  ${schedule.endDate ? ` - ${formatDate(schedule.endDate)}` : '- ONGOING'}`} customWidth={'100%'} textSize="md:text-lg text-base" />
                                  <p className='text-center font-roboto font-light text-balance'>{schedule.times.$values.length > 0 ? schedule.times.$values.join(', ') : 'No hours'}</p>
                                </div>

                                {hoveredSchedule === schedule.id && (
                                  <div className="scale-in-center w-full  flex flex-row right-0  mt-2  z-20 justify-between">
                                    <button
                                      onClick={() => openEditSchedule(schedule)}
                                      className={`${getButtonStyle('standard', isTouchScreen)} mr-2 w-full px-4 py-2 `}
                                    >
                                      Update
                                    </button>
                                    <button
                                      onClick={() => { setShowScheduleToDeleteModal(schedule); setDeleteScheduleMessage('') }}
                                      className={`${getButtonStyle('standard', isTouchScreen)} ml-2 w-full px-4 py-2`}
                                    >
                                      Delete
                                    </button>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </React.Fragment>

                ))
              )
            ) :

              <div className=" flex flex-col h-32 justify-center items-center" >
                {reloadingSchedules ? (<BarLoader heightClass='h-32' animationDuration='1.2s' />) : (
                  <>
                    <div className="w-full mb-2 text-center">{scheduleStatusMessage}</div>
                    <div className='justify-center items-center flex'>
                      <button onClick={() => fetchSchedules(selectedBarber.id, '', false, true)} className={`${getButtonStyle('standard', isTouchScreen)}  px-4 py-2  `}>Try Again</button>
                    </div></>
                )}
              </div>
            }
          </div>

          <div className='bg-primary-dark p-4 rounded-2xl'>
            <div className="flex items-center  justify-between mb-4 space-x-3">
              <h2 className="md:text-2xl text-xl font-semibold font-bodoni text-center scale-y-125">
                {selectedBarber ? 'SPECIAL SCHEDULES' : 'Unknown'}
              </h2>
              {gotSpecialSchedules && !reloadingSpecialSchedules && (
                <button
                  className={`${getButtonStyle('standard', isTouchScreen)}  md:h-8 md:w-8 h-6 w-6 justify-center items-center flex !rounded-full`}
                  onClick={openAddSpecialSchedule}
                >
                  <BiPlus className="h-6 w-6" />
                </button>
              )}
            </div>

            {gotSpecialSchedules && !reloadingSpecialSchedules ? (
              (specialSchedules.length === 0) ? (
                <div className=" flex flex-col h-32 justify-center items-center" >
                  <p className="w-full text-center text-gray-500 mb-5">You have no special schedules!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  {orderedSpecialSchedules.map((specialSchedule) => (
                    <div
                      key={specialSchedule.id}
                      className="bg-secondary-dark p-4 rounded-lg shadow-lg flex flex-col"
                      onMouseDown={() => setHoveredSpecialSchedule(specialSchedule.id)}
                    >
                      <HeadingText customText={`${formatDate(specialSchedule.startDate)} - ${specialSchedule.endDate ? formatDate(specialSchedule.endDate) : formatDate(specialSchedule.startDate)}`} customWidth='100%' textSize='text-lg' />
                      <p className='text-center font-roboto font-light text-balance'>{specialSchedule.times.$values.length > 0 ? specialSchedule.times.$values.join(', ') : 'No hours'}</p>
                      {hoveredSpecialSchedule === specialSchedule.id && (
                        <div className="scale-in-center w-full flex flex-row right-0 mt-2 rounded-md shadow-lg z-20 opacity-4 justify-between">
                          <button
                            onClick={() => setShowSpecialScheduleToDeleteModal(specialSchedule.id)}
                            className={`${getButtonStyle('standard', isTouchScreen)}  w-full  px-4 py-2 mt-2`}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )
            ) :
              <div className=" flex flex-col h-32 justify-center items-center" >
                {reloadingSpecialSchedules ? (<BarLoader heightClass='h-32' animationDuration='1.2s' />) : (
                  <>
                    <div className="w-full mb-2 text-center">{specialScheduleStatusMessage}</div>
                    <div className='justify-center items-center flex'>
                      <button onClick={() => fetchSpecialSchedules(selectedBarber.id, true)} className={`${getButtonStyle('standard', isTouchScreen)}  px-4 py-2  `}>Try Again</button>
                    </div></>
                )}
              </div>
            }
          </div>
        </div>
      )}

      {/* Schedule Edit Modal  */}
      {showEditScheduleModal && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-secondary-dark text-white rounded-2xl shadow-lg w-full max-w-md duration-300 scale-in-center">
            <div className="p-4">
              <HeadingText customText={'UPDATE SCHEDULE'} customWidth={'55%'} textSize='text-2xl' />
              <div className="mb-1">
                <p className=" duration-300 px-0.5">End Date</p>
                <input type="date" value={editEndDate} onChange={(e) => setEditEndDate(e.target.value)} className={`${getInputStyle()}`} />
              </div>
              <div className={`${getErrorMessageStyle()}`} style={{ userSelect: updateScheduleMessage !== '' ? 'text' : 'none' }}>{updateScheduleMessage || '\u00A0'}</div>
              <div className="flex justify-end">
                <button
                  onClick={handleUpdateSchedule}
                  className={`${getButtonStyle('standard', isTouchScreen)} w-24 mr-2 px-4 py-2  mt-2 ${updatingSchedule ? 'pointer-events-none bg-darker-main' : ''}`}
                >
                  {updatingSchedule ? <BarLoader customWidth='65px' text='' heightClass='h-0' animationDuration='1.2s' /> : 'Save'}
                </button>
                <button
                  onClick={closeEditSchedule}
                  className={`${getButtonStyle('cancel', isTouchScreen)} w-24 px-4 py-2  mt-2`}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add New Schedule Modal */}
      {showAddScheduleModal && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-secondary-dark text-white rounded-2xl shadow-lg w-full max-w-md duration-300 scale-in-center">
            <div className="p-4">
              <HeadingText customText={'ADD SCHEDULE'} customWidth={'50%'} textSize='text-2xl' />
              <div className="mb-2">
                <p className="block px-0.5 md:text-base text-sm duration-300">Day</p>
                <select value={addDay} onChange={(e) => setAddDay(e.target.value)} className={`${getInputStyle()}`}>
                  <option value="">Select a day</option>
                  <option value="Monday">Monday</option>
                  <option value="Tuesday">Tuesday</option>
                  <option value="Wednesday">Wednesday</option>
                  <option value="Thursday">Thursday</option>
                  <option value="Friday">Friday</option>
                  <option value="Saturday">Saturday</option>
                  <option value="Sunday">Sunday</option>
                </select>
              </div>
              <div className="mb-2">
                <p className="block px-0.5 md:text-base text-sm duration-300">Start Date</p>
                <input type="date" value={addStartDate} onChange={(e) => setAddStartDate(e.target.value)} className={`${getInputStyle()} w-full`} />
              </div>
              <div className="mb-2">
                <p className="block px-0.5 md:text-base text-sm duration-300">End Date</p>
                <input type="date" value={addEndDate} onChange={(e) => setAddEndDate(e.target.value)} className={`${getInputStyle()} w-full`} />
              </div>
              <div className="mb-2">
                <p className=" block px-0.5 md:text-base text-sm duration-300">
                  Time Slots
                </p>
                <input type="text" value={addTimes} onChange={(e) => setAddTimes(e.target.value)} className={`${getInputStyle()} w-full`} placeholder="09:00, 09:30, ..." />
              </div>
              <hr className="my-3" />
              <div className="mb-2">
                <label className="block mb-2 md:text-base text-sm duration-300">Generate Time Slots</label>
                <div className="flex flex-col md:flex-row md:space-x-4">
                  <div className="flex-1 mb-2 md:mb-0">
                    <p className="block px-0.5 md:text-base text-sm duration-300">Start Time</p>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className={`${getInputStyle()} w-full`}
                    />
                  </div>
                  <div className="flex-1 mb-2 md:mb-0">
                    <p className="block px-0.5 md:text-base text-sm duration-300">End Time</p>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className={`${getInputStyle()} w-full`}
                    />
                  </div>
                  <div className="flex-1">
                    <p className="block px-0.5 md:text-base text-sm duration-300">Increment</p>
                    <input
                      type="number"
                      value={increment}
                      onChange={(e) => setIncrement(e.target.value)}
                      className={`${getInputStyle()}`}
                      placeholder="Minutes"
                    />
                  </div>
                </div>
                <button
                  onClick={() => generateIncrementalTimes(startTime, endTime, parseInt(increment))}

                  className={`${!true ? 'bg-gray-500 text-gray-700 cursor-not-allowed' : 'bg-dark-main hover:bg-darker-main text-white'
                    } px-4 py-2 rounded-2xl duration-300 w-full shadow-md ${isHoliday ? '' : 'hover:shadow-lg transform hover:-translate-y-0.5'
                    } mt-2 `}
                >
                  Generate
                </button>
                <p className={`${getErrorMessageStyle()} mt-2 justify-center items-center flex`} style={{ userSelect: addScheduleMessage !== '' ? 'text' : 'none' }}>{addScheduleMessage || '\u00A0'}</p>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={addingSchedule ? null : handleAddSchedule}
                  className={`${getButtonStyle('standard', isTouchScreen)} mr-2 px-4 py-2  mt-1 w-24 ${addingSchedule ? 'pointer-events-none bg-darker-main' : ''}`}

                >
                  {addingSchedule ? <BarLoader text='' heightClass='h-4' animationDuration='1.2s' customWidth='65px' /> : 'Confirm'}
                </button>
                <button
                  onClick={closeAddSchedule}
                  className={`${getButtonStyle('cancel', isTouchScreen)} w-24 px-4 py-2  mt-1`}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Special Schedule Modal */}
      {showAddSpecialScheduleModal && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-secondary-dark text-white rounded-2xl shadow-lg w-full max-w-md duration-300 scale-in-center">
            <div className="p-4">
              <HeadingText customText={'ADD SPECIAL SCHEDULE'} customWidth={'80%'} textSize='text-2xl' />
              <div className="mb-2">
                <p className="block px-0.5 md:text-base text-sm duration-300">Start Date</p>
                <input type="date" value={addStartDate} onChange={(e) => setAddStartDate(e.target.value)} className={`${getInputStyle()} w-full`} />
              </div>
              <div className="mb-2">
                <p className="block px-0.5 md:text-base text-sm duration-300">End Date</p>
                <input type="date" value={addEndDate} onChange={(e) => setAddEndDate(e.target.value)} className={`${getInputStyle()} w-full`} />
              </div>
              <div className="mb-2 flex flex-row items-center">
                <p className="block px-0.5 md:text-base text-sm duration-300">Is Holiday</p>
                {/* From Uiverse.io by Galahhad  */}
                <input
                  type="checkbox" checked={isHoliday}
                  onChange={(e) => setIsHoliday(e.target.checked)}
                  class="ui-checkbox ml-1.5"
                />
              </div>
              <div className="mb-2">
                <p className="block px-0.5 md:text-base text-sm duration-300">Times</p>
                <input
                  type="text"
                  value={isHoliday === true ? '' : addTimes}
                  onChange={(e) => setAddTimes(e.target.value)}
                  className={`${getInputStyle()}`}
                  disabled={isHoliday}
                />
              </div>
              <hr className="my-3" />
              <div className="mb-2">
                <label className="block mb-2 md:text-base text-sm duration-300">Generate Times</label>
                <div className="flex flex-col md:flex-row md:space-x-4">
                  <div className="flex-1 mb-2 md:mb-0">
                    <p className="block px-0.5 md:text-base text-sm duration-300">Start Time</p>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className={`${getInputStyle()} w-full`}
                      disabled={isHoliday}
                    />
                  </div>
                  <div className="flex-1 mb-2 md:mb-0">
                    <p className="block px-0.5 md:text-base text-sm duration-300">End Time</p>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className={`${getInputStyle()} w-full`}
                      disabled={isHoliday}
                    />
                  </div>
                  <div className="flex-1">
                    <p className="block px-0.5 md:text-base text-sm duration-300">Increment</p>
                    <input
                      type="number"
                      value={increment}
                      onChange={(e) => setIncrement(e.target.value)}
                      className={`${getInputStyle()}`}
                      placeholder="Minutes"
                      disabled={isHoliday}
                    />
                  </div>
                </div>
                <button
                  onClick={() => generateIncrementalTimes(startTime, endTime, parseInt(increment))}
                  className={`${isHoliday ? 'opacity-50 bg-dark-main hover:bg-razoredgedark pointer-events-none' : 'bg-dark-main hover:bg-darker-main text-white'
                    } px-4 py-2 rounded-2xl duration-300 w-full shadow-md ${isHoliday ? '' : 'hover:shadow-lg transform hover:-translate-y-0.5'
                    } mt-2`}
                  disabled={isHoliday}
                >
                  Generate
                </button>
                <p className={`${getErrorMessageStyle()} mt-2 justify-center items-center flex`} style={{ userSelect: addSpecialScheduleMessage !== '' ? 'text' : 'none' }}>{addSpecialScheduleMessage || '\u00A0'}</p>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={addingSpecialSchedule ? null : handleAddSpecialSchedule}
                  className={`${getButtonStyle('standard', isTouchScreen)} w-24 mr-2 px-4 py-2  mt-1 ${addingSpecialSchedule ? 'pointer-events-none bg-darker-main' : ''}`}

                >
                  {addingSpecialSchedule ? <BarLoader text='' heightClass='h-0' animationDuration='1.2s' customWidth='65px' /> : 'Confirm'}
                </button>
                <button
                  onClick={closeAddSpecialSchedule}
                  className={`${getButtonStyle('cancel', isTouchScreen)} w-24 px-4 py-2  mt-1`}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Schedule Confirmation Modal */}
      {showScheduleToDeleteModal && (
        <RemoveModal
          title="DELETE SCHEDULE"
          body={`Are you sure you want to delete this schedule?`}
          action={deletingSchedule ? null : () => handleDeleteSchedule(showScheduleToDeleteModal)}
          cancel={() => { setShowScheduleToDeleteModal(null); setDeleteScheduleMessage(''); }}
          message={deleteScheduleMessage}
          loading={deletingSchedule}
        />
      )}

      {/* Delete Special Schedule Confirmation Modal */}
      {showSpecialScheduleToDeleteModal && (
        <RemoveModal
          title="DELETE SCHEDULE"
          body={`Are you sure you want to delete this schedule?`}
          action={deletingSpecialSchedule ? null : () => handleDeleteSpecialSchedule(showSpecialScheduleToDeleteModal)}
          cancel={() => { setShowSpecialScheduleToDeleteModal(null); setDeleteSpecialScheduleMessage(''); }}
          message={deleteSpecialScheduleMessage}
          loading={deletingSpecialSchedule}
        />
      )}
    </div>
  );
};

export default Schedules;
