using System.ComponentModel.DataAnnotations.Schema;

namespace BarberShopTemplate.Models
{
    [Table("Appointments")]
    public class Appointment
    {
        public int Id { get; set; }
        public string Day { get; set; } = string.Empty;
        public string Time { get; set; } = string.Empty;
        public DateOnly Date { get; set; } 
        public string? AppUserId { get; set; } 
        public string? AppUserName { get; set; } 
        public string? GuestName { get; set; } 
        public AppUser? AppUser { get; set; }
        public int BarberId { get; set; }
        public Barber? Barber { get; set; }
    }
}
