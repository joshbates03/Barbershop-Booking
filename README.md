# **Barbershop Booking**

Barbershop Booking is a web application developed in collaboration with a real barbershop, designed to handle their specific business needs. This made the project more interesting as it was intended for an established business, from the color scheme to the way they operate. The system helps manage appointments, barbers, and customer interactions, and includes features like SMS notifications, email verification, and a gallery for showcasing barber work.

## **About**

This project aims to streamline barbershop operations by providing features for managing appointments, handling SMS notifications, and giving admins control over scheduling. It integrates services like Telnyx for SMS and SendGrid for email, with a Firebase-backed gallery for showcasing images uploaded by the barbers.

The demo version of the app has the SMS notification feature disabled, but in the real-world version, customers would receive notifications for booking, updating, or canceling appointments, and reminders the day before their appointments. Admins and barbers can also manage appointments for customers and notify them via SMS.

## **Features**

### **Booking and SMS Notifications**

- **Toggleable SMS System:**
  - SMS notifications are sent for various actions:
    - When a user **books**, **updates**, or **cancels** an appointment.
    - When a user has an appointment the **following day**, they receive a reminder.
    - If an **admin/barber** creates, updates, or cancels an appointment for the user.
  
- **SMS Conditions:**
  - **Phone number verification** is required for users to receive SMS notifications.
  - The SMS system remains off in the demo version of the app.
  
- **SMS Provider:**
  - SMS notifications are powered by **Telnyx**.

### **Email System**

- **Email Verification:** 
  - Similar to SMS notifications, users must **verify their email** to unlock additional email notifications.
  - However, the email notification system was not fully implemented, as there isn’t a real client list.
  
- **Password Reset Emails:**
  - Password reset emails are always enabled, ensuring users can recover access to their accounts.

- **Email Provider:**
  - Email notifications (such as password reset emails) are sent via **SendGrid**.

### **Gallery**

- **User Browsing:**
  - Users can browse images uploaded by admins or barbers in the gallery section, showcasing the work done by barbers.

- **Admin Upload and Management:**
  - Admins can **upload**, **delete**, and manage images in the gallery.
  
- **Storage:**
  - Images are stored in a Firebase **Storage** service.

### **Business-Specific Rules and Constraints**

- **Appointment Restrictions:**
  - **Users** can book **one appointment per week**.
  - **Admins/Barbers** can override this restriction and book an appointment for any time.
  - **Users** can only book up to **2 months in advance**, while **Admins/Barbers** can book anytime without restrictions.

- **Verification Code and Password Reset Requests:**
  - **Users** can request verification codes or password reset emails **once every 10 minutes**.
  - **Admins** can request verification codes or password reset emails **at any time**, with no time restrictions.

### **Scheduling System**

- **Standard Schedules:**
  - These are the regular weekly schedules, specifying available time slots for appointments.
  - A standard schedule applies to a specific **day of the week**, and each schedule has a **start and end date**.
  - If the end date is `null`, the schedule continues indefinitely.
  - Time slots are represented as a **comma-separated string**, typically using times like `09:00, 09:30, ...` but can include other identifiers.

- **Special Schedules:**
  - These **override** standard schedules for last-minute or ad-hoc changes.
  - Special schedules allow the system to handle sudden updates without altering the regular schedule.
  - You can explore the implementation of these schedules in **schedule.js**.

### **Real-Time Updates with SignalR WebSockets**

Barbershop Booking leverages **SignalR** WebSockets to provide real-time updates for both users and admins. This ensures that changes to appointments and notifications are communicated instantly, enhancing the user experience and making the system more responsive.

- **Real-Time Appointment Availability for Users:**
  - When a user is booking an appointment, SignalR ensures that **appointment availability** is updated in real-time. If another user books an appointment while a user is browsing available slots, the system will automatically update the available slots without requiring a page refresh.

- **Real-Time Updates for Admins:**
  - When **admins** are viewing or managing appointments, any changes made by users (e.g., booking, updating, or canceling an appointment) are immediately reflected in the admin’s view.
  - This prevents double bookings and ensures that admins are always working with the latest information.

- **Real-Time Notification System for Admins:**
  - SignalR is also used to implement a **popup notification system** for admins. When a user books, updates, or cancels an appointment, the admin receives an instant popup notification. This allows admins to react quickly to changes in the system, ensuring better service and more efficient management.

The use of **SignalR** WebSockets ensures that Barbershop Booking remains highly responsive and up-to-date, providing a smooth experience for both users and administrators.

### **Session Management**

Barbershop Booking implements **session management** to enhance security and ensure that users remain active during their booking or admin activities. Sessions last for **30 minutes**, after which users are logged out if no activity is detected. 

- **Session Timeout:**
  - **User sessions** are automatically terminated after **30 minutes** of inactivity. This applies to both regular users and admins, ensuring that any unattended sessions are securely closed.

- **Warning Pop-up and Session Extension:**
  - **5 minutes** before the session expires, users are shown a **warning pop-up** indicating that their session is about to expire. The pop-up allows users to **refresh** and extend their session by an additional **30 minutes** without losing their progress or having to log in again.
  - This feature ensures that users don’t accidentally lose their session while booking appointments or making changes in the admin panel, improving overall usability.

This session management system balances **security** and **user convenience** by protecting against inactive sessions while providing an option to extend the session without disruption.

## **Demo**
Feel free to explore and try out [**Barbershop Booking**](https://juxtaj.com/barbershopbooking/). While the application is fully functional and demonstrates all the features listed above, please understand that it is not connected to a real service. As a result, actions such as booking appointments, receiving SMS or email notifications, and interacting with the admin dashboard won't have any practical effect or provide real-world utility.

This web app is intended for **demonstration purposes** only, showcasing the system's ability to manage bookings and provide real-time updates and notifications in a simulated environment. The SMS and email services are fully implemented but will not trigger real communications in this demo.

If you’d like to explore the functionality further, feel free to do so, but please note that this system is not designed for **live users** or actual barbershop operations.

Thank you for trying out Barbershop Booking!

## **Credits**

- **Barbershop Loader**: [Barbershop Loader by Denis Morozov](https://codepen.io/morozd/pen/DmNZap)
- **Scissor Icon**: [Scissor Icon by loading.io](https://loading.io/icon/ke57m2) - © released under Loading.io PRO License
- **Check Box Animation**: [Sweet Ape Check Box by Galahhad](https://uiverse.io/Galahhad/sweet-ape-100)
- **Progress Loader**: [Progress Loader #3](https://css-loaders.com/progress/)
- **Animation Effect**: [Scale-in-center animation by Animista](https://animista.net/play/entrances/scale-in-center)

