using BarberShopTemplate.Data;
using BarberShopTemplate.DTO;
using BarberShopTemplate.Models;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;

namespace BarberShopTemplate.Repositories
{
    public class UserActivityRepository : Repository<UserActivity>, IUserActivityRepository
    {
        public UserActivityRepository(BarberShopContext context) : base(context)
        {
        }

        // Adds a new user activity
        public async Task AddUserActivity(UserActivityDto userActivityDto)
        {
            var userActivity = new UserActivity
            {
                MessageType = userActivityDto.MessageType,
                Message = userActivityDto.Message,
                UserType = userActivityDto.UserType,
                Date = userActivityDto.Date
            };

            await _context.Set<UserActivity>().AddAsync(userActivity);
            await _context.SaveChangesAsync();
        }

        // Gets booking related activities (notiflications)
        public async Task<IEnumerable<UserActivity>> GetBookingRelatedActivities()
        {
            return await _context.UserActivity
                .Where(ua => (ua.MessageType == "Booking Confirmation" || ua.MessageType == "Booking Cancellation")
                          && ua.UserType == "User")
                .ToListAsync();
        }
    }
}
