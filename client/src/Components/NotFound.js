import React from 'react'
import HeadingTextAlt from './Styles/HeadingTextAlt';

const NotFound = () => {
    return (
        <div className="flex justify-center items-center min-h-[80dvh] p-4">
         <HeadingTextAlt title={'PAGE NOT FOUND'} subtitle={'404'} titleSize='md:text-4xl text-2xl' subtitleSize='md:text-2xl text-xl'/>
        </div>
      );
}

export default NotFound
