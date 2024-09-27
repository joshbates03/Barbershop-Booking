import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { BiPlus } from 'react-icons/bi';
import { MdUpdate } from "react-icons/md";
import { AiOutlineDelete } from "react-icons/ai";
import RemoveModal from '../RemoveModal';
import HeadingTextAlt from '../Styles/HeadingTextAlt';
import HeadingText from '../Styles/HeadingText';
import Schedules from './Schedules';
import Appointments from '../Admin/Appointments';
import { IoMdRefresh } from "react-icons/io";
import { AdminFeaturesContext } from './AdminFeaturesContext';
import { AppointmentProvider } from '../Admin/AppointmentContext';
import baseUrl from '../Config';
import BarLoader from '../Loaders/BarLoader';
import { getButtonStyle, getErrorMessageStyle, getInputStyle } from '../Styles/Styles';
import { useTouch } from '../../Context/TouchScreenContext';

const AdminHandleBarber = () => {
  const isTouchScreen = useTouch();
  const timeoutRef = useRef(null);
  const [selectedUsername, setSelectedUsername] = useState('');
  const [newBarberName, setNewBarberName] = useState('');
  const [showAddBarber, setShowAddBarber] = useState(false);
  const [showUpdateBarber, setShowUpdateBarber] = useState(false);
  const [showRemoveBarber, setShowRemoveBarber] = useState(false);
  const [barberToRemove, setBarberToRemove] = useState(null);
  const [barberToUpdate, setBarberToUpdate] = useState(null);
  const [refreshUsers, setRefreshUsers] = useState(false);

  const { barberTab, setBarberTab,
    barberDetailTab, setBarberDetailTab,
    selectedBarber, setSelectedBarber,
    selectedBarberId, setSelectedBarberId,
    usernames, setUsernames,
    barbers, fetchBarbers,
    reloadingBarbers, barberFailedType }
    = useContext(AdminFeaturesContext);

  // State to manage barber detail tab
  const [usernameFilter, setUsernameFilter] = useState('');
  const handleUsernameFilterChange = (e) => {
    setUsernameFilter(e.target.value);
  };

  const fetchUsernames = useCallback(async (reload = false) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (reload) setRefreshUsers(true);

    try {
      const getUsernames = await fetch(`${baseUrl}/api/AppUsers/usernames`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      const getUsernamesResponse = await getUsernames.json();

      setUsernames(getUsernames.ok ? getUsernamesResponse.$values : []);

      if (!getUsernames.ok) {
        console.error('Backend failed to fetch usernames:', getUsernamesResponse.message)
      }

    } catch (error) {
      console.error('Frontend failed to connect to backend:', error);
      setUsernames([]);
    } finally {
      timeoutRef.current = setTimeout(() => setRefreshUsers(false), 2000);
    }
  }, [setUsernames]);

  useEffect(() => {
    if (usernames.length === 0) {
      fetchUsernames(false);
    }
  }, [fetchUsernames, usernames.length]);

  // Add a new barber
  const openAddBarber = () => {
    setNewBarberName('')
    setAddingBarberMessage('')
    setShowAddBarber(!showAddBarber);
  };

  const handleUsernameChange = (e) => {
    setSelectedUsername(e.target.value);
  };

  const handleNewBarberNameChange = (e) => {
    setNewBarberName(e.target.value);
  };

  const filteredUsernames = usernames
    .filter(username =>
      username.toLowerCase().includes(usernameFilter.toLowerCase()) &&
      !barbers?.some(barber => barber.userName === username) &&
      username !== 'admin'
    ).sort((a, b) => a.localeCompare(b));

  const [addingBarber, setAddingBarber] = useState(false)
  const [addingBarberMessage, setAddingBarberMessage] = useState('')
  const handleSaveNewBarber = async () => {

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setAddingBarber(true);
    setAddingBarberMessage('');

    try {
      const newBarber = { name: newBarberName, userName: selectedUsername };

      if (!newBarber.name || !newBarber.userName) {
        timeoutRef.current = setTimeout(() => {
          setAddingBarber(false);
          setAddingBarberMessage('All fields must be filled');
        }, 1000);
        return;
      }

      const addBarber = await fetch(`${baseUrl}/api/Barbers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newBarber),
      });

      const addBarberResponse = await addBarber.json();

      timeoutRef.current = setTimeout(() => {
        if (addBarber.ok) {
          setShowAddBarber(false);
          setSelectedUsername('');
          setNewBarberName('');
          fetchBarbers(true);
        } else {
          console.error('Failed to save the new barber:', addBarberResponse.message);
          setAddingBarberMessage(addBarberResponse.message);
        }
        setAddingBarber(false);
      }, 1000);

    } catch (error) {
      console.error('Error saving the new barber:', error);
      timeoutRef.current = setTimeout(() => {
        setAddingBarber(false);
        setAddingBarberMessage('Unable to connect to the server');
      }, 1000);
    }
  };


  // Update an existing barber
  const [currentBarber, setCurrentBarber] = useState('')

  const openUpdateBarber = (barber) => {
    setBarberToUpdate(barber);
    setNewBarberName(barber.name);
    setNewBarberName('')
    setCurrentBarber(barber.userName)
    setSelectedUsername(barber.userName);
    setUpdatingBarberMessage('')
    setShowUpdateBarber(true);
  };

  const handleShowUpdate = () => {
    setShowUpdateBarber(!showUpdateBarber);
    setUpdatingBarberMessage('');
  };

  const [updatingBarber, setUpdatingBarber] = useState(false)
  const [updatingBarberMessage, setUpdatingBarberMessage] = useState('');
  const handleUpdateBarber = async () => {

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setUpdatingBarber(true);
    setUpdatingBarberMessage('');

    try {
      if (!barberToUpdate) return;

      if (!newBarberName) {
        timeoutRef.current = setTimeout(() => {
          setUpdatingBarber(false);
          setUpdatingBarberMessage('Please enter a barber name');
        }, 1000);
        return;
      }

      const updatedBarber = { ...barberToUpdate, name: newBarberName, userName: selectedUsername };
      const updateBarber = await fetch(`${baseUrl}/api/Barbers/${barberToUpdate.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updatedBarber),
      });

      if (updateBarber.ok) {
        const oldUsername = barberToUpdate.userName;

        if (oldUsername !== selectedUsername) {
          const updateNewUser = await fetch(`${baseUrl}/api/Account/UpdateRole?userName=${selectedUsername}&role=Barber`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
          });

          if (!updateNewUser.ok) {
            console.error('Failed to update new user role to Barber.');
            timeoutRef.current = setTimeout(() => {
              setShowUpdateBarber(false);
              setUpdatingBarber(false);
              setBarberToUpdate(null);
              setSelectedUsername('');
              setNewBarberName('');
              fetchBarbers(true);
            }, 1000);
            return;
          }

          const updateOldUser = await fetch(`${baseUrl}/api/Account/UpdateRole?userName=${oldUsername}&role=User`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
          });

          if (!updateOldUser.ok) {
            console.error('Failed to update old user role to User.');
          }
        }

        timeoutRef.current = setTimeout(() => {
          setShowUpdateBarber(false);
          setUpdatingBarber(false);
          setBarberToUpdate(null);
          setSelectedUsername('');
          setNewBarberName('');
          fetchBarbers(true);
        }, 1000);
      } else {
        console.error('Failed to update the barber');
        const data = await updateBarber.json();
        timeoutRef.current = setTimeout(() => {
          setUpdatingBarber(false);
          setUpdatingBarberMessage(data.message);
        }, 1000);
      }
    } catch (error) {
      console.error('Error updating the barber:', error);
      timeoutRef.current = setTimeout(() => {
        setUpdatingBarber(false);
        setUpdatingBarberMessage('Unable to connect to the server');
      }, 1000);
    }
  };


  // Removes a barber
  const openRemoveBarber = (barber) => {
    setBarberToRemove(barber);
    setShowRemoveBarber(true);
    setRemoveBarberMessage('')
  };

  const [removingBarber, setRemovingBarber] = useState(false)
  const [removeBarberMessage, setRemoveBarberMessage] = useState('')
  const handleRemoveBarber = async () => {

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setRemovingBarber(true);
    setRemoveBarberMessage('');

    try {
      const { id: barberId } = barberToRemove;

      const response = await fetch(`${baseUrl}/api/Barbers/${barberId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      let responseData;
      try {
        responseData = await response.json();
      } catch (jsonError) {
        responseData = null;
      }

      timeoutRef.current = setTimeout(() => {
        if (response.ok) {
          setShowRemoveBarber(false);
          setBarberToRemove(null);
          fetchBarbers(true);
        } else {
          console.error('Failed to delete the barber');
          setRemoveBarberMessage(responseData?.message || 'An error occurred while deleting the barber.');
        }
        setRemovingBarber(false);
      }, 1000);

    } catch (error) {
      console.error('Error deleting the barber:', error);
      timeoutRef.current = setTimeout(() => {
        setRemovingBarber(false);
        setRemoveBarberMessage('Unable to connect to the server');
      }, 1000);
    }
  };


  const handleBarberChange = (e) => {
    const selectedId = e.target.value;
    setSelectedBarberId(selectedId);
    const selectedBarber = barbers.find(barber => barber.id === parseInt(selectedId));
    setSelectedBarber(selectedBarber);
  };

  useEffect(() => {
    if (showAddBarber || showUpdateBarber || showRemoveBarber) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [showAddBarber, showUpdateBarber, showRemoveBarber]);

  // Renders schedule and appointments when on 'view' tab
  const renderBarberDetailContent = () => {
    switch (barberDetailTab) {
      case 'schedules':
        return <Schedules selectedBarber={selectedBarber} />;
      case 'appointments':
        return (
          <Appointments selectedBarber={selectedBarber} />
        );
      default:
        return null;
    }
  };

  const warning = (message, action) => (
    <div className="rounded-2xl p-3 flex justify-between bg-darkergrey items-center border-b-4 border-l-2 border-r-2 border-dark-main mb-2">
      <div className='flex flex-col w-full'>
        <div className='flex justify-between'>
          <p className="font-semibold text-lg">WARNING</p>
          <button className={`${getButtonStyle('standard', isTouchScreen)} !rounded-full flex justify-center items-center md:h-8 md:w-8 h-6 w-6`} onClick={action}>
            <IoMdRefresh className="md:h-6 md:w-6 h-5 w-5" />
          </button>
        </div>
        <p>{message}</p>
      </div>
    </div>
  );

  // Renders manage and view barber content
  const renderTabContent = () => {
    switch (barberTab) {
      case 'manage':
        return (
          <div>
            {/* Failed to get barbers warning */}
            {(barbers === null || (barbers === null && reloadingBarbers)) && (
              warning('Be cautious if adding new barbers, as the data may be incomplete.', () => fetchBarbers(true))
            )}

            {reloadingBarbers && barbers == null ? (
              <div className="px-3 pt-3 pb-1 rounded-2xl mb-2 relative shadow-md bg-primary-dark">
                <div className="flex justify-between items-center w-full mb-2 px-2">
                  <h2 className="md:text-2xl text-xl font-semibold font-bodoni text-center text-white scale-y-125 mr-2">BARBERS</h2>
                  <button className={`${getButtonStyle('standard', isTouchScreen)} !rounded-full md:w-7 md:h-7 w-6 h-6 flex justify-center items-center`} onClick={openAddBarber}>
                    <BiPlus className="h-6 w-6" />
                  </button>
                </div>
                <p className='px-2 pb-9 text-center mt-5 text-gray-500'><BarLoader heightClass='h-6' /></p>
              </div>
            ) : (
              <div className="px-3 pt-3 pb-1 rounded-2xl mb-2 relative shadow-md bg-primary-dark">
                <div className="flex justify-between items-center w-full mb-2 px-2">
                  <h2 className="md:text-2xl text-xl font-semibold font-bodoni text-center text-white scale-y-125 mr-2">BARBERS</h2>
                  <button className={`${getButtonStyle('standard', isTouchScreen)} !rounded-full md:w-7 md:h-7 w-6 h-6 flex justify-center items-center`} onClick={openAddBarber}>
                    <BiPlus className="h-6 w-6" />
                  </button>
                </div>
                {barbers ? (
                  barbers.map((barber) => (
                    <div className="rounded-2xl p-3 flex justify-between bg-secondary-dark items-center mb-2 mt-2" key={barber.id}>
                      <div className=' w-52'>
                        <HeadingTextAlt title={barber.name} subtitle={barber.userName} titleSize = {`${barber.name.length >= 15 ? 'text-base' : 'text-xl'}`} />
                      </div>
                      <div className="flex flex-row md:space-x-2">
                        <button className={`${getButtonStyle('standard', isTouchScreen)} ml-2 px-4 py-2 mt-2 md:flex hidden`} onClick={() => openUpdateBarber(barber)}>Update</button>
                        <button className={`${getButtonStyle('standard', isTouchScreen)} ml-2 px-4 py-2 mt-2 md:flex hidden`} onClick={() => openRemoveBarber(barber)}>Remove</button>
                        <button className={`${getButtonStyle('standard', isTouchScreen)} !rounded-full w-10 h-10 mt-2 md:hidden flex justify-center items-center`} onClick={() => openUpdateBarber(barber)}>
                          <MdUpdate className="h-6 w-6" />
                        </button>
                        <button className={`${getButtonStyle('standard', isTouchScreen)} !rounded-full w-10 h-10 ml-2 mt-2 md:hidden flex justify-center items-center`} onClick={() => openRemoveBarber(barber)}>
                          <AiOutlineDelete className="h-6 w-6" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className='px-2 pb-9 text-center mt-5 text-gray-500'>{barberFailedType === 'backend_error' ? 'Unable to retrieve barbers' : 'Unable to connect to the server'}</p>
                )}
              </div>
            )}

            {/* Add/Update pop up */}
            {(showAddBarber || showUpdateBarber) && (
              <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
                <div className="bg-secondary-dark text-white rounded-3xl shadow-lg w-full max-w-md duration-300 scale-in-center p-4">
                  <div className='justify-center items-center flex'>
                    <HeadingText customText={showAddBarber ? 'ADD BARBER' : 'UPDATE BARBER'} customWidth='50%' textSize='text-2xl' />
                  </div>
                  {((barbers == null && filteredUsernames.length + 1 === usernames.length) || reloadingBarbers) && (
                    reloadingBarbers ? (
                      <div className="rounded-2xl p-3 flex justify-center bg-darkergrey items-center border-b-4 border-l-2 border-r-2 border-dark-main mb-2">
                        <BarLoader heightClass='h-20' />
                      </div>
                    ) : warning('Could not verify existing barbers. Avoid adding duplicate barbers with duplicate usernames.', () => fetchBarbers(true))
                  )}
                  <div className="mb-4">
                    <div className="flex items-baseline justify-between">
                      <p className='px-0.5'>Select a User</p>
                      <button
                        className={`${getButtonStyle('standard', isTouchScreen)} mb-2 !rounded-full md:h-8 md:w-8 w-6 h-6 flex items-center justify-center`}
                        onClick={refreshUsers ? null : () => fetchUsernames(true)}
                      >
                        <IoMdRefresh className="md:h-6 md:w-6 w-5 h-5" />
                      </button>
                    </div>
                    <input
                      type="text"
                      value={usernameFilter}
                      onChange={handleUsernameFilterChange}
                      placeholder="Filter Users By Username"
                      className={`${getInputStyle()} mb-2 mr-2`}
                    />
                    <select
                      id="userNameSelect"
                      value={selectedUsername}
                      disabled={refreshUsers}
                      onChange={handleUsernameChange}
                      className={getInputStyle()}
                    >
                      <option value="">{refreshUsers ? 'Refreshing Users...' : (showAddBarber ? 'Select a User' : currentBarber)}</option>
                      {filteredUsernames.map((user, index) => (
                        <option key={index} value={user}>{user}</option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-4">
                    <p className='px-0.5'>Enter Barber Name</p>
                    <input
                      id="barberNameInput"
                      type="text"
                      value={newBarberName}
                      onChange={(e) => {
                        if (e.target.value.length <= 20) {
                          handleNewBarberNameChange(e);
                        }
                      }}
                      className={getInputStyle()}
                      placeholder="Enter Barber Name"
                    />
                    <p className={`${getErrorMessageStyle()} mt-1 px-1`} style={{ userSelect: (updatingBarberMessage || addingBarberMessage) ? 'text' : 'none' }}>
                      {showAddBarber ? (addingBarberMessage || '\u00A0') : (updatingBarberMessage || '\u00A0')}
                    </p>
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={refreshUsers ? null : (showAddBarber ? (addingBarber ? null : handleSaveNewBarber) : (updatingBarber ? null : handleUpdateBarber))}
                      className={`${getButtonStyle('standard', isTouchScreen)} px-4 py-2 w-24 ${addingBarber || updatingBarber ? 'pointer-events-none bg-darker-main' : ''}`}
                    >
                      {showAddBarber
                        ? (addingBarber ? <BarLoader text='' heightClass='h-0' animationDuration='1.2s' customWidth='65px' /> : 'Add')
                        : (showUpdateBarber && (updatingBarber ? <BarLoader text='' heightClass='h-0' animationDuration='1.2s' customWidth='65px' /> : 'Update'))
                      }
                    </button>
                    <button
                      onClick={showAddBarber ? openAddBarber : handleShowUpdate}
                      className={`${getButtonStyle('cancel', isTouchScreen)} w-24 ml-2 px-4 py-2`}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}

            {showRemoveBarber && (
              <RemoveModal
                title="DELETE BARBER"
                body={`Are you sure you want to remove ${barberToRemove?.name}?`}
                action={handleRemoveBarber}
                cancel={() => { setShowRemoveBarber(false); setRemoveBarberMessage(''); }}
                message={removeBarberMessage}
                loading={removingBarber}
              />
            )}

          </div>
        );
      case 'view':
        return (
          <div>
            {barbers === null || reloadingBarbers ? (
              reloadingBarbers ? (
                <div className="rounded-2xl p-3 flex justify-center bg-darkergrey items-center border-b-4 border-l-2 border-r-2 border-dark-main mb-2">
                  <BarLoader heightClass='md:h-14 h-[76px]' />
                </div>
              ) : warning('Failed to retrieve barbers. Cannot display schedules and appointments.', () => fetchBarbers(true))
            ) : (
              <div className="p-1">
                <select id="barberSelect" value={selectedBarberId} onChange={handleBarberChange} className={getInputStyle()}>
                  <option value="">Select a Barber</option>
                  {barbers.map(barber => (
                    <option key={barber.id} value={barber.id}>{barber.name}</option>
                  ))}
                </select>
                {selectedBarber && (
                  <>
                    <div className="tabs flex justify-around mt-4 mb-2">
                      <button
                        className={`rounded-full w-full px-4 py-2 ${barberDetailTab === 'schedules' ? 'bg-dark-main text-white' : 'bg-dark-textfield text-black'}`}
                        style={{ borderTopRightRadius: '0.5rem', borderBottomRightRadius: '0.5rem' }}
                        onClick={() => setBarberDetailTab('schedules')}
                      >
                        Schedules
                      </button>
                      <button
                        className={`rounded-full w-full px-4 py-2 ${barberDetailTab === 'appointments' ? 'bg-dark-main text-white' : 'bg-dark-textfield text-black'}`}
                        style={{ borderTopLeftRadius: '0.5rem', borderBottomLeftRadius: '0.5rem' }}
                        onClick={() => setBarberDetailTab('appointments')}
                      >
                        Appointments
                      </button>
                    </div>
                    <div className="tab-content">{renderBarberDetailContent()}</div>
                  </>
                )}
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <AppointmentProvider>
      <div>
        <div className="tabs flex justify-center mb-3">
          <button
            className={`rounded-full w-full px-3 py-2 ${barberTab === 'manage' ? 'bg-dark-main text-white' : 'bg-dark-textfield text-black'}`}
            style={{ borderTopRightRadius: '0.5rem', borderBottomRightRadius: '0.5rem' }}
            onClick={() => setBarberTab('manage')}
          >
            Manage
          </button>
          <button
            className={`rounded-full w-full px-3 py-2 ${barberTab === 'view' ? 'bg-dark-main text-white' : 'bg-dark-textfield text-black'}`}
            style={{ borderTopLeftRadius: '0.5rem', borderBottomLeftRadius: '0.5rem' }}
            onClick={() => setBarberTab('view')}
          >
            Details
          </button>
        </div>
        <div>{renderTabContent()}</div>
      </div>
    </AppointmentProvider>
  );
};

export default AdminHandleBarber;
