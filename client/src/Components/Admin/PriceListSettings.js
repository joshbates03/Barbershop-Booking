import React, { useState, useEffect, useRef } from 'react';
import BarLoader from '../Loaders/BarLoader';
import PriceList from '../PriceList';

const PriceListSettings = () => {
    
    const [loading, setLoading] = useState(true);
    const timeoutRef = useRef(null);

    useEffect(() => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => setLoading(false), 1000);

        return () => clearTimeout(timeoutRef.current);
    }, []);

    return (
        <div className="p-4 rounded-2xl mb-2 relative transition-all bg-primary-dark shadow-md">
            <div className="flex justify-between items-center w-full mb-4 ">
                <div className="flex justify-between  w-full">
                    <h2 className="md:text-2xl text-xl font-semibold font-bodoni text-center text-white scale-y-125 mr-2">PRICE LIST</h2>
                </div>
            </div>

            {loading ?
                (
                    <div className='h-[50px] items-center justify-center'>
                        <BarLoader heightClass='' animationDuration='1.4s' />
                    </div>
                ) :
                (
                    <PriceList adminView={true} />
                )
            }
        </div>
    );
};

export default PriceListSettings;
