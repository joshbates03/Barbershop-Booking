import React, { createContext, useState } from 'react';

export const AppointmentContext = createContext();

// Allows each menu to remain open when navigating admin features
export const AppointmentProvider = ({ children }) => {
    const [users, setUsers] = useState([]);

    return (
        <AppointmentContext.Provider value={{ users, setUsers }}>
            {children}
        </AppointmentContext.Provider>
    );
};
