using BarberShopTemplate.Models;
using System.Threading.Tasks;

namespace BarberShopTemplate.Repositories
{
    public interface IVerificationCodeRepository : IRepository<VerificationCode>
    {
        Task<VerificationCode> GetValidVerificationCodeByUserIdAsync(string userId);
        Task UpdateVerificationCodeAsync(string userId, string newCode, DateTime newExpiry);
        Task DeleteVerificationCodeAsync(string userId);
    }
}
