import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiPhone } from "react-icons/hi2";
import { FaFacebook, FaInstagram, FaTwitter } from 'react-icons/fa';
import { IoIosPin } from "react-icons/io";
import { useTouch } from '../Context/TouchScreenContext';
import { getButtonStyle } from './Styles/Styles';
import { AuthContext } from './Authentication/AuthContext';
import HeadingText from './Styles/HeadingText';
import PriceList from './PriceList';
import OpeningTimes from './OpeningTimes';

const Homepage = () => {
  const { isLoggedIn } = useContext(AuthContext);
  const isTouchScreen = useTouch();
  const navigate = useNavigate();

  const landingButton = () => {
    isLoggedIn ? navigate('/book') : navigate('/signin');
  };

  const basename = process.env.NODE_ENV === 'production' ? '/barbershopbooking' : '';

  return (
    <div className="background-with-scissors">
      {/* 'Hero Section' (Image) */}
      <div className="shadow-lg hero-section bg-cover bg-center md:h-[90dvh] h-[93dvh] relative"
        style={{ backgroundImage: "url('https://firebasestorage.googleapis.com/v0/b/barbershop-19606.appspot.com/o/Extras%2Fimage1.png?alt=media&token=51ffc8b8-9dd2-4f2e-a811-905df3eda2b9')" }}>
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-r from-black via-transparent to-black">
          <div className="relative flex flex-col items-center" style={{ textShadow: '1px 1px 0 #000, -1px -1px 0 #000, -1px 1px 0 #000, 1px -1px 0 #000' }}>
            <div className="md:hidden flex flex-col items-center">
              <h1 className="md:text-5xl text-4xl font-extrabold text-white scale-y-125 drop-shadow-2xl">APPOINTMENT</h1>
              <h1 className="md:text-5xl text-4xl font-extrabold text-white scale-y-125 drop-shadow-2xl mt-2">ONLY</h1>
              <h1 className="md:text-5xl text-4xl font-extrabold text-white scale-y-125 drop-shadow-2xl mt-2">BARBERSHOP</h1>
            </div>
            <h1 className="hidden md:block text-5xl text-center scale-y-125 font-extrabold text-white drop-shadow-3xl">
              APPOINTMENT-ONLY BARBERSHOP
            </h1>
            <button onClick={landingButton} className={`${getButtonStyle('standard', isTouchScreen)} mt-4 px-6 py-2`}>
              {isLoggedIn ? 'Book' : 'Log In'}
            </button>
          </div>
        </div>
      </div>

      {/* About */}
      <section id="about" className="py-8 text-white relative overflow-hidden">
        <div className="container mx-auto px-4">
          <div className='flex flex-col items-center justify-center mb-2'>
            <HeadingText customText={'ABOUT US'} textSize='text-4xl' />
          </div>
          
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 md:pr-8 flex justify-center">
              <img src="https://firebasestorage.googleapis.com/v0/b/barbershop-19606.appspot.com/o/Extras%2FAbout.png?alt=media&token=98eae2d5-9621-415b-a86c-6ab512ac4241"
                alt="Barber Shop" className="rounded-full shadow-lg mb-8 md:mb-0 w-60 h-60" />
            </div>
            <div className="md:w-1/2">
              <p className="text-base leading-relaxed mb-4">
                Our barber shop offers top-notch grooming services. From classic cuts to modern styles, we provide a relaxing atmosphere and professional service. Our skilled barbers use the best tools and techniques to ensure you leave looking and feeling your best.
              </p>
              <p className="text-base leading-relaxed">
                We value our customers and strive to create a welcoming environment. Visit us today and experience the difference.
              </p>
            </div>
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-0.5 shadow-lg" style={{ boxShadow: '0 0 20px rgba(220, 38, 38, 0.5)', opacity: 1 }}></div>
      </section>

      {/* Pricing and Open Hours */}
      <section id="pricing" className="py-8 text-white relative overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-1 items-center justify-center">
            <div className="flex flex-col items-center h-full">
              <HeadingText customText={'OPEN HOURS'} textSize='text-4xl' />
              <OpeningTimes />
            </div>
            <div className="flex flex-col items-center md:mt-0 mt-4">
              <HeadingText customText={'PRICE LIST'} textSize='text-4xl' />
              <PriceList />
            </div>
          </div>
        </div>
        <div className="absolute inset-x-0 top-0 h-0.5 bg-razoredgered shadow-lg" style={{ boxShadow: '0 0 20px rgba(220, 38, 38, 0.5)', opacity: 1 }}></div>
      </section>

      {/* Contact Information / Policies */}
      <section id="contact" className="py-4 text-white bg-primary-dark relative overflow-hidden">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center">
          <div className="max-w-lg md:w-1/2 mb-8 md:mb-0 p-4">
            <div className='flex flex-col items-center md:items-start'>
              <HeadingText customText={'CONTACT US'} textSize='text-4xl' />
            </div>
            <div className="mt-4 space-y-4">
              <div className="flex items-center md:justify-start justify-center space-x-2">
                <HiPhone className='text-razoredgered text-3xl' />
                <p className="text-gray-400">+44 B4RB3R S40P</p>
              </div>
              <div className="flex items-center space-x-2">
                <IoIosPin className='text-razoredgered text-4xl' />
                <p className="text-gray-400">1802 Barber Lane, Clippersville, UK</p>
              </div>
            </div>
          </div>
          <div className="max-w-lg md:w-1/2 mb-8 md:mb-0 p-4">
            <div className='flex flex-col items-center md:items-end'>
              <HeadingText customText={'FOLLOW US'} textSize='text-4xl' />
            </div>
            <div className="mt-4 space-y-4 md:items-end md:text-end items-center text-center">
              <div className="flex items-center space-x-3 md:justify-end justify-center">
                <a href="https://www.facebook.com" target="_blank" rel="noopener noreferrer">
                  <FaFacebook className="text-white text-4xl hover:text-dark-main hover:scale-105 duration-200" />
                </a>
                <a href="https://www.instagram.com" target="_blank" rel="noopener noreferrer">
                  <FaInstagram className="text-white text-4xl hover:text-dark-main hover:scale-105 duration-200" />
                </a>
                <a href="https://www.twitter.com" target="_blank" rel="noopener noreferrer">
                  <FaTwitter className="text-white text-4xl hover:text-dark-main hover:scale-105 duration-200" />
                </a>
              </div>
              <div className="md:flex hidden items-center space-x-2 justify-end opacity-0">
                <HiPhone className='text-white text-3xl' />
                <IoIosPin className='text-white text-4xl' />
              </div>
            </div>
          </div>
        </div>
        <div className="container mx-auto flex flex-row justify-center space-x-3 items-center">
          <a href={`${basename}/privacy-policy`} className="text-sm text-dark-main underline">
            Privacy Policy
          </a>

          <a href={`${basename}/booking-policy`} className="text-sm text-dark-main underline">
            Booking Policy
          </a>

        </div>
      </section>
    </div>
  );
};

export default Homepage;
