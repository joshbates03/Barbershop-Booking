import React, { useState, useEffect, useContext } from 'react';
import SmsSettings from './SmsSettings';
import PriceListSettings from './PriceListSettings';
import OpenTimesListSettings from './OpenTimesListSettings';
import baseUrl from '../Config';
import { AdminFeaturesContext } from './AdminFeaturesContext';

const Settings = () => {
  const { settingsTab, setSettingsTab } = useContext(AdminFeaturesContext);
  const [smsStatus, setSmsStatus] = useState(null);
  const [smsBalance, setSmsBalance] = useState(null);

  const fetchSmsStatus = async () => {
    try {
      const response = await fetch(`${baseUrl}/api/Miscellaneous/GetSmsStatus`, { method: 'GET', credentials: 'include' });
      const data = await response.json();
      if (response.ok) {
        setSmsStatus(data.isSmsEnabled);
      } else {
        console.error('Failed to fetch SMS status:', data.message);
      }
    } catch (error) {
      console.error('Error fetching SMS status:', error);
    }
  };

  const toggleStatus = async () => {
    try {
      const response = await fetch(`${baseUrl}/api/Miscellaneous/ToggleSms`, { method: 'POST', credentials: 'include' });
      const data = await response.json();
      if (response.ok) {
        fetchSmsStatus();
      } else {
        console.error('Failed to toggle SMS status:', data.message);
      }
    } catch (error) {
      console.error('Error toggling SMS status:', error);
    }
  };

  const fetchSmsBalance = async () => {
    try {
      const response = await fetch(`${baseUrl}/api/Miscellaneous/GetSmsBalance`, { method: 'GET', credentials: 'include' });
      const data = await response.json();
      if (response.ok) {
        setSmsBalance(data.balance);
      } else {
        console.error('Failed to fetch SMS balance:', data.message);
      }
    } catch (error) {
      console.error('Error fetching SMS balance:', error);
    }
  };

  useEffect(() => {
    fetchSmsStatus();
    fetchSmsBalance();
  }, []);

  const renderTabContent = () => {
    switch (settingsTab) {
      case 'sms':
        return <SmsSettings status={smsStatus} toggleStatus={toggleStatus} balance={smsBalance} fetchSmsBalance={fetchSmsBalance} />;
      case 'price':
        return <PriceListSettings />;
      case 'open':
        return <OpenTimesListSettings />;
      default:
        return null;
    }
  };

  return (
    <div>
      <div className="tabs flex justify-center mb-4">
        <button
          className={`rounded-full w-full px-3 py-2 ${settingsTab === 'sms' ? 'bg-dark-main text-white' : 'bg-dark-textfield text-black'}`}
          style={{
            borderTopRightRadius: '0.5rem',
            borderBottomRightRadius: '0.5rem',
          }}
          onClick={() => setSettingsTab('sms')}
        >
          SMS
        </button>
        <button
          className={`rounded-full w-full px-3 py-2 ${settingsTab === 'price' ? 'bg-dark-main text-white' : 'bg-dark-textfield text-black'}`}
          style={{
            borderTopRightRadius: '0rem',
            borderBottomRightRadius: '0rem',
            borderTopLeftRadius: '0rem',
            borderBottomLeftRadius: '0rem',
          }}
          onClick={() => setSettingsTab('price')}
        >
          Price List
        </button>
        <button
          className={`rounded-full w-full px-3 py-2 ${settingsTab === 'open' ? 'bg-dark-main text-white' : 'bg-dark-textfield text-black'}`}
          style={{
            borderTopLeftRadius: '0.5rem',
            borderBottomLeftRadius: '0.5rem',
          }}
          onClick={() => setSettingsTab('open')}
        >
          Open Times
        </button>
      </div>
      <div className="tab-content">{renderTabContent()}</div>
    </div>
  );
};

export default Settings;
