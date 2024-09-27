using BarberShopTemplate.Data;
using BarberShopTemplate.Models;
using Microsoft.EntityFrameworkCore;


namespace BarberShopTemplate.Repositories
{
    public class ScheduleRepository : Repository<Schedule>, IScheduleRepository
    {
       private readonly ILogger<ScheduleRepository> _logger;
        public ScheduleRepository(BarberShopContext context, ILogger<ScheduleRepository> logger) : base(context)
        {
            _logger = logger;
        }

        // Gets avaliable times (appointments) for a given day
        public async Task<IEnumerable<string>> GetAvailableTimesAsync(int barberId, string day, DateOnly date)
        {
            var barber = await _context.Barbers
                .Include(b => b.Schedules)
                .Include(b => b.SpecialSchedules)
                .Include(b => b.Appointments)
                .FirstOrDefaultAsync(b => b.Id == barberId);

            if (barber == null)
            {
                return Enumerable.Empty<string>();
            }

            // Check for special schedule on the given date (overrides all regular schedules)
            var specialSchedule = barber.SpecialSchedules
                .FirstOrDefault(s => s.StartDate <= date && (s.EndDate == null || s.EndDate >= date));

            if (specialSchedule != null)
            {
                // If it's a holiday, no available times
                if (specialSchedule.IsHoliday)
                {
                    return Enumerable.Empty<string>();
                }

                // Filter out booked times from special schedule times
                var bookedTimes = barber.Appointments
                    .Where(a => a.Date == date)
                    .Select(a => a.Time.Trim().ToLowerInvariant())
                    .ToList();

                return specialSchedule.Times.Select(t => t.Trim().ToLowerInvariant()).Except(bookedTimes).ToList();
            }

            // Separate schedules based on end date
            var schedulesWithEndDate = barber.Schedules
                .Where(s => s.Day == day
                    && s.StartDate <= date
                    && s.EndDate != null
                    && s.EndDate >= date) // End date is inclusive
                .OrderByDescending(s => s.StartDate)
                .ToList();

            var openEndedSchedules = barber.Schedules
                .Where(s => s.Day == day
                    && s.StartDate <= date
                    && s.EndDate == null) // Open-ended schedules
                .OrderByDescending(s => s.StartDate)
                .ToList();

            Schedule? applicableSchedule = null;

            // Prioritize the specific schedule with both start and end dates
            applicableSchedule = schedulesWithEndDate.FirstOrDefault() ?? openEndedSchedules.FirstOrDefault();

            if (applicableSchedule == null)
            {
                return Enumerable.Empty<string>();
            }

            // Filter out booked times from the selected schedule's times
            var bookedTimesForSchedule = barber.Appointments
                .Where(a => a.Date == date)
                .Select(a => a.Time.Trim().ToLowerInvariant())
                .ToList();

            return applicableSchedule.Times
                .Select(t => t.Trim().ToLowerInvariant())
                .Except(bookedTimesForSchedule)
                .ToList();
        }

        // Gets schedules with no end date
        public async Task<Schedule?> GetOpenEndedScheduleByDayAsync(int barberId, string day)
        {
            var schedule = await _context.Schedules
                .Where(s => s.BarberId == barberId && s.Day == day && s.EndDate == null)
                .FirstOrDefaultAsync();

            return schedule;
        }

        // Gets overlapping schedules
        public async Task<Schedule?> GetOverlappingScheduleAsync(int barberId, string day, DateOnly startDate, DateOnly? endDate, int? excludeId = null)
        {
            return await _context.Schedules
                .Where(s => s.BarberId == barberId
                            && s.Day == day
                            && (excludeId == null || s.Id != excludeId)
                            && (
                                // Disallow if the existing schedule's end date matches the new schedule's start date
                                s.EndDate.HasValue && s.EndDate >= startDate && (!endDate.HasValue || s.StartDate <= endDate)
                            ))
                .FirstOrDefaultAsync();
        }

    }
}
