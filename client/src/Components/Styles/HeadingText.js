import React from 'react';

const HeadingText = ({ customText, textSize = 'text-xl', minWidth = 'min-w-[50px]' }) => {
  return (
   <div className='flex justify-center items-center'>
     <div>
      <h2 className={`${textSize} font-bold font-bodoni text-center text-dark-main scale-y-125`}>
        {customText}
      </h2>
      <div className="flex justify-center items-center mb-2 flex-row relative w-full">
        <div className={`flex-grow h-px bg-gradient-to-l from-white to-transparent ${minWidth}`}></div>
        <div className={`flex-grow h-px bg-gradient-to-r from-white to-transparent ${minWidth}`}></div>
      </div>
    </div>
   </div>
  );
}

export default HeadingText;
