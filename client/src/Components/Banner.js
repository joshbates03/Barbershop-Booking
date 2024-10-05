import React, { useState, useEffect } from 'react';
import { FaGithub, FaLinkedin } from 'react-icons/fa';
import { RxCross2 } from 'react-icons/rx';

const Banner = () => {
    const [hidden, setHidden] = useState(false);
    const [isClosing, setIsClosing] = useState(false); 

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsClosing(true); 
            setTimeout(() => {
                setHidden(true); 
            }, 1000); 
        }, 10000); 

        return () => clearTimeout(timer); 
    }, []);

    const handleClose = () => {
        setIsClosing(true); 
        setTimeout(() => {
            setHidden(true);
        }, 1000); 
    };

    return (
        <>
            {hidden ? null : (
                <div
                    className={`bg-dark-main p-2 text-center relative ease-in-out transition-all duration-1000 ${isClosing ? 'max-h-0' : 'max-h-screen'}`}
                    style={{ overflow: 'hidden' }} 
                >
                    <button
                        className="absolute top-2 right-2 text-white hover:scale-105 duration-200"
                        onClick={handleClose}
                    >
                        <RxCross2 size={25} />
                    </button>
                    <p className="text-white md:text-lg text-sm font-semibold">
                        PORTFOLIO PROJECT – NOT A REAL SERVICE
                    </p>
                    <p className="text-white mb-1 md:text-base text-xs">
                        Based on my barber's shop, with their permission
                    </p>
                    <hr className="border-white mb-1" />
                    <div className="text-white">
                        <p className="text-sm mb-1">
                            Created by 
                            <span className="font-bold text-lg ml-1">Josh Bates</span>
                        </p>
                        <div className="flex justify-center space-x-3">
                            <a href="https://github.com/joshbates03" target="_blank" rel="noopener noreferrer">
                                <FaGithub className="text-white text-3xl hover:scale-105 duration-200" />
                            </a>
                            <a href="https://www.linkedin.com/in/josh-bates-3863852b7/" target="_blank" rel="noopener noreferrer">
                                <FaLinkedin className="text-white text-3xl hover:scale-105 duration-200" />
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default Banner;
