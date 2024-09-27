using Microsoft.AspNetCore.Identity;
using System.Collections.Generic;

namespace BarberShopTemplate.Models
{
    public class AppUser : IdentityUser
    {
        public List<Appointment> Appointments { get; set; } = new List<Appointment>();
        public VerificationCode VerificationCode { get; set; }
    }
}
