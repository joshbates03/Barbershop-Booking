import React, { useState, useRef, useContext, useEffect } from 'react';
import { IoClose } from "react-icons/io5";
import { FaPhone, FaTimes, FaEdit, FaCheck, FaEnvelope } from "react-icons/fa";
import { MdVerified } from "react-icons/md";
import HeadingTextAlt from '../Styles/HeadingTextAlt';
import BarLoader from '../Loaders/BarLoader';
import { getButtonStyle, getErrorMessageStyle, getInputStyle } from '../Styles/Styles';
import { useTouch } from '../../Context/TouchScreenContext';
import { ProfileContext } from './ProfileContext';
import { IoMdRefresh } from "react-icons/io";
import { MdOutlineAlternateEmail } from "react-icons/md";
import baseUrl from '../Config';

const UserDetails = ({ adminView = false, setShowDeleteConfirm, setShowResetPassword }) => {
    const [loading, setLoading] = useState(adminView ? true : false);

    const {
        profile,
        fetchProfile,
        profileStatus,
        userId,
        reloadingProfile
    } = useContext(ProfileContext);

    const isTouchScreen = useTouch();
    const timeoutRef = useRef(null);
    const [showEmailReminder, setShowEmailReminder] = useState(profile.userId ? true : false);
    const [showPhoneReminder, setShowPhoneReminder] = useState(profile.userId ? true : false);
    const [isVerifyingPhone, setIsVerifyingPhone] = useState(false);
    const [verificationCode, setVerificationCode] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [newPhoneNumber, setNewPhoneNumber] = useState('');
    const [message, setMessage] = useState('');
    const [messageColour, setMessageColour] = useState('text-green');
    const [showEditEmailModal, setShowEditEmailModal] = useState(false);
    const [showEditPhoneModal, setShowEditPhoneModal] = useState(false);
    const [showVerifyPhoneModal, setShowVerifyPhoneModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const messageTimeoutRef = useRef(null);


    useEffect(() => {
        if (profile.length !== 0) {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            timeoutRef.current = setTimeout(() => { setLoading(false) }, 2000);
        }
    }, [profile]);

    const handleVerificationCodeChange = (e) => {
        setVerificationCode(e.target.value);
    };

    const handleCancelPhoneVerification = () => {
        setIsVerifyingPhone(false);
        setVerificationCode('');
        setErrorMessage('');
    };

    // Sends verification email 
    const handleVerifyEmail = async () => {
        try {
            const url = adminView
                ? `${baseUrl}/api/Account/AdminResendVerificationEmail?userid=${profile.userId}`
                : `${baseUrl}/api/Account/ResendVerificationEmail?userid=${profile.userId}`;

            const resendVerificationEmail = await fetch(url, { method: 'POST', credentials: 'include' });
            const resendVerificationEmailResponse = await resendVerificationEmail.json();

            setMessageColour(resendVerificationEmail.ok ? 'text-green' : 'text-dark-main');
            setMessage(resendVerificationEmail.ok ? 'Verification email sent' : resendVerificationEmailResponse.message);
            console.error(!resendVerificationEmail.ok && 'Backend failed to send verification email:', resendVerificationEmailResponse.message);
        } catch (error) {
            console.error('Frontend failed to connect to backend:', error);
            setMessageColour('text-dark-main');
            setMessage('Unable to connect to the server');
        }

        if (messageTimeoutRef.current) clearTimeout(messageTimeoutRef.current);
        messageTimeoutRef.current = setTimeout(() => setMessage(''), 5000);
    };

    // Updates a user's email
    const [updatingEmail, setUpdatingEmail] = useState(false);
    const handleUpdateEmail = async (id) => {

        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setUpdatingEmail(true);
        setErrorMessage('');

        try {
            const updateEmail = await fetch(`${baseUrl}/api/AppUsers/UpdateEmail`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ id, currentEmail: profile.email, newEmail }),
            });

            timeoutRef.current = setTimeout(async () => {
                if (updateEmail.ok) {
                    fetchProfile(profile.userId, true);
                    setShowEditEmailModal(false);
                    setErrorMessage('');
                } else {
                    const updateEmailResponse = await updateEmail.json();
                    console.error('Backend failed to update email:', updateEmailResponse);
                    setErrorMessage(updateEmailResponse.message);
                }
                setUpdatingEmail(false);
            }, 1000);

            if (updateEmail.ok && messageTimeoutRef.current) clearTimeout(messageTimeoutRef.current);
            if (updateEmail.ok) messageTimeoutRef.current = setTimeout(() => setMessage(''), 5000);

        } catch (error) {
            console.error('Frontend failed to connect to backend:', error);
            timeoutRef.current = setTimeout(() => {
                setErrorMessage('Unable to connect to the server');
                setUpdatingEmail(false);
            }, 1000);
        }
    };

    // Updates a user's phone number
    const [updatingPhoneNumber, setUpdatingPhoneNumber] = useState(false);
    const handleUpdatePhoneNumber = async (id) => {

        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setUpdatingPhoneNumber(true);
        setErrorMessage('');

        try {
            const updatePhoneNumber = await fetch(`${baseUrl}/api/AppUsers/UpdatePhoneNumber`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ id, currentPhoneNumber: profile.phoneNumber, newPhoneNumber }),
            });

            timeoutRef.current = setTimeout(async () => {
                if (updatePhoneNumber.ok) {
                    fetchProfile(profile.userId, true);
                    setShowEditPhoneModal(false);
                } else {
                    const updatePhoneNumberResponse = await updatePhoneNumber.json();
                    console.error('Backend failed to update phone number:', updatePhoneNumberResponse);
                    setErrorMessage(updatePhoneNumberResponse.message);
                }
                setUpdatingPhoneNumber(false);
            }, 1000);
        } catch (error) {
            console.error('Frontend failed to connect to backend:', error);
            timeoutRef.current = setTimeout(() => {
                setErrorMessage('Unable to connect to the server');
                setUpdatingPhoneNumber(false);
            }, 1000);
        }
    };

    // Verifies an entire mobile code
    const [verifying, setVerifying] = useState(false);
    const handleConfirmPhoneVerification = async (verificationCode, userId) => {
        setResendSuccess(false)
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setVerifying(true);
        setErrorMessage('');

        if (!verificationCode) {
            timeoutRef.current = setTimeout(() => {
                setErrorMessage('Please enter a code');
                setVerifying(false);
            }, 1000);
            return;
        }

        try {
            const verifyPhone = await fetch(`${baseUrl}/api/Account/VerifyPhone?userId=${userId}&code=${verificationCode}`, {
                method: 'GET',
                credentials: 'include',
            });

            timeoutRef.current = setTimeout(async () => {
                if (verifyPhone.ok) {
                    setIsVerifyingPhone(false);
                    setShowVerifyPhoneModal(false);
                    setErrorMessage('');
                    fetchProfile(profile.userId, true);
                } else {
                    const verifyPhoneResponse = await verifyPhone.json();
                    setErrorMessage(verifyPhoneResponse.message);

                }
                setVerifying(false);
            }, 1000);
        } catch (error) {
            console.error('Frontend failed to connect to backend:', error);
            timeoutRef.current = setTimeout(() => {
                setErrorMessage('Unable to connect to the server');
                setVerifying(false);
            }, 1000);
        }
    };


    // Resend mobile verification code
    const [resendingCode, setResendingCode] = useState(false);
    const [resendSuccess, setResendSuccess] = useState(false);
    const handleResendCode = async (userId) => {
        setResendingCode(true);
        setResendSuccess(false)
        setErrorMessage('');
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        try {
            let url = adminView
                ? `${baseUrl}/api/Account/AdminGetNewVerificationCode?userid=${profile.userId}`
                : `${baseUrl}/api/Account/GetNewVerificationCode?userid=${profile.userId}`;
            const resendCode = await fetch(url, { method: 'POST', credentials: 'include' });
            const resendCodeResponse = await resendCode.json();

            timeoutRef.current = setTimeout(() => {
                setResendSuccess(resendCode.ok ? true : false)
                setErrorMessage(resendCode.ok ? 'Verification code resent successfully' : resendCodeResponse.message || 'Unknown error');
                setResendingCode(false);
            }, 1000);
        } catch (error) {
            console.error('Frontend failed to connect to backend:', error);
            timeoutRef.current = setTimeout(() => {
                setErrorMessage('Error resending verification code. Please try again later.');
                setResendingCode(false);
            }, 1000);
        }
    };


    const formatPhoneNumber = (phoneNumber) => {
        const match = phoneNumber.match(/^\+44(\d{4})(\d{6})$/);
        return match ? `(+44) ${match[1]}${match[2]}` : phoneNumber;
    };

    useEffect(() => {
        if (showVerifyPhoneModal || showEditEmailModal || showEditPhoneModal) {
          document.body.style.overflow = 'hidden';
        } else {
          document.body.style.overflow = 'auto';
        }
    
        return () => {
          document.body.style.overflow = 'auto';
        };
      }, [showVerifyPhoneModal, showEditEmailModal, showEditPhoneModal ]);

    const verificationMessages = (
        <div>
            {(!profile.emailConfirmed && showEmailReminder) && (
                <div className="mb-1 py-3 px-2 md:px-3 flex flex-row bg-dark-main items-center rounded-md">
                    <p className="text-white text-sm md:text-base">{adminView ? `${profile.username} has not verified their email` : 'Verify your email for optional news and updates'}</p>
                    <IoClose className='text-white ml-auto cursor-pointer' onClick={() => setShowEmailReminder(false)} />
                </div>
            )}
            {(!profile.phoneNumberConfirmed && showPhoneReminder) && (
                <div className="mb-1 py-3 px-2 md:px-3 flex flex-row bg-dark-main items-center rounded-md">
                    <p className="text-white text-sm md:text-base">{adminView ? `${profile.username} has not verified phone number` : 'Verify your number to receive sms updates'}</p>
                    <IoClose className='text-white ml-auto cursor-pointer' onClick={() => setShowPhoneReminder(false)} />
                </div>
            )}
        </div>
    );

    const detailsHeader = (
        <>
            <div className='flex flex-col items-center justify-center'>
                <HeadingTextAlt title={adminView ? 'USER' : 'PROFILE'} subtitle={loading ? 'LOADING' : profile.userId ? profile.username : 'LOADING'} titleSize='text-2xl' subtitleSize='text-xl' />
                {adminView && (
                    <div className='flex justify-center items-center'>
                        <button className={`${getButtonStyle('standard', isTouchScreen)} mr-2 px-5 py-1 w-42 ${reloadingProfile || loading ? 'opacity-50 pointer-events-none' : ''}`} onClick={setShowDeleteConfirm}>Delete Account</button>
                        <button className={`${getButtonStyle('standard', isTouchScreen)} px-5 py-1 w-42 ${reloadingProfile || loading ? 'opacity-50 pointer-events-none' : ''}`} onClick={setShowResetPassword}>Reset Password</button>
                    </div>
                )}
            </div>
            <div className={`p-4 rounded-t-2xl transition-all duration-500 w-full ${adminView ? 'bg-secondary-dark mt-3' : 'bg-primary-dark'}`}>
                <div className="flex items-center justify-between">
                    <h2 className="md:text-2xl text-lg font-semibold font-bodoni text-white scale-y-125">{adminView ? 'DETAILS' : 'MY DETAILS'}</h2>
                    <button className="bg-dark-main hover:bg-darker-main text-white rounded-full duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-1 flex justify-center items-center md:h-8 md:w-8 h-7 w-7" onClick={reloadingProfile ? null : () => fetchProfile(userId, true)}>
                        <IoMdRefresh className="md:h-6 md:w-6 w-5 h-5" />
                    </button>
                </div>
                {(reloadingProfile || loading) && <div className="text-white mb-4 flex flex-col items-center justify-center"><BarLoader heightClass='md:h-[120px] h-[208px]' /></div>}
            </div>
        </>
    );

    return (
        <div className='flex flex-col items-center '>

            {(reloadingProfile || loading) && (<> {detailsHeader}  </>)}

            {((profile && !reloadingProfile) && !loading) && (
                <>
                    {detailsHeader}
                    <div className={`p-4 mb-2 relative transition-all duration-500 w-full ${adminView ? 'bg-secondary-dark' : 'bg-primary-dark'}`}>
                        {verificationMessages}
                        {profile.userId ? (
                            <>
                                <div className="text-white mb-4 flex flex-col items-center justify-center">
                                    <div className='flex flex-col w-full mt-2'>
                                        <div className='flex flex-col justify-center items-center'>
                                            <div className='flex flex-col justify-between items-center w-full'>
                                                <div className='flex md:flex-row flex-col items-center w-full'>
                                                    <p className="mr-2 mb-0 flex flex-row items-center">
                                                        <MdOutlineAlternateEmail className='mr-1.5 text-lg text-dark-main' />
                                                        {profile.email} {profile.emailConfirmed && <MdVerified className='ml-2' />}
                                                    </p>
                                                    <div className='flex flex-row md:justify-end justify-center items-center w-full'>
                                                        <div className='flex flex-row items-center justify-center md:ml-2'>
                                                            <button onClick={() => setShowEditEmailModal(true)} className={`${getButtonStyle('standard', isTouchScreen)} mr-2 w-10 h-10 mt-2 md:hidden flex justify-center items-center !rounded-full`}>
                                                                <FaEdit />
                                                            </button>
                                                            {!profile.emailConfirmed && (
                                                                <button onClick={handleVerifyEmail} className={`${getButtonStyle('standard', isTouchScreen)} w-10 h-10 mt-1 md:hidden flex justify-center items-center !rounded-full`}>
                                                                    <FaEnvelope />
                                                                </button>
                                                            )}
                                                            <button onClick={() => setShowEditEmailModal(true)} className={`${getButtonStyle('standard', isTouchScreen)} ${profile.emailConfirmed ? '' : 'mr-2'} w-20 h-8 px-3 py-1 items-center justify-center hidden md:flex`}>
                                                                Edit
                                                            </button>
                                                            {!profile.emailConfirmed && (
                                                                <button onClick={handleVerifyEmail} className={`${getButtonStyle('standard', isTouchScreen)} w-20 h-8 px-3 py-1 items-center justify-center hidden md:flex`}>
                                                                    Verify
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className='flex md:flex-row flex-col items-center w-full md:mt-2 mt-4'>
                                                    <p className="mr-2 mb-0 flex flex-row items-center w-full md:justify-start justify-center ml-0.5">
                                                        <FaPhone className='mr-2 text-base text-dark-main mb-0.5 transform rotate-90' />
                                                        {isVerifyingPhone ? '' : profile.phoneNumber ? formatPhoneNumber(profile.phoneNumber) : 'N/A'} {profile.phoneNumberConfirmed && <MdVerified className='ml-2' />}
                                                    </p>
                                                    <div className='flex flex-row md:justify-end justify-center items-center w-full'>
                                                        <div className='flex flex-row items-center justify-center'>
                                                            <button onClick={isVerifyingPhone ? () => handleConfirmPhoneVerification(verificationCode, profile.userId) : () => setShowEditPhoneModal(true)} className={`${getButtonStyle('standard', isTouchScreen)} mr-2 w-10 h-10 mt-2 md:hidden flex justify-center items-center !rounded-full`}>
                                                                {isVerifyingPhone ? <FaCheck /> : <FaEdit />}
                                                            </button>
                                                            {!profile.phoneNumberConfirmed && (
                                                                <button onClick={isVerifyingPhone ? handleCancelPhoneVerification : () => setShowVerifyPhoneModal(true)} className={`${getButtonStyle('standard', isTouchScreen)} w-10 h-10 mt-2 md:hidden flex justify-center items-center !rounded-full`}>
                                                                    {isVerifyingPhone ? <FaTimes /> : <FaEnvelope />}
                                                                </button>
                                                            )}
                                                            <button onClick={isVerifyingPhone ? () => handleConfirmPhoneVerification(verificationCode, profile.userId) : () => setShowEditPhoneModal(true)} className={`${getButtonStyle('standard', isTouchScreen)} ${profile.phoneNumberConfirmed ? '' : 'mr-2'} w-20 h-8 px-3 py-1 items-center justify-center hidden md:flex`}>
                                                                {isVerifyingPhone ? 'Confirm' : 'Edit'}
                                                            </button>
                                                            {!profile.phoneNumberConfirmed && (
                                                                <button onClick={isVerifyingPhone ? handleCancelPhoneVerification : () => setShowVerifyPhoneModal(true)} className={`${getButtonStyle('standard', isTouchScreen)} w-20 h-8 px-3 py-1 items-center justify-center hidden md:flex`}>
                                                                    {isVerifyingPhone ? 'Close' : 'Verify'}
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <p className={`${getErrorMessageStyle()} -bottom-1 left-0 w-full absolute flex items-center justify-center text-center ${messageColour}`} style={{ userSelect: message ? 'text' : 'none' }}>
                                    {message || '\u00A0'}
                                </p>
                            </>
                        ) : (
                            <div className='flex flex-row items-center justify-between h-10'>
                                <p className='text-white'>{profileStatus}</p>
                                <button className={`${getButtonStyle('standard', isTouchScreen)} !rounded-full flex justify-center items-center md:h-8 md:w-8 h-6 w-6`} onClick={() => fetchProfile(userId, true)}>
                                    <IoMdRefresh className="md:h-6 md:w-6 w-5 h-5" />
                                </button>
                            </div>
                        )}
                    </div>
                </>
            )}


            {(showEditEmailModal || showEditPhoneModal) && (
                <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-secondary-dark text-white rounded-2xl shadow-lg w-full max-w-md duration-300 scale-in-center p-4">
                        <HeadingTextAlt title={showEditEmailModal ? 'Edit Email' : 'Edit Phone Number'} subtitle={profile.username} customWidth='35%' titleSize='text-xl' subtitleSize='text-lg' />
                        <div>
                            <p className='px-0.5'>{showEditEmailModal ? 'New Email' : 'New Phone Number'}</p>
                            <input
                                value={showEditEmailModal ? newEmail : newPhoneNumber}
                                onChange={e => showEditEmailModal ? setNewEmail(e.target.value) : setNewPhoneNumber(e.target.value)}
                                className={`${getInputStyle()} mb-1 mr-2`} required
                            />
                        </div>
                        <p className={`${getErrorMessageStyle()}`} style={{ userSelect: errorMessage ? 'text' : 'none' }}>
                            {errorMessage || '\u00A0'}
                        </p>
                        <div className="flex justify-end pt-4">
                            <button
                                onClick={showEditEmailModal
                                    ? updatingEmail ? null : () => handleUpdateEmail(profile.userId)
                                    : updatingPhoneNumber ? null : () => handleUpdatePhoneNumber(profile.userId)}
                                className={`${getButtonStyle('standard', isTouchScreen)} w-24 mr-2 px-4 py-2 mt-2 ${(updatingEmail || updatingPhoneNumber) ? '!bg-darker-main pointer-events-none' : ''}`}
                            >
                                {(updatingEmail || updatingPhoneNumber) ? <BarLoader text='' customWidth='65px' heightClass='h-0' animationDuration='1.2s' /> : 'Save'}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    if (showEditEmailModal) {
                                        setShowEditEmailModal(false);
                                        setNewEmail('');
                                    } else {
                                        setShowEditPhoneModal(false);
                                        setNewPhoneNumber('');
                                    }
                                    setErrorMessage('');
                                }}
                                className={`${getButtonStyle('cancel', isTouchScreen)} w-24 px-4 py-2 mt-2`}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showVerifyPhoneModal && (
                <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-secondary-dark text-white rounded-2xl shadow-lg w-full max-w-md duration-300 scale-in-center p-4">
                        <HeadingTextAlt title="Verify Phone" subtitle={profile.username} customWidth="100%" titleSize="text-xl" subtitleSize="text-lg" />
                        <div>
                            <p className='px-0.5'>Verification Code</p>
                            <input type="text" value={verificationCode} onChange={handleVerificationCodeChange} className={`${getInputStyle()}`} />
                        </div>
                        <p className={`${getErrorMessageStyle()} mt-1 ${resendSuccess ? '!text-green' : '!text-dark-main'}`} style={{ userSelect: errorMessage ? 'text' : 'none' }}>
                            {errorMessage || '\u00A0'}
                        </p>
                        <div className="flex justify-between pt-4">
                            <button type="button" onClick={() => handleResendCode(profile.userId)} disabled={verifying} className={`${getButtonStyle('standard', isTouchScreen)} w-24 px-4 py-2 mt-2 ${resendingCode ? 'w-30 pointer-events-none bg-darker-main' : ''}`}>
                                {resendingCode ? <BarLoader heightClass='h-0' text='' customWidth='65px' animationDuration='1.2s' /> : 'Resend'}
                            </button>
                            <div className="flex">
                                <button disabled={resendingCode} onClick={verifying ? null : () => handleConfirmPhoneVerification(verificationCode, profile.userId)} className={`${getButtonStyle('standard', isTouchScreen)} w-24 mr-2 px-4 py-2 mt-2 ${verifying ? 'pointer-events-none bg-darker-main' : ''}`}>
                                    {verifying ? <BarLoader heightClass='h-0' text='' customWidth='65px' animationDuration='1.2s' /> : 'Confirm'}
                                </button>
                                <button type="button" onClick={() => { setShowVerifyPhoneModal(false); setErrorMessage(''); }} className={`${getButtonStyle('cancel', isTouchScreen)} w-24 px-4 py-2 mt-2`}>
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

export default UserDetails;
