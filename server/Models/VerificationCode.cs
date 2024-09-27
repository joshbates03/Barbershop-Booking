namespace BarberShopTemplate.Models
{
    public class VerificationCode
    {
        public int Id { get; set; }
        public string Code { get; set; }
        public string AppUserId { get; set; }
        public AppUser? AppUser { get; set; }
        public DateTime expires {  get; set; } 
    }
}
