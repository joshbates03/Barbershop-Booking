import React, { useState, useEffect, useRef } from 'react';
import logo from '../Images/logo.png';
import logo_no_bg from '../Images/logo_no_bg.png'
import { getButtonStyle } from './Styles/Styles';
import { useTouch } from '../Context/TouchScreenContext';
import BarLoader from './Loaders/BarLoader';
import baseUrl from './Config';

const OpenTimes = ({ adminView = false }) => {
    
    const [openTimesList, setOpenTimesList] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [submitting, setSubmitting] = useState(false)
    const [editedOpenTimesList, setEditedOpenTimesList] = useState([]);
    const isTouchScreen = useTouch();
    const timeoutRef = useRef(null);

    const fetchOpenTimesList = async () => {
        try {
            const response = await fetch(`${baseUrl}/api/OpeningTimes`, { 
                method: 'GET', 
                headers: { 'Accept': 'application/json' } 
            });
            if (response.ok) {
                const data = await response.json();
                const values = data.$values || [];
                setOpenTimesList(values);
                setEditedOpenTimesList(values);
            } else console.error('Failed to fetch price list');
        } catch (error) {
            console.error('Error fetching price list:', error);
        }
    };
    
    useEffect(() => {
        fetchOpenTimesList();
    }, []);

    const handleEditClick = () => {
        setIsEditing(!isEditing);
        fetchOpenTimesList()
    };

    const handleInputChange = (index, field, value) => {
        const updatedPriceList = [...editedOpenTimesList];
        updatedPriceList[index][field] = value;
        setEditedOpenTimesList(updatedPriceList);
    };

    const handleAddRow = () => {
        const newRow = { day: '', openingTime: '' };
        setEditedOpenTimesList([...editedOpenTimesList, newRow]);
    };

    const handleRemoveRow = (index) => {
        const updatedPriceList = editedOpenTimesList.filter((_, i) => i !== index);
        setEditedOpenTimesList(updatedPriceList);
    };

    const handleSubmit = async () => {
        try {
            setSubmitting(true);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            
            const response = await fetch(`${baseUrl}/api/OpeningTimes`, {
                method: 'PUT',
                headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(editedOpenTimesList),
            });
    
            timeoutRef.current = setTimeout(async () => {
                if (response.ok) {
                    setOpenTimesList(editedOpenTimesList);
                    setIsEditing(false);
                } else {
                    const errorData = await response.json();
                    console.error('Failed to update price list:', errorData.message);
                }
                setSubmitting(false);
            }, 1000);
    
        } catch (error) {
            console.error('Error updating price list:', error);
            timeoutRef.current = setTimeout(() => setSubmitting(false), 1000);
        }
    };
    
    return (
        <div className={`flex flex-col ${adminView ? 'w-full' : ''}`}>
            <div className={`${adminView ? 'w-full bg-secondary-dark' : 'w-72 bg-black border-dark-main border-2'} h-auto flex-col rounded-2xl p-3`}>
                <div className='flex items-center justify-center mb-1'>
                    <img
                        className="h-16 justify-center flex items-center"
                        src={adminView ? logo_no_bg : logo}
                        alt="Cover"
                        style={{ userSelect: 'none' }} 
                    />
                </div>
                <div className='flex justify-between items-center mb-2'></div>
                {openTimesList ? (
                    <div className='text-white'>
                        {editedOpenTimesList.map((item, index) => (
                            <div key={item.id} className='flex flex-col'>
                                <div className='flex flex-row justify-between mt-2'>
                                    {isEditing ? (
                                        <>
                                            <input
                                                type='text'
                                                value={editedOpenTimesList[index].day}
                                                onChange={(e) => handleInputChange(index, 'day', e.target.value)}
                                                className="mt-0.5 transition duration-150 ease-in-out px-2 py-1 w-2/3 mr-2 rounded-md shadow-sm focus:outline-none focus:bg-dark-textfield-dark focus:shadow-md focus:shadow-dark-main/30 bg-dark-textfield text-white"
                                            />
                                            <input
                                                type='text'
                                                value={editedOpenTimesList[index].openingTime}
                                                onChange={(e) => handleInputChange(index, 'openingTime', e.target.value)}
                                                className="mt-0.5 transition duration-150 ease-in-out px-2 py-1 w-1/3 rounded-md shadow-sm focus:outline-none focus:bg-dark-textfield-dark focus:shadow-md focus:shadow-dark-main/30 bg-dark-textfield text-white"
                                            />
                                            <button
                                                onClick={() => handleRemoveRow(index)}
                                                className={`${getButtonStyle('standard', isTouchScreen)} w-24 px-2 py-1 ml-2`}
                                            >
                                                Remove
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <h2 className='text-xs font-roboto'>{item.day.toUpperCase()}</h2>
                                            <h2 className='text-dark-main font-roboto text-xs whitespace-nowrap'>{item.openingTime}</h2>
                                        </>
                                    )}
                                </div>
                                {index !== editedOpenTimesList.length - 1 && (
                                    <div className='w-full py-px mt-1.5 bg-dark-main'></div>
                                )}
                            </div>
                        ))}
    
                        {adminView && (
                            <div className='flex flex-row mt-2'>
                                <button
                                    className={`${getButtonStyle('standard', isTouchScreen)} px-2 py-1 w-24 mr-1.5`}
                                    onClick={handleEditClick}
                                >
                                    {isEditing ? 'Cancel' : 'Edit'}
                                </button>
                                {isEditing && (
                                    <>
                                        <button
                                            className={`${getButtonStyle('standard', isTouchScreen)} px-2 py-1 w-24`}
                                            onClick={handleAddRow}
                                        >
                                            Add Row
                                        </button>
                                        <button
                                            className={`${getButtonStyle('standard', isTouchScreen)} px-2 py-1 w-24 ml-auto ${submitting ? 'bg-darker-main pointer-events-none' : ''}`}
                                            onClick={submitting ? null : handleSubmit}
                                        >
                                            {submitting ? (
                                                <BarLoader heightClass='h-6' animationDuration='1.2s' customWidth='65px' text='' />
                                            ) : 'Submit'}
                                        </button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    <p className='text-white'></p>
                )}
            </div>
        </div>
    );
    
};

export default OpenTimes;
