using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace BarberShopTemplate.Models
{
    public class Schedule
    {
        public int Id { get; set; }
        public string Day { get; set; } = string.Empty;
        public List<string> Times { get; set; } = new List<string>();
        public int BarberId { get; set; }
        public Barber? Barber { get; set; } 
        public DateOnly StartDate { get; set; }
        public DateOnly? EndDate { get; set; }
    }
}
