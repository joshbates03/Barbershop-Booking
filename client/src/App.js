import './index.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { TouchScreenProvider } from './Context/TouchScreenContext.js';
import Homepage from './Components/Homepage';
import Navbar from './Components/Navbar';
import React from 'react';
import SignIn from './Components/Authentication/SignIn';
import Register from './Components/Authentication/Register';
import Profile from './Components/Profile/Profile.js';
import AdminHub from './Components/Admin/AdminHub';
import Book from './Components/Booking/Book.js';
import { AuthProvider } from './Components/Authentication/AuthContext';
import VerifyEmail from './Components/Authentication/VerifyEmail.js';
import ResetPassword from './Components/Authentication/ResetPassword';
import Gallery from './Components/Gallery';
import ForgotPassword from './Components/Authentication/ForgotPassword.js';
import { ProfileProvider } from './Components/Profile/ProfileContext.js';
import { AdminFeaturesProvider } from './Components/Admin/AdminFeaturesContext.js';
import PrivacyPolicy from './Components/PrivacyPolicy.js';
import BookingPolicy from './Components/BookingPolicy.js';
import NotFound from './Components/NotFound.js';

function App() {

  const basename = process.env.NODE_ENV === 'production' ? '/barbershopbooking' : '/';

  return (
    <div className="background-with-scissors min-h-[100dvh] w-full flex flex-col relative  z-0">
      <TouchScreenProvider>
      <Router basename={basename}>
          <AuthProvider>
            <Navbar />
            <Routes>
              <Route path="/" element={<Homepage />} />
              <Route path="/signin" element={<SignIn />} />
              <Route path="/gallery" element={<Gallery />} />
              <Route path="/register" element={<Register />} />
              <Route path="/profile" element={<ProfileProvider><Profile /></ProfileProvider>} />
              <Route path="/admin-hub" element={  <AdminFeaturesProvider><AdminHub /></AdminFeaturesProvider>} />
              <Route path="/book" element={<Book />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/booking-policy" element={<BookingPolicy />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </Router>
      </TouchScreenProvider>
    </div>
  );
}

export default App;
