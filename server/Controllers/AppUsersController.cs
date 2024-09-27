using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BarberShopTemplate.Models;
using BarberShopTemplate.Repositories;
using BarberShopTemplate.DTO;
using static Microsoft.EntityFrameworkCore.DbLoggerCategory;
using BarberShopTemplate.Services;
using Microsoft.AspNetCore.Identity;
using Azure.Core;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class AppUsersController : ControllerBase
{
    private readonly IAppUserRepository _appUserRepository;
    private readonly MessageService _messageService;
    private readonly UserManager<AppUser> _userManager;
    private readonly ILogger<AppUsersController> _logger;
    private readonly IAppointmentRepository _appAppointmentRepository;
    private readonly ToggleSmsService _toggleSmsService;

    public AppUsersController(IAppUserRepository appUserRepository, 
           MessageService messageService, 
           UserManager<AppUser> userManager, 
           ILogger<AppUsersController> logger, 
           IAppointmentRepository appAppointmentRepository, 
           ToggleSmsService toggleSmsService)
    {
        _appUserRepository = appUserRepository;
        _messageService = messageService;
        _userManager = userManager;
        _logger = logger;
        _appAppointmentRepository = appAppointmentRepository;
        _toggleSmsService = toggleSmsService;
    }


    // GET

    // Gets all app users
    [HttpGet]
    [Authorize(Roles = "Admin, Barber")]
    public async Task<ActionResult<IEnumerable<AppUser>>> GetAppUsers()
    {
        var users = await _appUserRepository.GetAll();
        return Ok(users);
    }

    // Gets all app users usernames
    [HttpGet("usernames")]
    [Authorize(Roles = "Admin, Barber")]
    public async Task<ActionResult<IEnumerable<string>>> GetAppUserNames()
    {
        try
        {
            var users = await _appUserRepository.GetAll();
            var usernames = users.Select(user => user.UserName).ToList();
            return Ok(usernames);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to fetch usernames");
            return BadRequest(new { message = "An error occurred whilst fetching usernames" });
        }
    }

    // Gets an app user by id
    [HttpGet("{id}")]
    public async Task<ActionResult<AppUser>> GetAppUser(string id)
    {
        var user = await _appUserRepository.GetById(id);
        if (user == null) { return NotFound(); }
        return Ok(user);
    }

    // Gets relevant profile information from a user
    [HttpGet("{id}/profile")]
    public async Task<ActionResult<AppUserProfileDto>> GetAppUserProfileDetails(string id)
    {
        try
        {
            var user = await _appUserRepository.GetById(id);
            if (user == null) { return BadRequest(new { message = "No user was found" }); }

            var userProfile = new AppUserProfileDto
            {
                UserId = user.Id,
                Username = user.UserName!, 
                Email = user.Email!,
                PhoneNumber = user.PhoneNumber!,
                EmailConfirmed = user.EmailConfirmed,
                PhoneNumberConfirmed = user.PhoneNumberConfirmed
            };

            return Ok(userProfile);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to fetch profile details");
            return BadRequest(new { message = "An error occurred whilst fetching profile details" });
        }
    }

    // Gets relevant profile information from a user
    [HttpGet("customer")]
    public async Task<ActionResult<IEnumerable<AppUserProfileDto>>> GetCustomerDetails()
    {
        try
        {
            var users = await _appUserRepository.GetAllUsernamesEmailsAndIds();
            if (users == null || !users.Any()) { return Ok(new List<AppUserProfileDto>()); }
            return Ok(users);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An error occurred whilst fetching customer details");
            return BadRequest(new { Message = "An error occurred whilst fetching customer details" });
        }
    }

    
    // POST

    // Adds app users
    [HttpPost]
    public async Task<ActionResult<AppUser>> PostAppUser(AppUser user)
    {
        await _appUserRepository.Add(user);
        return CreatedAtAction("GetAppUser", new { id = user.Id }, user);
    }

    // Sends custom SMS to user
    [HttpPost("contact")]
    public async Task<IActionResult> ContactUser(string userId, string message)
    {
        bool isSmsEnabled =  _toggleSmsService.GetStatus();
        if (isSmsEnabled)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null) { return BadRequest(new { Message = "User not found" }); }

            try
            {
                if (user.PhoneNumberConfirmed)
                {
                    try
                    {
                        await _messageService.SendCustomMessage(user.PhoneNumber, message);
                        return Ok();
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Failed to send custom SMS");

                        if (ex.Message.Contains("\"code\": \"20012\""))
                        {
                            return BadRequest(new { message = "SMS is currently unavailable" });
                        }
                        return BadRequest(new { message = "An error occured whilst sending custom SMS" });
                    }
                }
                else { return BadRequest(new { message = "Phone number must be verified to receive SMS" }); }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send custom message");

                if (ex.Message.Contains("\"code\": \"20012\""))
                {
                    return BadRequest(new { message = "SMS is currently unavailable" });
                }

                return BadRequest(new { message = "An unexpected error occurred while sending the message" });
            }
        }
        else { return BadRequest(new { message = "SMS has currently been disabled" }); } 
    }

    // Deletes a user
    [HttpPost("DeleteCustomerAccount")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteCustomerAccount([FromBody] string userId)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) { return NotFound(new { message = "User not found" }); }

        // Delete all appointments for the user
        await _appAppointmentRepository.DeleteAllAppointmentsByUserId(userId);

        var deleteResult = await _userManager.DeleteAsync(user);
        if (!deleteResult.Succeeded) { return StatusCode(500, new { message = "Failed to delete user" }); }
        return Ok(new { message = "User account deleted successfully" });
    }


    // PUT

    // Updates an app user
    [HttpPut("{id}")]
    public async Task<IActionResult> PutAppUser(string id, AppUser user)
    {
        if (id != user.Id) { return BadRequest("The app user to update doesn't match the provided app user"); }

        var existingUser = await _appUserRepository.GetById(id);
        if (existingUser == null) { return NotFound($"App user with ID {id} not found"); }

        await _appUserRepository.Update(user);
        return NoContent();
    }

    // Updates an app users phone number
    [HttpPut("UpdatePhoneNumber")]
    public async Task<IActionResult> UpdatePhoneNumber([FromBody] UpdatePhoneNumberDto updatePhoneNumberDto)
    {
        if (updatePhoneNumberDto.NewPhoneNumber.StartsWith("0"))
        {
            updatePhoneNumberDto.NewPhoneNumber = "+44" + updatePhoneNumberDto.NewPhoneNumber.Substring(1);
        }
        else if (updatePhoneNumberDto.NewPhoneNumber.StartsWith("44"))
        {
            updatePhoneNumberDto.NewPhoneNumber = "+" + updatePhoneNumberDto.NewPhoneNumber;
        }
        else if (updatePhoneNumberDto.NewPhoneNumber.StartsWith("+44"))
        {
            // Do nothing
        }
        else
        {
            return BadRequest(new { message = "Invalid phone number format." });
        }

        if (updatePhoneNumberDto.NewPhoneNumber.Length != 13){ return BadRequest(new { message = "Invalid phone number format." }); }
        var user = await _appUserRepository.GetById(updatePhoneNumberDto.Id);
        if (user == null) { return BadRequest(new { message = "User not found" }); }
        if (updatePhoneNumberDto.NewPhoneNumber == updatePhoneNumberDto.CurrentPhoneNumber) { return BadRequest(new { message = "The new phone number cannot be the same as the current phone number" }); }
        if (user.PhoneNumber != updatePhoneNumberDto.CurrentPhoneNumber) { return BadRequest(new { message = "Current phone number does not match" }); }
        var existingUserWithPhoneNumber = await _appUserRepository.GetByPhone(updatePhoneNumberDto.NewPhoneNumber);
        if (existingUserWithPhoneNumber != null) { return BadRequest(new { message = "The new phone number is already in use" }); }

        user.PhoneNumber = updatePhoneNumberDto.NewPhoneNumber;
        user.PhoneNumberConfirmed = false;

        try
        {
            await _appUserRepository.Update(user);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An error occurred while updating the phone number");
            return StatusCode(500, new { message = "An error occurred while updating the phone number" });
        }

        return NoContent();
    }

    // Updates an app users email
    [HttpPut("UpdateEmail")]
    public async Task<IActionResult> UpdateEmail([FromBody] UpdateEmailDto updateEmailDto)
    {
        if (!IsValidEmail(updateEmailDto.NewEmail))
        {
            return BadRequest(new { message = "The new email format is invalid" });
        }

        var user = await _appUserRepository.GetById(updateEmailDto.Id);

        if (user == null)
        {
            return BadRequest(new { message = "User not found" });
        }

        if (updateEmailDto.NewEmail == updateEmailDto.CurrentEmail)
        {
            return BadRequest(new { message = "The new email cannot be the same as the current email" });
        }

        if (user.Email != updateEmailDto.CurrentEmail)
        {
            return BadRequest(new { message = "Current email does not match" });
        }

        var existingUserWithNewEmail = await _appUserRepository.GetByEmail(updateEmailDto.NewEmail);
        if (existingUserWithNewEmail != null)
        {
            return BadRequest(new { message = "The new email is already in use" });
        }

        user.Email = updateEmailDto.NewEmail;
        user.NormalizedEmail = updateEmailDto.NewEmail.ToUpper();
        user.EmailConfirmed = false;

        try
        {
            await _appUserRepository.Update(user);
            return Ok(new { message = "Email updated successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An error occurred while updating the email");
            return StatusCode(500, new { message = "An error occurred while updating the email" });
        }
    }

    private bool IsValidEmail(string email)
    {
        if (string.IsNullOrWhiteSpace(email))
            return false;

        try
        {
            // Use the built-in email address validation in .NET
            var addr = new System.Net.Mail.MailAddress(email);
            return addr.Address == email;
        }
        catch
        {
            return false;
        }
    }


    // DELETE

    // Deletes a user
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteAppUser(string id)
    {
        var user = await _appUserRepository.GetById(id);
        if (user == null) { return NotFound(); }
        await _appUserRepository.Delete(id);
        return NoContent();
    }

    



 


}
