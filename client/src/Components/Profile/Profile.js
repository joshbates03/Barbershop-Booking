import React, { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PoleLoader from '../Loaders/PoleLoader';
import UserDetails from './UserDetails';
import UserAppointments from './UserAppointments';
import HeadingTextAlt from '../Styles/HeadingTextAlt';
import { ProfileContext } from './ProfileContext';
import { AuthContext } from '../Authentication/AuthContext';
import { getButtonStyle } from '../Styles/Styles';
import { useTouch } from '../../Context/TouchScreenContext';
import ServerDown from '../ServerDown';

const Profile = () => {
  const navigate = useNavigate();
  const isTouchScreen = useTouch();
  const {
    loadingProfile,
    profileFailType,
    barberFailedType,
    loadingBarbers,
    loadingAppointments,
    appointmentFailType,
    userId,
    fetchAppointments,
    fetchBarbers,
    fetchProfile,
  } = useContext(ProfileContext);

  const { failure, failureType, validateToken, isLoggedIn } = useContext(AuthContext);

  useEffect(() => {
    if (isLoggedIn === false) {
     
        navigate('/');
     
    }
  }, [isLoggedIn, navigate]);

  const refresh = async () => {
    await fetchProfile(userId);
    await fetchAppointments(userId);
    await fetchBarbers();
  };

  if (failure) {
    return <ServerDown retry={validateToken} isTouchScreen={isTouchScreen} failureType={failureType} />;
  }

  return (
    <>
      {loadingAppointments || loadingProfile || loadingBarbers ? (
        <div className='min-h-[80dvh] items-center justify-center flex' style={{ transform: 'scale(0.65)', transformOrigin: 'center' }}>
          <PoleLoader />
        </div>
      ) : (
        <>
          {(profileFailType !== 'ok' && appointmentFailType !== "ok" && barberFailedType !== 'ok') ? (
            <div className='w-full h-[calc(100dvh-10rem)] items-center justify-center flex flex-col'>
              <HeadingTextAlt
                title={barberFailedType === 'backend_error' ? 'Something went wrong' : 'Server Error'}
                subtitle={'CLICK BELOW TO TRY AGAIN'}
                titleSize='md:text-4xl text-xl'
                subtitleSize='md:text-xl text-base'
              />
              <button
                className={`${getButtonStyle('standard', isTouchScreen)} px-4 py-2`}
                onClick={refresh}
              >
                Try Again
              </button>
            </div>
          ) : (
            <div className="container mx-auto p-6">
              {isLoggedIn && (
                <>
                  <UserDetails />
                  <UserAppointments />
                </>
              )}
            </div>
          )}
        </>
      )}
    </>
  );
};

export default Profile;
