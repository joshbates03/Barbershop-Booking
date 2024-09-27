using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using BarberShopTemplate.Data;
using BarberShopTemplate.Models;
using Microsoft.EntityFrameworkCore;

namespace BarberShopTemplate.Repositories
{
    public class SpecialScheduleRepository : Repository<SpecialSchedule>, ISpecialScheduleRepository
    {
        public SpecialScheduleRepository(BarberShopContext context) : base(context)
        {
        }

        // Gets special schedules for a certain barber
        public async Task<IEnumerable<SpecialSchedule>> GetByBarberIdAsync(int barberId)
        {
            return await _context.SpecialSchedules
                .Where(s => s.BarberId == barberId)
                .ToListAsync();
        }

        // Get special schedule by date
        public async Task<SpecialSchedule?> GetSpecialScheduleByDateAsync(int barberId, DateOnly date)
        {
            return await _context.SpecialSchedules
                .Where(s => s.BarberId == barberId && s.StartDate <= date && (s.EndDate == null || s.EndDate >= date))
                .FirstOrDefaultAsync();
        }

        // Get overlapping special schedules
        public async Task<SpecialSchedule> GetOverlappingSchedule(int barberId, DateOnly startDate, DateOnly? endDate, int? excludeId = null)
        {
            var overlappingSchedule = await _context.SpecialSchedules
                .Where(s => s.BarberId == barberId
                    && (excludeId == null || s.Id != excludeId)
                    && (
                        (endDate == null && s.StartDate == startDate) || // Single day schedule conflict
                        (endDate != null && (
                            (s.StartDate <= endDate && s.EndDate >= startDate) || // Overlapping range
                            (s.StartDate == endDate) || // End date same as another start date
                            (s.EndDate == startDate) // Start date same as another end date
                        ))
                    ))
                .FirstOrDefaultAsync();

            return overlappingSchedule;
        }

    }
}
