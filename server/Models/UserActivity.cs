using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace BarberShopTemplate.Models
{
    public class UserActivity
    {
        public int Id { get; set; }
        public string MessageType { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public string UserType { get; set; } = string.Empty;
        public DateTime Date { get; set; }

    }
}
