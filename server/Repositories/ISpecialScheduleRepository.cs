using System.Collections.Generic;
using System.Threading.Tasks;
using BarberShopTemplate.Models;

namespace BarberShopTemplate.Repositories
{
    public interface ISpecialScheduleRepository : IRepository<SpecialSchedule>
    {
        Task<IEnumerable<SpecialSchedule>> GetByBarberIdAsync(int barberId);
        Task<SpecialSchedule?> GetSpecialScheduleByDateAsync(int barberId, DateOnly date);
        Task<SpecialSchedule> GetOverlappingSchedule(int barberId, DateOnly startDate, DateOnly? endDate, int? excludeId = null);
    }
}
