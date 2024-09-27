import React, { useContext } from 'react';
import AdminHandleBarber from './AdminHandleBarber';
import AdminHandleUser from './AdminHandleUser';
import Settings from './Settings';
import { AdminFeaturesContext } from './AdminFeaturesContext';

const AdminFeatures = () => {
  
  const {activeTab, handleTabs} = useContext(AdminFeaturesContext);
  
  const renderTabContent = () => {
      switch (activeTab) {
        case 'barbers':
          return <AdminHandleBarber  />
        case 'users':
          return <AdminHandleUser   />
        case 'settings':
          return <Settings />
        default:
          return null;
      }
  };

  return (
    <div>
      <div className="tabs flex justify-center mb-4">
        <button
          className={`rounded-full w-full px-3 py-2 ${activeTab === 'barbers' ? 'bg-dark-main  text-white' : 'bg-dark-textfield  text-black'}`}
          style={{ borderTopRightRadius: '0.5rem', borderBottomRightRadius: '0.5rem' }}
          onClick={() => { handleTabs('barbers') }}
        >
          Barbers
        </button>
        <button
          className={`rounded-full w-full px-3 py-2 ${activeTab === 'users' ? 'bg-dark-main  text-white' : 'bg-dark-textfield  text-black'}`}
          style={{ borderTopRightRadius: '0rem', borderBottomRightRadius: '0rem', borderTopLeftRadius: '0rem', borderBottomLeftRadius: '0rem' }}
          onClick={() => { handleTabs('users') }}
        >
          Customers
        </button>
        <button
          className={`rounded-full w-full px-3 py-2 ${activeTab === 'settings' ? 'bg-dark-main  text-white' : 'bg-dark-textfield  text-black'}`}
          style={{ borderTopLeftRadius: '0.5rem', borderBottomLeftRadius: '0.5rem' }}
          onClick={() => { handleTabs('settings') }}
        >
          Settings
        </button>
      </div>
      <div>{renderTabContent()}</div>
    </div>
  );

};

export default AdminFeatures;
