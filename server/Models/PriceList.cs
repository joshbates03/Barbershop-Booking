using Microsoft.AspNetCore.Mvc;

namespace BarberShopTemplate.Models
{
    public class PriceList
    {
        public int Id { get; set; }
        public string Cut { get; set; } = string.Empty;
        public string Price { get; set; } = string.Empty;
    }
}
