using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BarberShopTemplate.Models;
using BarberShopTemplate.Repositories;
using Microsoft.AspNetCore.Identity;
using BarberShopTemplate.Services;
using BarberShopTemplate.DTO;
using Microsoft.AspNetCore.SignalR;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class AppointmentsController : ControllerBase
{
    private readonly IAppointmentRepository _appointmentRepository;
    private readonly UserManager<AppUser> _userManager;
    private readonly MessageService _messageService;
    private readonly ILogger<AppointmentsController> _logger;
    private readonly ToggleSmsService _toggleSmsService;
    private readonly IUserActivityRepository _userActivityRepository;
    private readonly IHubContext<BookingHub> _hubContext;

    public AppointmentsController(IAppointmentRepository appointmentRepository, 
           UserManager<AppUser> userManager, 
           MessageService messageService, 
           ILogger<AppointmentsController> logger, 
           IUserActivityRepository userActivityRepository, 
           ToggleSmsService toggleSmsService, 
           IHubContext<BookingHub> hubContext)
    {
        _appointmentRepository = appointmentRepository;
        _userManager = userManager;
        _messageService = messageService;
        _logger = logger;
        _userActivityRepository = userActivityRepository;
        _toggleSmsService = toggleSmsService;
        _hubContext = hubContext;
    }   


    // GET
   
    // Gets all appointments
    [HttpGet]
    [Authorize(Roles = "Admin, Barber")]
    public async Task<ActionResult<IEnumerable<Appointment>>> GetAppointments()
    {
        var appointments = await _appointmentRepository.GetAll();
        return Ok(appointments);
    }

    // Gets an appointment by its id
    [HttpGet("{id}")]
    public async Task<ActionResult<Appointment>> GetAppointment(int id)
    {
        var appointment = await _appointmentRepository.GetById(id);
        if (appointment == null)
        {
            return NotFound();
        }

        return Ok(appointment);
    }

    // Gets appointments by appUserId
    [HttpGet("ByUser/{appUserId}")]
    public async Task<ActionResult<IEnumerable<AppointmentDto>>> GetAppointmentsByUserId(string appUserId)
    {
        try
        {
            var user = await _userManager.FindByIdAsync(appUserId);
            if (user == null)
                return BadRequest(new { message = "This user does not exist" });

            var appointments = await _appointmentRepository.GetAppointmentsByUserId(appUserId);
            if (appointments == null || !appointments.Any())
            {
                return Ok(new List<AppointmentDto>()); 
            }

            var appointmentDtos = appointments.Select(a => new AppointmentDto
            {
                Id = a.Id,
                Day = a.Day,
                Time = a.Time,
                Date = a.Date,
                AppUserName = a.AppUserName,
                BarberId = a.BarberId,
               
            }).ToList();

            return Ok(appointmentDtos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to fetch appointments for user: {UserId}", appUserId);
            return BadRequest(new { message = "An error occurred whilst fetching appointments" });
        }
    }

    // Gets appointments by barber ID on a given date
    [HttpGet("ByDate")]
    public async Task<ActionResult<IEnumerable<Appointment>>> GetAppointmentByBarberIdAndDate([FromQuery] int barberId, [FromQuery] DateOnly date)
    {
        try
        {
            var appointments = await _appointmentRepository.GetAppointmentByBarberAndDate(date, barberId);
            if (appointments == null || !appointments.Any())
            {
                return NotFound(new { message = "No appointments found for this user." });
            }
            return Ok(appointments);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"An error occurred whilst fetching appointments for barber id {barberId} and date {date}");
            return BadRequest(new { message = "An error occurred whilst fetching appointments" });
        }
    }


    // POST

    // Adds an appointment - used by users
    [HttpPost]
    public async Task<IActionResult> CreateAppointment([FromBody] Appointment appointment)
    {
        // Always for a user with an account - failsafe incase it was somehow passed as !""
        appointment.GuestName = "";
        var user = await _userManager.FindByIdAsync(appointment.AppUserId);

        if (user == null) { return BadRequest(new { message = "Invalid credentials" }); }
        
        // Skips the check if the user is an admin or barber
        var roles = await _userManager.GetRolesAsync(user);
        if (!roles.Contains("Admin") && !roles.Contains("Barber"))
        {
            if (await _appointmentRepository.UserHasAppointmentInSameWeek(appointment.AppUserId, appointment.Date))
            {
                var existingAppointment = await _appointmentRepository.GetUserAppointmentInSameWeek(appointment.AppUserId, appointment.Date);
                return BadRequest(new
                {
                    message = "You can only book one appointment per week",
                    existingAppointment
                });
            }
        }

        try
        {
            if (await _appointmentRepository.DoesAppointmentExist(appointment.Date, appointment.Time, appointment.BarberId)) 
            {
                return BadRequest(new { message = "This appointment has been taken" });
            }
            await _appointmentRepository.Add(appointment);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to book appointment");
            return BadRequest(new { message = "An error occured whilst booking your appointment" });
        }

        var newActivity = new UserActivityDto
        {
            Message = $"{user.UserName}: {appointment.Date} at {appointment.Time}",
            Date = DateTime.Now,  
            MessageType = "Booking Confirmation",
            UserType = "User"
        };

        await _userActivityRepository.AddUserActivity(newActivity);
        await _hubContext.Clients.All.SendAsync("ReceiveBookingUpdate", appointment.Date, appointment.AppUserId, true, newActivity);

        return Ok(appointment);
    }

    // Adds an appointment created by admin for real users
    [HttpPost("Admin/BookAppointment")]
    [Authorize(Roles = "Admin, Barber")]
    public async Task<IActionResult> AdminCreateAppointment([FromBody] Appointment appointment)
    {
        if (appointment.GuestName != "" ) { return BadRequest(new { message = "Cannot create a user booking with guest details" }); }

        var user = await _userManager.FindByIdAsync(appointment.AppUserId);

        if (user == null) { return BadRequest(new { message = "Invalid credentials" }); }

        try
        {
            if (await _appointmentRepository.DoesAppointmentExist(appointment.Date, appointment.Time, appointment.BarberId))
            {
                return BadRequest(new { message = "This appointment has been taken" });
            }
            await _appointmentRepository.Add(appointment);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to book appointment");
            return BadRequest(new { message = "An error occured whilst booking your appointment" });
        }

        await _hubContext.Clients.All.SendAsync("ReceiveBookingUpdate", appointment.Date);

        return Ok(appointment);
    }

    // Adds a guest appointment created by admin
    [HttpPost("Admin/BookGuestAppointment")]
    [Authorize(Roles = "Admin, Barber")]
    public async Task<IActionResult> CreateGuestAppointment([FromBody] Appointment appointment)
    {
        if (appointment.AppUser != null || appointment.AppUserName != null) { return BadRequest(new { message = "Cannot create a guest booking with user details" }); }

        if (appointment.GuestName.Length > 15) { return BadRequest(new { message = "Guest names can be no longer than 15 characters" }); }

        try
        {
            if (await _appointmentRepository.DoesAppointmentExist(appointment.Date, appointment.Time, appointment.BarberId))
            {
                return BadRequest(new { message = "This appointment has been taken" });
            }
            await _appointmentRepository.Add(appointment);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create guest appointment");
            return BadRequest(new { message = "An error occured whilst creating guest appointment" });
        }
        
        await _hubContext.Clients.All.SendAsync("ReceiveBookingUpdate", appointment.Date);

        return Ok(appointment);
    }

    // Sends SMS when a user books their appointment
    [HttpPost("Send/BookingConfirmation")]
    public async Task<IActionResult> SendBookingConformation([FromBody] Appointment appointment)
    {
        bool isSmsEnable = _toggleSmsService.GetStatus();
        if (isSmsEnable)
        {
            var user = await _userManager.FindByIdAsync(appointment.AppUserId);

            if (user == null) { return BadRequest(new { message = "Invalid credentials" }); }

            if (user.PhoneNumberConfirmed)
            {
                try
                {
                    await _messageService.SendBookingConfirmation(user.PhoneNumber, appointment.Time, appointment.Date);
                    return Ok();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to send booking confirmation SMS");

                    if (ex.Message.Contains("\"code\": \"20012\""))
                    {
                        return BadRequest(new { message = "SMS is currently unavailable" });
                    }
                    return BadRequest(new { message = "An error occured whilst sending booking confirmation" });

                }
            }
            else { return BadRequest(new { message = "Phone number must be verified to receive SMS" }); }
        }
        else { return BadRequest(new { message = "SMS has currently been disabled" }); }
    }

    // Sends SMS when a user books their appointment
    [HttpPost("Send/ChangeAppointment")]
    public async Task<IActionResult> SendChangeAppointment([FromBody] ChangeAppointmentDto request)
    {
        bool isSmsEnable = _toggleSmsService.GetStatus();
        if (isSmsEnable)
        {
            var user = await _userManager.FindByIdAsync(request.AppUserId);

            if (user == null) { return BadRequest(new { message = "Invalid credentials" }); }

            if (user.PhoneNumberConfirmed)
            {
                try
                {
                    await _messageService.SendUpdateAppointmentConfirmation(user.PhoneNumber, request.AppointmentDate, request.AppointmentTime, request.OldAppointmentDate, request.OldAppointmentTime);
                    return Ok();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to send booking confirmation SMS");

                    if (ex.Message.Contains("\"code\": \"20012\""))
                    {
                        return BadRequest(new { message = "SMS is currently unavailable" });
                    }
                    return BadRequest(new { message = "An error occured whilst sending booking confirmation" });
                }
            }
            else { return BadRequest(new { message = "Phone number must be verified to receive SMS" }); }
        }
        else { return BadRequest(new { message = "SMS has currently been disabled" }); }

    }

    // Sends SMS when an admin books a user's appointment
    [HttpPost("Admin/Send/BookingConfirmation")]
    public async Task<IActionResult> SendBookingConformationAdmin([FromBody] Appointment appointment)
    {
        bool isSmsEnable = _toggleSmsService.GetStatus();
        if (isSmsEnable)
        {
            var user = await _userManager.FindByIdAsync(appointment.AppUserId);

            if (user == null) { return BadRequest(new { message = "Invalid credentials" }); }

            if (user.PhoneNumberConfirmed)
            {
                try
                {
                    await _messageService.SendAdminBookingConfirmation(user.PhoneNumber, appointment.Time, appointment.Date);
                    return Ok();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to send admin booking confirmation SMS");

                    if (ex.Message.Contains("\"code\": \"20012\""))
                    {
                        return BadRequest(new { message = "SMS is currently unavailable" });
                    }
                    return BadRequest(new { message = "An error occured whilst sending admin booking confirmation" });
                }
            }
            else { return BadRequest(new { message = "Phone number must be verified to receive SMS" }); }
        }
        else { return BadRequest(new { message = "SMS has currently been disabled" }); }

    }

    // Sends SMS when a user removes their booking
    [HttpPost("Send/BookingRemovalConfirmation")]
    public async Task<IActionResult> ConfirmDeletionByUser([FromBody] DeleteAppointmentRequest request)
    {
        bool isSmsEnabled = _toggleSmsService.GetStatus();
        if (isSmsEnabled)
        {
            var user = await _userManager.FindByIdAsync(request.AppUserId);
            if (user == null) { return BadRequest(new { message = "Invalid credentials" }); }

            // Ensure appointment date and time are provided for SMS sending
            if (request.AppointmentDate == null || string.IsNullOrEmpty(request.AppointmentTime)) { return BadRequest(new { message = "Appointment date and time must be provided" }); }

            if (user.PhoneNumberConfirmed)
            {
                try
                {
                    var appointmentTime = DateTime.Parse(request.AppointmentTime);

                    await _messageService.SendRemovedBookingMessage(user.PhoneNumber, request.AppointmentTime, request.AppointmentDate.Value);
                    return Ok();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to send booking cancellation confirmation SMS");

                    if (ex.Message.Contains("\"code\": \"20012\""))
                    {
                        return BadRequest(new { message = "SMS is currently unavailable" });
                    }
                    return BadRequest(new { message = "An error occurred whilst sending booking cancellation confirmation" });
                }
            }
            else
            {
                return BadRequest(new { message = "Phone number must be verified to receive SMS" });
            }
        }
        else { return BadRequest(new { message = "SMS has currently been disabled" }); }
    }

    // Sends SMS when admin removes a users appointment
    [HttpPost("Admin/Send/BookingRemovalConfirmation")]
    [Authorize(Roles = "Admin, Barber")]
    public async Task<IActionResult> SendAdminRemovedBookingMessage([FromBody] Appointment appointment)
    {
        bool isSmsEnable = _toggleSmsService.GetStatus();
        if (isSmsEnable)
        {
            var user = await _userManager.FindByIdAsync(appointment.AppUserId);

            if (user == null) { return BadRequest(new { message = "Invalid credentials" }); }

            if (user.PhoneNumberConfirmed)
            {
                try
                {
                    await _messageService.SendAdminRemovedBookingMessage(user.PhoneNumber, appointment.Time, appointment.Date);
                    return Ok();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to send admin booking cancellation SMS");

                    if (ex.Message.Contains("\"code\": \"20012\""))
                    {
                        return BadRequest(new { message = "SMS is currently unavailable" });
                    }
                    return BadRequest(new { message = "An error occured whilst sending admin booking cancellation" });

                }
            }
            else { return BadRequest(new { message = "Phone number must be verified to receive SMS" }); }
        }
        else { return BadRequest(new { message = "SMS has currently been disabled" }); }

    }

    // Sends SMS when admin modifies a users appointment
    [HttpPost("Admin/SendModifiedAppointment")]
    [Authorize(Roles = "Admin, Barber")]
    public async Task<IActionResult> SendAdminModifiedAppointment([FromBody] ModifyAppointmentDto request)
    {
        bool isSmsEnable = _toggleSmsService.GetStatus();
        if (isSmsEnable)
        {
            var user = await _userManager.FindByIdAsync(request.AppUserId);

            if (user == null) { return BadRequest(new { message = "Invalid credentials" }); }

            if (user.PhoneNumberConfirmed)
            {
                try
                {
                    await _messageService.SendAdminModifiedAppointment(user.PhoneNumber, request.AppointmentDate, request.AppointmentTime, request.OldAppointmentDate, request.OldAppointmentTime);
                    return Ok();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to send booking confirmation SMS");

                    if (ex.Message.Contains("\"code\": \"20012\""))
                    {
                        return BadRequest(new { message = "SMS is currently unavailable" });
                    }
                    return BadRequest(new { message = "An error occured whilst sending booking modification confirmation" });

                }
            }
            else { return BadRequest(new { message = "Phone number must be verified to receive SMS" }); }
        }
        else { return BadRequest(new { message = "SMS has currently been disabled" }); }
    }


    // PUT

    // Updates an appointment
    [HttpPut("{id}")]
    [Authorize(Roles = "Admin, Barber")]
    public async Task<IActionResult> PutAppointment(int id, Appointment appointment)
    {
        if (id != appointment.Id) { return BadRequest("The appointment to update doesn't match the provided appointment"); }

        var existingAppointment = await _appointmentRepository.GetById(id);

        if (existingAppointment == null) { return NotFound($"Appointment with ID {id} not found"); }

        await _appointmentRepository.Update(appointment);
        return NoContent();
    }


    // DELETE 

    // Deletes an appointment 
    [HttpDelete]
    public async Task<IActionResult> DeleteAppointmentUser(int appointmentId, string appUserId, [FromQuery] bool adminView)
    {
        var user = await _userManager.FindByIdAsync(appUserId);
        if (user == null) { return BadRequest(new { message = "No user found" }); }

        var appointment = await _appointmentRepository.GetById(appointmentId);
        if (appointment == null) { return BadRequest(new { message = "No appointment found" }); }

        if (appointment.AppUserId != appUserId) { return BadRequest(new { message = "Invalid credentials" }); }

        try
        {
            await _appointmentRepository.Delete(appointmentId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to delete appointment");
            return BadRequest(new { message = "An error occurred whilst cancelling your appointment" });
        }

        if (!adminView)
        {
            string message = $"{user.UserName}: {appointment.Date} at {appointment.Time}";
            string userType = "User";

            var newActivity = new UserActivityDto
            {
                Message = message,
                Date = DateTime.Now,
                MessageType = "Booking Cancellation",
                UserType = userType
            };

            await _userActivityRepository.AddUserActivity(newActivity);
            await _hubContext.Clients.All.SendAsync("ReceiveBookingUpdate", appointment.Date, "DEFAULT_EMPTY", true, newActivity);
        }

        return Ok();
    }

    // Deletes an appointment - used by admins as they have to consider whether they are removing a standard user's appointment or a guest user's appointment
    [HttpDelete("Admin/Delete/{id}")]
    [Authorize(Roles = "Admin, Barber")]
    public async Task<IActionResult> DeleteAppointment(int id, string? appUserId, string? guestName)
    {
        try
        {
            var appointment = await _appointmentRepository.GetById(id);

            if (appointment == null) { return BadRequest(new { message = "Appointment not found" }); }

            await _appointmentRepository.Delete(id);
            await _hubContext.Clients.All.SendAsync("ReceiveBookingUpdate", appointment.Date);

            return Ok(new { message = "Appointment deleted successfully", Appointment = appointment });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to delete appointment");
            return StatusCode(500, new { message = "An error occurred while deleting the appointment" });
        }
    }














}
