using BarberShopTemplate.Models;

namespace BarberShopTemplate.Repositories
{
    public interface IScheduleRepository : IRepository<Schedule>
    {
        Task<IEnumerable<string>> GetAvailableTimesAsync(int barberId, string day, DateOnly date);
        Task<Schedule?> GetOpenEndedScheduleByDayAsync(int barberId, string day);
        Task<Schedule?> GetOverlappingScheduleAsync(int barberId, string day, DateOnly startDate, DateOnly? endDate, int? excludeId = null);

    }

}


