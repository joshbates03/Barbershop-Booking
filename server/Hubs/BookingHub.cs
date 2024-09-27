using BarberShopTemplate.DTO;
using Microsoft.AspNetCore.SignalR;

public class BookingHub : Hub
{
    public async Task SendBookingUpdate(string date, string userId = "DEFAULT_EMPTY", bool admin = false, UserActivityDto notif = null)
    {
        await Clients.All.SendAsync("ReceiveBookingUpdate", date, userId, admin, notif);
    }

  
}

