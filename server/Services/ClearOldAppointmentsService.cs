using BarberShopTemplate.Data;
using BarberShopTemplate.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace BarberShopTemplate.Services
{
    public class ClearOldAppointmentsService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<ClearOldAppointmentsService> _logger;
        private readonly ToggleSmsService _toggleSmsService;

        public ClearOldAppointmentsService(IServiceProvider serviceProvider, ILogger<ClearOldAppointmentsService> logger, ToggleSmsService toggleSmsService)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
            _toggleSmsService = toggleSmsService;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            // Run tasks immediately when the server starts
            using (var scope = _serviceProvider.CreateScope())
            {
                var context = scope.ServiceProvider.GetRequiredService<BarberShopContext>();
                var userManager = scope.ServiceProvider.GetRequiredService<UserManager<AppUser>>();
                var messageService = scope.ServiceProvider.GetRequiredService<MessageService>();

                ClearOldAppointments(context);
                ClearOldActivities(context);
                ClearOldSchedules(context);
                ClearOldSpecialSchedules(context);
                await SendTextReminder(context, userManager, messageService);
            }

            while (!stoppingToken.IsCancellationRequested)
            {
                // Calculate delay until 9 AM (scheduled run time for following days)
                var delay = CalculateDelayUntilNextRun();
                await Task.Delay(delay, stoppingToken);

                // Will run at 9AM
                using (var scope = _serviceProvider.CreateScope())
                {
                    var context = scope.ServiceProvider.GetRequiredService<BarberShopContext>();
                    var userManager = scope.ServiceProvider.GetRequiredService<UserManager<AppUser>>();
                    var messageService = scope.ServiceProvider.GetRequiredService<MessageService>();

                    ClearOldAppointments(context);
                    ClearOldActivities(context);
                    ClearOldSchedules(context);
                    ClearOldSpecialSchedules(context);
                    await SendTextReminder(context, userManager, messageService);
                }

                await Task.Delay(TimeSpan.FromHours(24), stoppingToken);
            }
        }

        private TimeSpan CalculateDelayUntilNextRun()
        {
            var now = DateTime.Now;
            var nextRun = now.Date.AddDays(1).AddHours(9);
            if (now.Hour < 9)
            {
                nextRun = now.Date.AddHours(9); 
            }
            return nextRun - now;
        }

        private void ClearOldAppointments(BarberShopContext context)
        {
            var today = DateOnly.FromDateTime(DateTime.Today);
            var oldAppointments = context.Appointments.Where(a => a.Date < today);
            context.Appointments.RemoveRange(oldAppointments);
            context.SaveChanges();
        }

        private void ClearOldActivities(BarberShopContext context)
        {
            var oneDayAgo = DateTime.Now.AddDays(-1);
            var oldActivities = context.UserActivity.Where(ua => ua.Date < oneDayAgo);
            context.UserActivity.RemoveRange(oldActivities);
            context.SaveChanges();
        }

        private void ClearOldSchedules(BarberShopContext context)
        {
            var oneDayAgo = DateOnly.FromDateTime(DateTime.Now.AddDays(-1));
            var oldSchedules = context.Schedules.Where(s => s.EndDate < oneDayAgo);
            context.Schedules.RemoveRange(oldSchedules);
            context.SaveChanges();
        }

        private void ClearOldSpecialSchedules(BarberShopContext context)
        {
            var oneDayAgo = DateOnly.FromDateTime(DateTime.Now.AddDays(-1));
            var oldSchedules = context.SpecialSchedules.Where(ss => ss.EndDate < oneDayAgo);
            context.SpecialSchedules.RemoveRange(oldSchedules);
            context.SaveChanges();
        }

        private async Task SendTextReminder(BarberShopContext context, UserManager<AppUser> userManager, MessageService messageService)
        {
            bool isSmsEnabled = _toggleSmsService.GetStatus();
            if (isSmsEnabled)
            {
                var today = DateOnly.FromDateTime(DateTime.Today);
                var tomorrow = today.AddDays(1);
                var tomorrowAppointments = context.Appointments.Where(a => a.Date == tomorrow).ToList();

                foreach (var appointment in tomorrowAppointments)
                {
                    var user = await userManager.FindByIdAsync(appointment.AppUserId);
                    if (user?.PhoneNumber != null && user.PhoneNumberConfirmed)
                    {
                        try
                        {
                            var userPhone = user.PhoneNumber;
                            await messageService.SendAppointmentReminder(userPhone, appointment.Date, appointment.Time);
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, "Failed to send appointment reminder to {PhoneNumber} for appointment on {AppointmentDate} at {AppointmentTime}.", user.PhoneNumber, appointment.Date, appointment.Time);
                        }
                    }
                }
            }
            else { _logger.LogError("SMS DISABLED SO CANT SEND TEXT REMINDERS"); }
        }
    }
}
