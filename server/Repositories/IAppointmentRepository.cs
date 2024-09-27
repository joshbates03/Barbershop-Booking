using BarberShopTemplate.Models;

namespace BarberShopTemplate.Repositories
{
    public interface IAppointmentRepository : IRepository<Appointment>
    {
        Task<IEnumerable<Appointment>> GetAppointmentsByUserId(string appUserId);
        Task<bool> UserHasAppointmentInSameWeek(string appUserId, DateOnly date);
        Task<IEnumerable<Appointment>> GetUserAppointmentInSameWeek(string appUserId, DateOnly date);
        Task<IEnumerable<Appointment>> GetAppointmentByBarberAndDate(DateOnly date, int barberId);
        Task DeleteAllAppointmentsByUserId(string appUserId);
        Task<bool> DoesAppointmentExist(DateOnly date, string time, int barberId);

    }
}
