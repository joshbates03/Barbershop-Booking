using BarberShopTemplate.DTO;
using BarberShopTemplate.Models;
using System.Threading.Tasks;

namespace BarberShopTemplate.Repositories
{
    public interface IUserActivityRepository : IRepository<UserActivity>
    {
        Task AddUserActivity(UserActivityDto userActivityDto);
        Task<IEnumerable<UserActivity>> GetBookingRelatedActivities();
    }
}
