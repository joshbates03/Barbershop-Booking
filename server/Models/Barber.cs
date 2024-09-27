using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace BarberShopTemplate.Models
{
    public class Barber
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string UserName { get; set; }
        public ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();
        public ICollection<Schedule> Schedules { get; set; } = new List<Schedule>();
        public ICollection<SpecialSchedule> SpecialSchedules { get; set; } = new List<SpecialSchedule>();
        public AppUser? AppUser { get; set; }
    }
}
