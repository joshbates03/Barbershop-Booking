import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../Authentication/AuthContext';
import { useNavigate } from 'react-router-dom';
import HeadingTextAlt from '../Styles/HeadingTextAlt';
import Schedules from './Schedules';
import Appointments from '../Admin/Appointments';
import AdminFeatures from './AdminFeatures';
import PoleLoader from '../Loaders/PoleLoader';
import HeadingText from '../Styles/HeadingText';
import { AdminFeaturesContext } from './AdminFeaturesContext';
import { AppointmentProvider } from '../Admin/AppointmentContext';
import { getButtonStyle } from '../Styles/Styles';
import { useTouch } from '../../Context/TouchScreenContext';
import ServerDown from '../ServerDown';

const AdminHub = () => {
  const isTouchScreen = useTouch();
  const { isAdmin, isBarber, username, retry, failure, failureType, validateToken, isLoggedIn } = useContext(AuthContext);
  const navigate = useNavigate();
  const { barbers, fetchBarbers, loadingBarbers, barberFailedType, } = useContext(AdminFeaturesContext);
  const [selectedBarber, setSelectedBarber] = useState(null)
  const [activeTab, setActiveTab] = useState('schedules');

  useEffect(() => {
    if (isLoggedIn !== null) {
      if (!isAdmin && !isBarber) {
        navigate('/');
      }
    }
  }, [isLoggedIn,isAdmin, isBarber,  navigate]);

  useEffect(() => {
    if (barbers != null) {
      setSelectedBarber(barbers.find(barber => barber.userName === username))
    }
  }, [barbers, username]);

  if (failure) {
    return (
      <ServerDown retry={() => validateToken()} isTouchScreen={isTouchScreen} failureType={failureType} />
    )
  }

  if (loadingBarbers) {
    return (
      <div className={`min-h-[80vh] items-center justify-center flex`} style={{ transform: 'scale(0.65)', transformOrigin: 'center' }}>
        <PoleLoader />
      </div>
    );
  }

  const renderBarberDetailContent = () => {
    switch (activeTab) {
      case 'schedules':
        return <Schedules selectedBarber={selectedBarber} />;
      case 'appointments':
        return (
          <Appointments
            selectedBarber={selectedBarber}
          />
        );
      default:
        return null;
    }
  };

  return (
    <AppointmentProvider>
      <div className="container mx-auto p-4 text-white transition">
        {isBarber && (
          <>
            {selectedBarber === null ? (
              <div className='w-full h-[calc(100vh-10rem)] flex flex-col items-center justify-center'>
                <HeadingTextAlt
                  title={barberFailedType === 'backend_error' ? 'Something went wrong' : 'Server Error'}
                  subtitle='CLICK BELOW TO TRY AGAIN'
                  titleSize='md:text-4xl text-xl'
                  subtitleSize='md:text-xl text-base'
                />
                <button className={`${getButtonStyle('standard', isTouchScreen)} px-4 py-2`} onClick={retry}>
                  Try Again
                </button>
              </div>
            ) : (
              <>
                <div className="flex justify-center">
                  <HeadingTextAlt
                    title={selectedBarber.name.toUpperCase()}
                    subtitle={username}
                    titleSize='text-xl md:text-2xl'
                    subtitleSize='text-sm md:text-base'
                  />
                </div>
                <div className="tabs flex justify-center mb-4">
                  <button
                    className={`rounded-full w-full px-4 py-2 ${activeTab === 'schedules' ? 'bg-dark-main text-white' : 'bg-dark-textfield text-black'}`}
                    style={{ borderTopRightRadius: '0.5rem', borderBottomRightRadius: '0.5rem' }}
                    onClick={() => setActiveTab('schedules')}
                  >
                    Schedules
                  </button>
                  <button
                    className={`rounded-full w-full px-4 py-2 ${activeTab === 'appointments' ? 'bg-dark-main text-white' : 'bg-dark-textfield text-black'}`}
                    style={{ borderTopLeftRadius: '0.5rem', borderBottomLeftRadius: '0.5rem' }}
                    onClick={() => setActiveTab('appointments')}
                  >
                    Appointments
                  </button>
                </div>
                <div className="tab-content">{renderBarberDetailContent()}</div>
              </>
            )}
          </>
        )}

        {isAdmin && (
          <>
            <div className='flex items-center justify-center'>
              <HeadingText customText='ADMIN HUB' customWidth='100%' textSize='text-2xl' />
            </div>
            <AdminFeatures barbers={barbers} reloadBarbers={fetchBarbers} />
          </>
        )}
      </div>
    </AppointmentProvider>
  );
};

export default AdminHub;
