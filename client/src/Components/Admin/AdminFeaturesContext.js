import React, { createContext, useState } from 'react';
import useFetchBarbers from '../../Hooks/useFetchBarbers';

export const AdminFeaturesContext = createContext();

// Allows each menu to remain open when navigating admin features
export const AdminFeaturesProvider = ({ children }) => {

    const { barbers, fetchBarbers, loadingBarbers, barberFailedType, barberStatus, reloadingBarbers } = useFetchBarbers();

    // AdminFeatures.js
    const [activeTab, setActiveTab] = useState('barbers');

    // AdminHandleUser.js
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);

    // AdminHandleBarber.js
    const [usernames, setUsernames] = useState([]);
    const [barberTab, setBarberTab] = useState('manage');
    const [barberDetailTab, setBarberDetailTab] = useState('schedules');
    const [selectedBarber, setSelectedBarber] = useState(null);
    const [selectedBarberId, setSelectedBarberId] = useState('');

    // Settings.js
    const [settingsTab, setSettingsTab] = useState('sms');

    const handleTabs = (tab) => {
        setActiveTab(tab)
    }
    
    const values = {
        selectedUser, setSelectedUser,
        barberTab, setBarberTab,
        activeTab, setActiveTab,
        settingsTab, setSettingsTab,
        barberDetailTab, setBarberDetailTab,
        selectedBarber, setSelectedBarber,
        selectedBarberId, setSelectedBarberId,
        handleTabs,
        users, setUsers,
        usernames, setUsernames,
        barbers, fetchBarbers, loadingBarbers, barberFailedType, barberStatus, reloadingBarbers
    };

    return (
        <AdminFeaturesContext.Provider value={values}>
            {children}
        </AdminFeaturesContext.Provider>
    );
};
