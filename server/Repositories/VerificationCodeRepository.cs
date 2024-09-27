using BarberShopTemplate.Data;
using BarberShopTemplate.Models;
using Microsoft.EntityFrameworkCore;

namespace BarberShopTemplate.Repositories
{
    public class VerificationCodeRepository : Repository<VerificationCode>, IVerificationCodeRepository
    {
        private readonly BarberShopContext _context;

        public VerificationCodeRepository(BarberShopContext context) : base(context)
        {
            _context = context;
        }

        // Gets a user's verification code IF one exits AND it is within the expiration time
        public async Task<VerificationCode> GetValidVerificationCodeByUserIdAsync(string userId)
        {
            return await _context.VerificationCode
                .FirstOrDefaultAsync(vc => vc.AppUserId == userId && vc.expires > DateTime.UtcNow);
        }

        // Updates a user's verification code and expiry time OR gives them a new one if needed
        public async Task UpdateVerificationCodeAsync(string userId, string newCode, DateTime newExpiry)
        {
            var verificationCode = await _context.VerificationCode
                .FirstOrDefaultAsync(vc => vc.AppUserId == userId);

            if (verificationCode != null)
            {
                verificationCode.Code = newCode;
                verificationCode.expires = newExpiry;
                _context.VerificationCode.Update(verificationCode);
                await _context.SaveChangesAsync();
            }
            else
            {
                var newVerificationCode = new VerificationCode
                {
                    AppUserId = userId,
                    Code = newCode,
                    expires = newExpiry
                };
                _context.VerificationCode.Add(newVerificationCode);
                await _context.SaveChangesAsync();
            }
        }

        // Deletes a verification code
        public async Task DeleteVerificationCodeAsync(string userId)
        {
            var verificationCode = await _context.VerificationCode
                .FirstOrDefaultAsync(vc => vc.AppUserId == userId);

            if (verificationCode != null)
            {
                _context.VerificationCode.Remove(verificationCode);
                await _context.SaveChangesAsync();
            }
        }

    }
}
