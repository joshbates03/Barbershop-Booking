using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace BarberShopTemplate.Models
{
    public class SpecialSchedule
    {
        public int Id { get; set; }
        [Required]
        public DateOnly StartDate { get; set; } 
        public DateOnly? EndDate { get; set; }
        public bool IsHoliday { get; set; }
        public List<string> Times { get; set; } = new List<string>();
        public int BarberId { get; set; }
        public Barber? Barber { get; set; }

        public IEnumerable<DateOnly> CoveredDates
        {
            get
            {
                var endDate = EndDate ?? StartDate; 
                var dates = new List<DateOnly>();
                for (var date = StartDate; date <= endDate; date = date.AddDays(1))
                {
                    dates.Add(date);
                }
                return dates;
            }
        }
    }
}
