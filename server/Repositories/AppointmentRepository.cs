using BarberShopTemplate.Data;
using BarberShopTemplate.Models;
using Microsoft.EntityFrameworkCore;

namespace BarberShopTemplate.Repositories
{
    public class AppointmentRepository : Repository<Appointment>, IAppointmentRepository
    {
        public AppointmentRepository(BarberShopContext context) : base(context)
        {
        }

        // Gets an appointment from appUserId
        public async Task<IEnumerable<Appointment>> GetAppointmentsByUserId(string appUserId)
        {
            return await _context.Appointments
                                 .Where(a => a.AppUserId == appUserId)
                                 .ToListAsync();
        }

        // Checks if a user has an appointment booked in said week
        public async Task<bool> UserHasAppointmentInSameWeek(string appUserId, DateOnly date)
        {
            var startOfWeek = date.AddDays(-(int)date.DayOfWeek);
            var endOfWeek = startOfWeek.AddDays(6);

            var appointments = await _context.Appointments
                .Where(a => a.AppUserId == appUserId &&
                            a.Date >= startOfWeek &&
                            a.Date <= endOfWeek)
                .ToListAsync();

            return appointments.Any();
        }

        // Gets the appointment booked in said week
        public async Task<IEnumerable<Appointment>> GetUserAppointmentInSameWeek(string appUserId, DateOnly date)
        {
            var startOfWeek = date.AddDays(-(int)date.DayOfWeek);
            var endOfWeek = startOfWeek.AddDays(6);

            var appointments = await _context.Appointments
                .Where(a => a.AppUserId == appUserId &&
                            a.Date >= startOfWeek &&
                            a.Date <= endOfWeek)
                .ToListAsync();

            return appointments;
        }

        // Gets appointments by barber and date
        public async Task<IEnumerable<Appointment>> GetAppointmentByBarberAndDate(DateOnly date, int barberId)
        {
            var appointments = await _context.Appointments
                .Where(a => a.BarberId == barberId &&
                            a.Date == date)
                .ToListAsync();

            return appointments;
        }

        // Deletes all appointments for a given user by user ID
        public async Task DeleteAllAppointmentsByUserId(string appUserId)
        {
            var appointments = await _context.Appointments
                .Where(a => a.AppUserId == appUserId)
                .ToListAsync();

            _context.Appointments.RemoveRange(appointments);
            await _context.SaveChangesAsync();
        }

        // Checks if an appointment exists
        public async Task<bool> DoesAppointmentExist(DateOnly date, string time, int barberId)
        {
            return await _context.Appointments
                .AnyAsync(a => a.Date == date && a.Time == time && a.BarberId == barberId);
        }
    }
}
