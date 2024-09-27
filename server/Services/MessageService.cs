using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore.Metadata.Internal;

namespace BarberShopTemplate.Services
{
    public class MessageService
    {
        private readonly TelnyxMessagingService _telnyxMessagingService;
        private readonly IConfiguration _configuration;

        public MessageService(TelnyxMessagingService telnyxMessagingService, IConfiguration configuration)
        {
            _telnyxMessagingService = telnyxMessagingService;
            _configuration = configuration;
        }

        public async Task SendRegistrationMessage(string phoneNumber, string code)
        {
            var smsMessage = $"To recieve text notiflications, please verify your number with this code: {code}.";
            var messagingProfileId = _configuration["Messaging:Key"];
            var webhookUrl = "";
            var webhookFailoverUrl = "";

            await _telnyxMessagingService.SendMessage(
                messagingProfileId,
                phoneNumber,
                smsMessage,
                webhookUrl,
                webhookFailoverUrl
            );
        }
       
        public async Task SendAdminRemovedBookingMessage(string phoneNumber, string time, DateOnly date)
        {
            var smsMessage = $"Appt on {date} at {time} has been cancelled by the barber.";
            var messagingProfileId = _configuration["Messaging:Key"];
            var webhookUrl = "";
            var webhookFailoverUrl = "";

            await _telnyxMessagingService.SendMessage(
                messagingProfileId,
                phoneNumber,
                smsMessage,
                webhookUrl,
                webhookFailoverUrl
            );
        }

        public async Task SendRemovedBookingMessage(string phoneNumber, string time, DateOnly date)
        {
            var smsMessage = $"Your appt on {date} at {time} has been cancelled.";
            var messagingProfileId = _configuration["Messaging:Key"];
            var webhookUrl = "";
            var webhookFailoverUrl = "";

            await _telnyxMessagingService.SendMessage(
                messagingProfileId,
                phoneNumber,
                smsMessage,
                webhookUrl,
                webhookFailoverUrl
            );
        }

        public async Task SendBookingConfirmation(string phoneNumber, string time, DateOnly date)
        {
            var smsMessage = $"Appt confirmed for {date} at {time}.";
            var messagingProfileId = _configuration["Messaging:Key"];
            var webhookUrl = "";
            var webhookFailoverUrl = "";

            await _telnyxMessagingService.SendMessage(
                messagingProfileId,
                phoneNumber,
                smsMessage,
                webhookUrl,
                webhookFailoverUrl
            );
        }

        public async Task SendAdminBookingConfirmation(string phoneNumber, string time, DateOnly date)
        {
            var smsMessage = $"Appt confirmed for {date} at {time} booked by staff";
            var messagingProfileId = _configuration["Messaging:Key"];
            var webhookUrl = "";
            var webhookFailoverUrl = "";

            await _telnyxMessagingService.SendMessage(
                messagingProfileId,
                phoneNumber,
                smsMessage,
                webhookUrl,
                webhookFailoverUrl
            );
        }

        public async Task SendCustomMessage(string phoneNumber, string message)
        {
            var smsMessage = $"{message}";
            var messagingProfileId = _configuration["Messaging:Key"];
            var webhookUrl = "";
            var webhookFailoverUrl = "";

            await _telnyxMessagingService.SendMessage(
                messagingProfileId,
                phoneNumber,
                smsMessage,
                webhookUrl,
                webhookFailoverUrl
            );
        }


        public async Task SendAppointmentReminder(string phoneNumber, DateOnly date, string time)
        {
            var smsMessage = $"Reminder: Appt tomorrow at {time}. Cancel 12+ hrs before or pay on your next visit.";
            var messagingProfileId = _configuration["Messaging:Key"];
            var webhookUrl = "";
            var webhookFailoverUrl = "";

            await _telnyxMessagingService.SendMessage(
                messagingProfileId,
                phoneNumber,
                smsMessage,
                webhookUrl,
                webhookFailoverUrl
            );
        }

        public async Task SendAdminModifiedAppointment(string phoneNumber, DateOnly date, string time, DateOnly oldDate, string oldTime)
        {
            var smsMessage = $"Staff have modified your appointment on {oldDate} at {oldTime} to {date} at {time}.";
            var messagingProfileId = _configuration["Messaging:Key"];
            var webhookUrl = "";
            var webhookFailoverUrl = "";

            await _telnyxMessagingService.SendMessage(
                messagingProfileId,
                phoneNumber,
                smsMessage,
                webhookUrl,
                webhookFailoverUrl
            );
        }


        public async Task SendUpdateAppointmentConfirmation(string phoneNumber, DateOnly date, string time, DateOnly oldDate, string oldTime)
        {
            var smsMessage = $"You have updated your appointment on {oldDate} at {oldTime} to {date} at {time}";
            var messagingProfileId = _configuration["Messaging:Key"];
            var webhookUrl = "";
            var webhookFailoverUrl = "";

            await _telnyxMessagingService.SendMessage(
                messagingProfileId,
                phoneNumber,
                smsMessage,
                webhookUrl,
                webhookFailoverUrl
            );
        }
    }
}
