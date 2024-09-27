using BarberShopTemplate.DTO;
using BarberShopTemplate.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace BarberShopTemplate.Repositories
{
    public interface IAppUserRepository : IRepository<AppUser>
    {
        Task<AppUser> GetById(string id);
        Task Delete(string id);
        Task<AppUser> GetByEmail(string email);
        Task<AppUser> GetByPhone(string phone);
        Task<IEnumerable<ManageCustomerDto>> GetAllUsernamesEmailsAndIds();
    }
}
