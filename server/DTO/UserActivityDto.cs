namespace BarberShopTemplate.DTO
{
    public class UserActivityDto
    {
        public int Id { get; set; }
        public string MessageType { get; set; } 
        public string Message { get; set; } 
        public string UserType { get; set; } 
        public DateTime Date { get; set; }

    }
}
