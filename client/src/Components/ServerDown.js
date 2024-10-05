import React, { useState, useRef } from 'react';
import { getButtonStyle } from './Styles/Styles';
import BarLoader from './Loaders/BarLoader';
import HeadingTextAlt from './Styles/HeadingTextAlt';


const ServerDown = ({ retry, isTouchScreen, failureType }) => {

    const timeoutRef = useRef(null);
    const [tryingAgain, setTryingAgain] = useState(false)

    const tryAgain = async () => {
        setTryingAgain(true);
        try {
            setTimeout(retry, 1000);
        } finally {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            timeoutRef.current = setTimeout(() => setTryingAgain(false), 1000);
        }
    };
    
    return (
        <div className="flex  flex-col  justify-center items-center  min-h-[80dvh] p-4 ">
            <HeadingTextAlt
                title={failureType === 'backend_error' ? 'SOMETHING WENT WRONG' : 'SERVER ERROR'}
                subtitle={'CLICK BELOW TO TRY AGAIN'}
                titleSize='md:text-4xl text-xl'
                subtitleSize='md:text-xl text-base'
            />
            <button
                className={`${getButtonStyle('standard', isTouchScreen)} px-4 py-2 w-30 ${tryingAgain ? 'bg-darker-main pointer-events-none' : ''}`}
                onClick={tryingAgain ? null : tryAgain}
            >
                {tryingAgain ? <BarLoader text='' heightClass='h-6' animationDuration='1.2s' customWidth='65px' /> : 'Try Again'}
            </button>
        </div>
    )
}

export default ServerDown
