namespace BarberShopTemplate.DTO
{
    public class DeleteAppointmentRequest
    {
        public int AppointmentId { get; set; }
        public string AppUserId { get; set; }
        public string? AppointmentTime { get; set; }
        public DateOnly? AppointmentDate { get; set; } = null;
    }

}
