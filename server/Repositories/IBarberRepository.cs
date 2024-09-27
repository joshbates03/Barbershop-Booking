using BarberShopTemplate.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace BarberShopTemplate.Repositories
{
    public interface IBarberRepository : IRepository<Barber>
    {
        Task<IEnumerable<Barber>> GetAllWithSchedulesAsync();
        Task<IEnumerable<Barber>> GetByName(string name);
        Task<Barber> GetByIdWithSchedulesAsync(int id);
        Task<Barber> GetByIdWithAppointmentAsync(int id);
        Task AddScheduleAsync(int barberId, Schedule schedule);
        Task<Barber> FindByUsername(string username);
        Task<Barber> FindByBarberName(string name);
    }
}
