import React, { useState, useEffect, useRef, useContext, useCallback } from 'react';
import { FaPhone } from "react-icons/fa";
import { MdEmail } from "react-icons/md";
import HeadingText from '../Styles/HeadingText';
import UserAppointments from '../Profile/UserAppointments';
import PoleLoader from '../Loaders/PoleLoader';
import useFetchAppointments from '../../Hooks/useFetchAppointments';
import UserDetails from '../Profile/UserDetails';
import { AdminFeaturesContext } from './AdminFeaturesContext';
import { IoMdRefresh } from 'react-icons/io';
import { ProfileProvider } from '../Profile/ProfileContext';
import { getButtonStyle, getErrorMessageStyle, getInputStyle } from '../Styles/Styles';
import { useTouch } from '../../Context/TouchScreenContext';
import BarLoader from '../Loaders/BarLoader';
import baseUrl from '../Config';
import { LuEye } from "react-icons/lu";
import { LuEyeOff } from "react-icons/lu";

const AdminHandleUser = () => {
  
  const [userLoading, setUserLoading] = useState(false);
  const { fetchAppointments, setAppointments, } = useFetchAppointments();
  const { selectedUser, setSelectedUser, users, setUsers } = useContext(AdminFeaturesContext);
  const isTouchScreen = useTouch();
  const [placeholderText, setPlaceholderText] = useState('Search By Username, Email or Phone Number')
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [confirmUsername, setConfirmUsername] = useState('');
  const [deleteMessage, setDeleteMessage] = useState('');
  const [mountLoad, setMountLoad] = useState(true);
  const timeoutRef = useRef(null);

  const formatPhoneNumber = (phoneNumber) => {
    if (!phoneNumber) {
      return '';
    }
    const countryCode = phoneNumber.slice(0, 3);
    const restOfNumber = phoneNumber.slice(3);
    return `(${countryCode}) ${restOfNumber}`;
  };

  const [reloadingUsers, setReloadingUsers] = useState(false)
  const fetchUsers = useCallback(async (reloading = false) => {
    try {
      reloading && setReloadingUsers(true);
  
      const getUsers = await fetch(`${baseUrl}/api/AppUsers/customer`, {
        method: 'GET',
        credentials: 'include',
      });
      const getUsersResponse = await getUsers.json();
  
      setUsers(getUsers.ok && Array.isArray(getUsersResponse.$values) ? getUsersResponse.$values : null);
      !getUsers.ok && console.error('Backend failed to fetch customers:', getUsersResponse.message);
  
    } catch (error) {
      console.error('Frontend failed to connect to backend:', error);
      setUsers(null);
    } finally {
      if (reloading) {
        timeoutRef.current && clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => setReloadingUsers(false), 1000);
      }
    }
  }, [setUsers]);
  
  useEffect(() => {
    if (users?.length === 0) {
      fetchUsers();
    }
  }, [users, fetchUsers]);

  const handleSearchChange = (e) => {
    const term = e.target.value;
    setSearchTerm(term);

    if (term === '') {
      setFilteredUsers([]);
    } else {
      const filtered = users.filter(user =>
        (user.username && user.username.toLowerCase().includes(term.toLowerCase())) ||
        (user.email && user.email.toLowerCase().includes(term.toLowerCase())) ||
        (user.phoneNumber && user.phoneNumber.includes(term))
      );
      setFilteredUsers(filtered);
    }
  };

  const handleUserClick = useCallback(async (user) => {
    setUserLoading(true);
    setSearchTerm('');
    setSelectedUser(user);

    try {
      await fetchAppointments(user.userId);
    } catch (error) {
      console.error('Failed to fetch appointments:', error);
    } finally {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setUserLoading(false);
      }, 2000);
    }
  }, [fetchAppointments, setSelectedUser]);

  useEffect(() => {
    setTimeout(() => {
      setMountLoad(false)
    }, 100);
    if (selectedUser) {
      handleUserClick(selectedUser)
    }
  }, [handleUserClick, selectedUser]);


  const refresh = (reload = false) => {
    fetchUsers(reload)
    setSearchTerm('')
    setAppointments(null)
    setSelectedUser(null)
    setUserLoading(null)
    setPlaceholderText('Refreshing Users...')
    timeoutRef.current = setTimeout(() => {
      setPlaceholderText('Search By Username, Email or Phone Number');
    }, 1000);

  }

  // Delete a user
  const [deletingUser, setDeletingUser] = useState(false)
  const [deleteSuccess, setDeleteSuccess] = useState(false)

  const closeDeleteUser = () => {
    setShowDeleteConfirm(false);
    setDeleteMessage('');
    setConfirmUsername('')
  };

  const handleDeleteUser = async () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setDeleteMessage('');
    setDeletingUser(true);
    setDeleteSuccess(false);

    if (confirmUsername !== selectedUser.username) {
      timeoutRef.current = setTimeout(() => {
        setDeleteMessage('Usernames do not match');
        setDeletingUser(false);
      }, 1000);
      return;
    }

    try {
      const deleteUser = await fetch(`${baseUrl}/api/AppUsers/DeleteCustomerAccount`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId: selectedUser.userId }),
      });

      const deleteUserResponse = deleteUser.ok ? null : await deleteUser.json();

      timeoutRef.current = setTimeout(() => {
        if (deleteUser.ok) {
          setUsers(users.filter(user => user.userId !== selectedUser.userId));
          setDeleteSuccess(true);
          setDeleteMessage(`User ${selectedUser.username} has been deleted`);
          timeoutRef.current = setTimeout(() => {
            setSelectedUser(null);
            closeDeleteUser();
          }, 2500);
        } else {
          console.error('Backend failed to delete user:', deleteUserResponse?.message);
          setDeleteMessage('Failed to delete user account');
        }
        setDeletingUser(false);
      }, 1000);

    } catch (error) {
      console.error('Frontend failed to connect to backend:', error);
      timeoutRef.current = setTimeout(() => {
        setDeleteMessage('Unable to connect to the server');
        setDeletingUser(false);
      }, 1000);
    }
  };

  // Reset password
  const [resetMessage, setResetMessage] = useState('')
  const [resetting, setResetting] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [checkNewPassword, setCheckNewPassword] = useState('')
  const [showCheckNewPassword, setShowCheckNewPassword] = useState(false)
  const [resetSuccess, setResetSuccess] = useState(false)

  const closeResetPassword = () => {
    setShowResetPassword(false);
    setResetMessage('');
    setShowCheckNewPassword(false)
    setShowNewPassword(false)
    setNewPassword('')
    setCheckNewPassword('')
  };

  const handleResetPassword = async () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setResetMessage('');
    setResetting(true);
    setResetSuccess(false);

    if (!newPassword || !checkNewPassword || newPassword !== checkNewPassword) {
      const message = !newPassword || !checkNewPassword ? 'Please fill in all fields' : 'Passwords do not match';
      timeoutRef.current = setTimeout(() => {
        setResetMessage(message);
        setResetting(false);
      }, 1000);
      return;
    }

    try {
      const resetPassword = await fetch(`${baseUrl}/api/Account/ResetCustomerPassword`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          UserId: selectedUser.userId,
          NewPassword: newPassword,
          ConfirmPassword: checkNewPassword
        }),
      });

      const resetPasswordResponse = await resetPassword.json();

      timeoutRef.current = setTimeout(() => {
        if (resetPassword.ok) {
          setResetMessage('Password reset successfully');
          setResetSuccess(true);
          timeoutRef.current = setTimeout(() => closeResetPassword(), 2000);
        } else {
          setResetMessage(resetPasswordResponse.errors.length > 0 ? resetPasswordResponse.errors[0] : 'Failed to reset password');
        }
        setResetting(false);
      }, 1000);

    } catch (error) {
      console.error('Frontend failed to connect to backend:', error);
      timeoutRef.current = setTimeout(() => {
        setResetMessage('Failed to connect to the server');
        setResetting(false);
      }, 1000);
    }
  };


  useEffect(() => {
    if (showDeleteConfirm || showResetPassword) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [showDeleteConfirm, showResetPassword]);

  return (
    <div>
      {/* Warning message if cannot fetch users */}
      {(users === null || reloadingUsers) ? (
        <div className="rounded-2xl p-3 flex justify-between bg-darkergrey items-center border-b-4 border-l-2 border-r-2 border-dark-main mb-2">
          {reloadingUsers ? (<div className='flex items-center justify-center w-full'><BarLoader animationDuration='1.2s' heightClass='h-14' /></div>) : (
            <>
              <div className="flex flex-col h-14">
                <p className="font-semibold text-lg">WARNING</p>
                <p>Failed to retrieve users.</p>
              </div>
              <button
                className="bg-razoredgered hover:bg-razoredgedark text-white rounded-full duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-1 flex justify-center items-center md:h-8 md:w-8 h-6 w-6"
                onClick={reloadingUsers ? null : () => refresh(true)}
              >
                <IoMdRefresh className="md:h-6 md:w-6 h-5 w-5" />
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="p-4  rounded-2xl mb-2 bg-primary-dark relative transition-all duration-300 ">
          <div className="flex justify-between w-full">
            <h2 className="md:text-2xl text-xl font-semibold font-bodoni text-center text-white scale-y-125 mr-2">USERS</h2>
            <button
              className={`${getButtonStyle('standard', isTouchScreen)} !rounded-full flex justify-center items-center md:h-8 md:w-8 w-6 h-6`}
              onClick={() => refresh(false)}
            >
              <IoMdRefresh className="md:h-6 md:w-6 w-5 h-5" />
            </button>
          </div>

          <div>
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder={placeholderText}
              disabled={placeholderText === 'Refreshing Users...'}
              className={`${getInputStyle()} mt-1 `}
            />

            {searchTerm && (
              <ul
                className="text-white bg-secondary-dark rounded-lg scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-dark-main overflow-y-auto"
                style={{ maxHeight: 'calc(5.55 * 4rem)', height: `${filteredUsers.length * 60}px` }}
              >
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user, index) => (
                    <li
                      key={user.userId}
                      className={`px-4 py-1 cursor-pointer border-b border-dark-textfield border-opacity-50 
                                ${index === filteredUsers.length - 1 ? 'border-b-0' : ''} 
                                ${isTouchScreen ? 'active:bg-dark-textfield' : 'hover:bg-dark-textfield'} duration-300`}
                      onClick={() => handleUserClick(user)}
                    >
                      <p>{user.username}</p>
                      <p className="font-light mt-0.5 items-center hidden md:flex">
                        <MdEmail className="mr-1 text-dark-main" /> {user.email}
                        <FaPhone className="transform rotate-90 ml-2 mr-1 text-dark-main" />
                        {user.phoneNumber ? formatPhoneNumber(user.phoneNumber) : 'N/A'}
                      </p>
                      <p className="font-light mt-0.5 items-center md:hidden flex">
                        <FaPhone className="transform rotate-90 mr-2 text-dark-main" />
                        {user.phoneNumber ? formatPhoneNumber(user.phoneNumber) : 'N/A'}
                      </p>
                    </li>
                  ))
                ) : (
                  <p className="text-white mt-1">No users found</p>
                )}
              </ul>
            )}

            {(userLoading || !selectedUser) ? (
              selectedUser && (
                <div className="flex items-center justify-center" style={{ transform: 'scale(0.5)', transformOrigin: 'center' }}>
                  <PoleLoader />
                </div>
              )
            ) : (
              <div className={`mt-6 ${mountLoad ? 'opacity-0' : ''}`}>
                <ProfileProvider adminView={true} adminUserId={selectedUser.userId}>
                  <UserDetails adminView={true} setShowDeleteConfirm={setShowDeleteConfirm} setShowResetPassword={setShowResetPassword} />
                  <UserAppointments adminView={true} />
                </ProfileProvider>
              </div>
            )}
          </div>
        </div>
      )
      }

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-secondary-dark text-white rounded-2xl shadow-lg w-full max-w-md duration-300 scale-in-center p-4">
            <HeadingText customText="DELETE ACCOUNT" customWidth="100%" textSize="text-2xl " />
            <p className='mt-1 px-1'>Enter the username of the user you wish to delete:</p>
            <input
              type="text"
              value={confirmUsername}
              onChange={(e) => setConfirmUsername(e.target.value)}
              className="mb-2 mr-2 w-full px-2 py-1.5 rounded-md shadow-sm transition duration-150 ease-in-out focus:outline-none focus:bg-dark-textfield-dark focus:shadow-md focus:shadow-dark-main/30 bg-dark-textfield text-white"
              placeholder="Enter username"
            />
            <p className={`${getErrorMessageStyle()} px-1 -mt-1.5 ${deleteSuccess ? '!text-green' : ''}`} style={{ userSelect: deleteMessage ? 'text' : 'none' }}>
              {deleteMessage || '\u00A0'}
            </p>
            <div className="flex justify-end pt-2">
              <button
                onClick={deletingUser ? null : handleDeleteUser}
                className={`${getButtonStyle('standard', isTouchScreen)} w-24 mr-2 mt-4 px-4 py-2 ${deletingUser ? 'pointer-events-none bg-darker-main' : ''}`}
              >
                {deletingUser ? <BarLoader animationDuration='1.2s' heightClass='h-0' text='' customWidth='65px' /> : 'Confirm'}
              </button>
              <button
                onClick={closeDeleteUser}
                className={`${getButtonStyle('cancel', isTouchScreen)} w-24 mt-4 px-4 py-2`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showResetPassword && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-secondary-dark text-white rounded-2xl shadow-lg w-full max-w-md duration-300 scale-in-center p-4">
            <form>
              <HeadingText customText="RESET PASSWORD" customWidth="100%" textSize="text-2xl " />
              <p className='mt-2 px-0.5'>New Password</p>
              <div className='flex'>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  autoComplete='new-password'
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={getInputStyle()}
                  placeholder="Enter New Password"
                />
                {showNewPassword ? (
                  <LuEyeOff onClick={() => setShowNewPassword(false)} className='absolute mt-2.5 right-6 hover:scale-110 duration-300' />
                ) : (
                  <LuEye onClick={() => setShowNewPassword(true)} className='absolute mt-2.5 right-6 hover:scale-110 duration-300' />
                )}
              </div>
              <p className='mt-2 px-0.5'>Confirm New Password</p>
              <div className='flex'>
                <input
                  type={showCheckNewPassword ? 'text' : 'password'}
                  value={checkNewPassword}
                  autoComplete='new-password'
                  onChange={(e) => setCheckNewPassword(e.target.value)}
                  className={getInputStyle()}
                  placeholder="Enter New Password"
                />
                {showCheckNewPassword ? (
                  <LuEyeOff onClick={() => setShowCheckNewPassword(false)} className='absolute mt-2.5 right-6 hover:scale-110 duration-300' />
                ) : (
                  <LuEye onClick={() => setShowCheckNewPassword(true)} className='absolute mt-2.5 right-6 hover:scale-110 duration-300' />
                )}
              </div>
              <p className={`${getErrorMessageStyle()} px-1 mt-1 ${resetSuccess ? '!text-green' : ''}`} style={{ userSelect: resetMessage ? 'text' : 'none' }}>
                {resetMessage || '\u00A0'}
              </p>
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={resetting ? null : () => handleResetPassword()}
                  className={`${getButtonStyle('standard', isTouchScreen)} w-24 mr-2 mt-4 px-4 py-2 ${resetting ? 'pointer-events-none bg-darker-main' : ''}`}
                >
                  {resetting ? <BarLoader animationDuration='1.2s' heightClass='h-0' text='' customWidth='65px' /> : 'Confirm'}
                </button>
                <button
                  type="button"
                  onClick={closeResetPassword}
                  className={`${getButtonStyle('cancel', isTouchScreen)} w-24 mt-4 px-4 py-2`}
                >
                  Close
                </button>
              </div>
            </form>
          </div>
        </div>
      )}



    </div>
  );
};

export default AdminHandleUser;
