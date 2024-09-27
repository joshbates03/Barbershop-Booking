using BarberShopTemplate.Data;
using BarberShopTemplate.Models;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace BarberShopTemplate.Repositories
{
    public class BarberRepository : Repository<Barber>, IBarberRepository
    {
        private readonly BarberShopContext _context;

        public BarberRepository(BarberShopContext context) : base(context)
        {
            _context = context;
        }

        // Gets all barbers with schedules
        public async Task<IEnumerable<Barber>> GetAllWithSchedulesAsync()
        {
            return await _context.Barbers
                .Include(b => b.Schedules)
                .ToListAsync();
        }

        // Gets barber by id with schedules
        public async Task<Barber> GetByIdWithSchedulesAsync(int id)
        {
            return await _context.Barbers
                .Include(b => b.Schedules)
                .FirstOrDefaultAsync(b => b.Id == id);
        }

        // Gets barber by id with appointments
        public async Task<Barber> GetByIdWithAppointmentAsync(int id)
        {
            return await _context.Barbers
                .Include(b => b.Appointments)
                .FirstOrDefaultAsync(b => b.Id == id);
        }

        // Adds a schedule to the specified barber
        public async Task AddScheduleAsync(int barberId, Schedule schedule)
        {
            var barber = await _context.Barbers.Include(b => b.Schedules).FirstOrDefaultAsync(b => b.Id == barberId);
            if (barber != null)
            {
                barber.Schedules.Add(schedule);
                await _context.SaveChangesAsync();
            }
        }

        // Gets barbers by name
        public async Task<IEnumerable<Barber>> GetByName(string name)
        {
            return await _context.Barbers
                                 .Where(a => a.Name == name)
                                 .ToListAsync();
        }

        // Finds barber by username
        public async Task<Barber> FindByUsername(string username)
        {
            return await _context.Barbers.SingleOrDefaultAsync(b => b.UserName == username);
        }

        // Finds barber by name
        public async Task<Barber> FindByBarberName(string name)
        {
            return await _context.Barbers.SingleOrDefaultAsync(b => b.Name == name);
        }
    }
}
