namespace BarberShopTemplate.DTO
{
    public class ChangeAppointmentDto
    {
        public string AppUserId { get; set; }
        public string? AppointmentTime { get; set; }
        public DateOnly AppointmentDate { get; set; }
        public string? OldAppointmentTime { get; set; }
        public DateOnly OldAppointmentDate { get; set; }
    }
}
