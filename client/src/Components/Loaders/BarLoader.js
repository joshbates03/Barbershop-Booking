import React from 'react';

const BarLoader = ({ heightClass = 'h-32', animationDuration = '2.5s', text = 'Loading...', customWidth = '120px' }) => {
    return (
        <div className={`items-center justify-center flex flex-col ${heightClass} text-white `}>
            <div>
                {text !== '' ? <h1 className='mb-1 items-center justify-center flex font-roboto'>{text}</h1> : null}
                <div 
                    className="loader" 
                    style={{ animationDuration, width: customWidth || 'auto' }} // Apply customWidth if provided
                ></div>
            </div>
        </div>
    );
}

export default BarLoader;
