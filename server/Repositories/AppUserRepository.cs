using BarberShopTemplate.Data;
using BarberShopTemplate.DTO;
using BarberShopTemplate.Models;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;

namespace BarberShopTemplate.Repositories
{
    public class AppUserRepository : Repository<AppUser>, IAppUserRepository
    {
        public AppUserRepository(BarberShopContext context) : base(context)
        {
        }

        // Gets by id
        public async Task<AppUser> GetById(string id)
        {
            return await _context.Users.FindAsync(id);
        }

        // Deletes an app user
        public async Task Delete(string id)
        {
            var user = await _context.Users.FindAsync(id);
            
            if (user != null)
            {
                _context.Users.Remove(user);
                await _context.SaveChangesAsync();
            }
        }

        // Gets by email
        public async Task<AppUser> GetByEmail(string email)
        {
            return await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
        }

        // Gets by phone number
        public async Task<AppUser> GetByPhone(string phone)
        {
            return await _context.Users.FirstOrDefaultAsync(u => u.PhoneNumber == phone);
        }

        // Gets all users usernames, emails and ids
        public async Task<IEnumerable<ManageCustomerDto>> GetAllUsernamesEmailsAndIds()
        {
            return await _context.Users
                .Where(u => u.UserName != "admin")
                .Select(u => new ManageCustomerDto
                {
                    UserId = u.Id,
                    Username = u.UserName,
                    Email = u.Email,
                    PhoneNumber = u.PhoneNumber,
                    EmailConfirmed = u.EmailConfirmed,
                    PhoneNumberConfirmed = u.PhoneNumberConfirmed
                })
                .ToListAsync();
        }
    }
}
