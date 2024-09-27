import React, { useState, useEffect, useRef, useCallback } from 'react';
import BarLoader from '../Loaders/BarLoader';
import { IoMdRefresh } from "react-icons/io";
import { getButtonStyle } from '../Styles/Styles';
import { useTouch } from '../../Context/TouchScreenContext';

const SmsSettings = ({ status, toggleStatus, balance, fetchSmsBalance }) => {

    const isTouchScreen = useTouch();
    const [loading, setLoading] = useState(true);
    const timeoutRef = useRef(null);

    const fetchData = useCallback(async (reload = false) => {
        if (reload) setLoading(true)
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        try {
            await fetchSmsBalance();
        } catch (error) {
            console.error("Failed to fetch SMS balance");
        } finally {
            timeoutRef.current = setTimeout(() => {
                setLoading(false);
            }, 1000);
        }
    }, [fetchSmsBalance]);


    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return (
        <div className="p-4 rounded-2xl shadow-md mb-2 relative transition-all h-auto bg-primary-dark">
            <div className="flex justify-between items-center w-full mb-4 ">
                <div className="flex justify-between  w-full">
                    <h2 className="md:text-2xl text-xl font-semibold font-bodoni text-center text-white scale-y-125 mr-2">SMS</h2>
                    <button
                        className={`${getButtonStyle('standard', isTouchScreen)}  !rounded-full flex justify-center items-center md:h-8 md:w-8 w-6 h-6`}
                        onClick={() => fetchData(true)}
                    >
                        <IoMdRefresh className="md:h-6 md:w-6 w-5 h-5" />
                    </button>
                </div>
            </div>

            {loading ? (
                <div className='h-[50px] items-center justify-center'>
                    <BarLoader heightClass='' animationDuration='1.4s' />
                </div>
            ) : (
                <div className='text-white flex flex-row justify-between items-end'>
                    <div className='flex flex-col'>
                        <p >Status: {status ? 'Active' : 'Inactive'}</p>
                        <p>Balance: {balance !== 0 ? `$${balance}` : '$0'}</p>
                    </div>
                    <button
                        onClick={toggleStatus}
                        className={`${getButtonStyle('standard', isTouchScreen)}  px-4 py-2 max-w-24  w-24  mt-2`}
                    >
                        {status ? 'Turn Off' : 'Turn On'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default SmsSettings;
