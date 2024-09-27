namespace BarberShopTemplate.DTO
{
    public class AppointmentDto
    {
        public int Id { get; set; }
        public string Day { get; set; }
        public string Time { get; set; }
        public DateOnly Date { get; set; }
        public string AppUserName { get; set; }
        public int BarberId { get; set; }

    }
}
