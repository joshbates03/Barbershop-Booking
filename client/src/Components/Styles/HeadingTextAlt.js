import React from 'react';

const HeadingTextAlt = ({ title, subtitle, titleSize = 'md:text-xl text-base', subtitleSize = 'md:text-sm text-xs', minWidth = 'min-w-[50px]' }) => {
  return (
    <div className='flex items-center justify-center'>
      <div>
      <h2 className={`${titleSize} font-semibold font-bodoni text-center text-dark-main scale-y-125 whitespace-nowrap`}>
        {title.toUpperCase()}
      </h2>
      <div className="flex justify-center items-center mb-2 w-full">
        <div className={`flex-grow h-px bg-gradient-to-l from-white to-transparent ${minWidth}`}></div>
        <span className={`${subtitleSize} text-white mx-1 font-bodoni whitespace-nowrap`}>
          {subtitle.toUpperCase()}
        </span>
        <div className={`flex-grow h-px bg-gradient-to-r from-white to-transparent ${minWidth}`}></div>
      </div>
    </div>
    </div>
  );
}

export default HeadingTextAlt;
