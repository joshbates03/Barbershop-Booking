import React from 'react';
import HeadingTextAlt from './Styles/HeadingTextAlt';

const BookingPolicy = () => {
    return (
        <div className="container mx-auto p-4 text-white space-y-8">
            <div className="flex items-center justify-center">
                <HeadingTextAlt title={'BOOKING POLICY'} titleSize='text-2xl' subtitle={'LAST UPDATED: SEPTEMBER 18, 2024'} subtitleSize='md:text-xl text-base' minWidth='md:min-w-[50px] min-w-[35px]' />
            </div>

            <section>
                <h2 className="text-2xl font-semibold  mb-4 scale-y-125">ACCOUNT REGISTRATION</h2>
                <p className="leading-relaxed">
                    To register an account on our platform, you are required to provide a valid phone number and email address.
                </p>
                <p className="leading-relaxed">
                    Your email will be used solely for sending password reset requests, and you have the option to verify your email to receive further notifications if desired.

                </p>
                <p className="leading-relaxed">

                    Your phone number will be used to receive SMS notifications. Note that you will <strong>not</strong> receive SMS unless you have verified your phone number. You can receive a verification code to verify your number in your profile settings.
                </p>
            </section>

            <section>
                <h2 className="text-2xl font-semibold mt-8 mb-4 scale-y-125">BOOKING LIMITS</h2>
                <p className="leading-relaxed">
                    You are allowed to make only <strong>one booking per week</strong>, regardless of the barber you choose. This limitation helps us ensure availability for all clients. You can book for any barber, but the one-per-week rule applies across the entire platform.
                </p>
            </section>

            <section>
                <h2 className="text-2xl font-semibold mt-8 mb-4 scale-y-125">CANCELLATION POLICY</h2>
                <p className="leading-relaxed">
                    Cancellations must be made at least <strong>12 hours</strong> prior to the appointment. If you fail to cancel within this time frame, you will be required to pay the full amount on your next visit. This policy is in place to respect the time of our barbers and other customers.
                </p>
            </section>

            <section>
                <h2 className="text-2xl font-semibold mt-8 mb-4 scale-y-125">PAYMENT TERMS</h2>
                <p className="leading-relaxed">
                    Our platform does <strong>not support online payments</strong>. You are expected to pay either in cash or by card upon completion of the service at the barbershop. Please ensure you bring the appropriate payment method to avoid any inconvenience.
                </p>
            </section>
        </div>
    );
}

export default BookingPolicy;
