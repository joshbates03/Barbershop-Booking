using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BarberShopTemplate.Models;
using BarberShopTemplate.Repositories;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class BarbersController : ControllerBase
{
    private readonly IBarberRepository _barberRepository;
    private readonly IScheduleRepository _scheduleRepository;
    private readonly ILogger<BarbersController> _logger;
    private readonly UserManager<AppUser> _userManager;
    private readonly RoleManager<IdentityRole> _roleManager;

    public BarbersController(IBarberRepository barberRepository, 
           IScheduleRepository scheduleRepository, 
           ILogger<BarbersController> logger, 
           UserManager<AppUser> userManager, 
           RoleManager<IdentityRole> roleManager)
    {
        _barberRepository = barberRepository;
        _scheduleRepository = scheduleRepository;
        _logger = logger;
        _userManager = userManager;
        _roleManager = roleManager; 
    }

    // GET

    // Gets all barbers
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Barber>>> GetBarbers()
    {
        try
        {
            var barbers = await _barberRepository.GetAll();
            if (barbers == null || !barbers.Any()) { return Ok(new List<Barber>()); }
            return Ok(barbers);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An error occurred whilst fetching barbers");
            return BadRequest(new { message = "An error occurred whilst fetching barbers" });
        }
    }

    // Gets all barbers including their schedules
    [HttpGet("with-schedules")]
    public async Task<ActionResult<IEnumerable<Barber>>> GetAllWithSchedulesAsync()
    {
        try
        {
            var barbers = await _barberRepository.GetAllWithSchedulesAsync();
            return Ok(barbers);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An error occurred whilst fetching barbers with schedules");
            return BadRequest(new { message = "An error occurred whilst fetching barbers with schedules" });
        }
    }

    // Gets a barber by its id
    [HttpGet("{id}")]
    public async Task<ActionResult<Barber>> GetBarber(int id)
    {
        try
        {
            var barber = await _barberRepository.GetById(id);
            if (barber == null) { return NotFound(new { message = "Barber not found" }); }
            return Ok(barber);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"An error occurred whilst fetching barber with id {id}");
            return BadRequest(new { message = "An error occurred whilst fetching barber" });
        }
    }

    // Gets a barber and their schedules by its id
    [HttpGet("with-schedules/{id}")]
    public async Task<ActionResult<Barber>> GetByIdWithSchedulesAsync(int id)
    {
        try
        {
            var barber = await _barberRepository.GetByIdWithSchedulesAsync(id);
            if (barber == null) { return NotFound(new { message = "Barber not found" }); }
            return Ok(barber);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"An error occurred whilst fetching barber with schedules for id {id}");
            return BadRequest(new { message = "An error occurred whilst fetching barber with schedules" });
        }
    }

    // Gets a barber and their appointments by its id
    [HttpGet("with-appointment/{id}")]
    public async Task<ActionResult<Barber>> GetByIdWithAppointmentAsync(int id)
    {
        try
        {
            var barber = await _barberRepository.GetByIdWithAppointmentAsync(id);
            if (barber == null) { return NotFound(new { message = "Barber not found" }); }
            return Ok(barber);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"An error occurred whilst fetching barber with appointments for id {id}");
            return BadRequest(new { message = "An error occurred whilst fetching barber with appointments" });
        }
    }

    // Gets avaliable times for a barber on a given day
    [HttpGet("{barberId}/available-times")]
    public async Task<ActionResult<IEnumerable<string>>> GetAvailableTimes(int barberId, [FromQuery] string day, [FromQuery] DateOnly date)
    {
        try
        {
            var availableTimes = await _scheduleRepository.GetAvailableTimesAsync(barberId, day, date);
            return Ok(availableTimes ?? new List<string>());
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"An error occurred whilst fetching available times for barber with id {barberId}");
            return BadRequest(new { message = "An error occurred whilst fetching available times" });
        }
    }


    // POST

    // Adds a barber
    [HttpPost]
    [Authorize(Roles = "Admin, Barber")]
    public async Task<ActionResult<Barber>> PostBarber(Barber barber)
    {
        try
        {
            // Check if a barber with the same username and name already exists
            var existingBarber = await _barberRepository.FindByUsername(barber.UserName);
            if (existingBarber != null) { return BadRequest(new { message = "A barber with this username already exists" }); }
            if (barber.Name.Length < 4 || barber.Name.Length > 20) { return BadRequest(new { message = "A barber name must be between 4 - 20 characters" }); }

            var existingBarber2 = await _barberRepository.FindByBarberName(barber.Name);
            if (existingBarber2 != null) { return BadRequest(new { message = "A barber with this name already exists" }); }

            // Check if the user exists in the system
            var user = await _userManager.FindByNameAsync(barber.UserName);
            if (user == null) { return BadRequest(new { message = "No user found with the specified username" }); }

            // Admin account cannot become a barber
            if (user.UserName == "admin") { return BadRequest(new { message = "Cannot update the admin account" }); }

            await _barberRepository.Add(barber);

            // Update the user's role to "Barber"
            var role = "Barber";
            if (!await _roleManager.RoleExistsAsync(role))
            {
                // Rollback if the role does not exist
                await _barberRepository.Delete(barber.Id);
                return BadRequest(new { message = "Role does not exist" });
            }

            // Check if the user is already in the Barber role
            if (await _userManager.IsInRoleAsync(user, role))
            {
                // Rollback if the user is already in the role
                await _barberRepository.Delete(barber.Id);
                return BadRequest(new { message = "User is already in the Barber role" });
            }

            // Remove the user from all current roles
            var currentRoles = await _userManager.GetRolesAsync(user);
            if (currentRoles.Count > 0)
            {
                var removeRolesResult = await _userManager.RemoveFromRolesAsync(user, currentRoles);
                if (!removeRolesResult.Succeeded)
                {
                    // Rollback if removing the roles fails
                    await _barberRepository.Delete(barber.Id);
                    return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Error removing user from current roles" });
                }
            }

            // Add the user to the "Barber" role
            var addRoleResult = await _userManager.AddToRoleAsync(user, role);
            if (!addRoleResult.Succeeded)
            {
                // Rollback if adding the role fails
                await _barberRepository.Delete(barber.Id);
                return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Error adding user to Barber role" });
            }

            return CreatedAtAction("GetBarber", new { id = barber.Id }, barber);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An error occurred whilst adding a new barber");
            return BadRequest(new { message = "An error occurred whilst adding a new barber" });
        }
    }


    // PUT

    // Updates a barber 
    [HttpPut("{id}")]
    public async Task<IActionResult> PutBarber(int id, Barber barber)
    {
        if (id != barber.Id) { return BadRequest(new { message = "Invalid barber ID" }); }

        try
        {
            // Fetch barbers with the same name but different ID
            var barbersWithSameName = await _barberRepository.GetByName(barber.Name);
            if (barbersWithSameName.Any(b => b.Id != id)) { return BadRequest(new { message = "This barber name exists" }); }
            if (barber.Name.Length < 4 || barber.Name.Length > 20) { return BadRequest(new { message = "A barber name must be between 4 - 20 characters" }); }
            await _barberRepository.Update(barber);
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"An error occurred whilst updating barber with id {id}");
            return BadRequest(new { message = "An error occurred whilst updating barber" });
        }
    }

    // DELETE

    // Deletes a barber by its id and reverts their role to 'User'
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteBarber(int id)
    {
        try
        {
            var barber = await _barberRepository.GetById(id);
            if (barber == null) { return NotFound(new { message = "Barber not found" }); }

            var user = await _userManager.FindByNameAsync(barber.UserName);
            if (user == null) { return BadRequest(new { message = "No user associated with this barber found" }); }

            // Remove the barber role and assign the user role
            var currentRoles = await _userManager.GetRolesAsync(user);
            if (currentRoles.Contains("Barber"))
            {
                // Remove the 'Barber' role
                var removeRoleResult = await _userManager.RemoveFromRoleAsync(user, "Barber");
                if (!removeRoleResult.Succeeded)
                {
                    _logger.LogError($"Failed to remove 'Barber' role from user {user.UserName}");
                    return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Failed to remove Barber role from user" });
                }

                // Add the 'User' role
                var addRoleResult = await _userManager.AddToRoleAsync(user, "User");
                if (!addRoleResult.Succeeded)
                {
                    // If adding the 'User' role fails, rollback and reassign the 'Barber' role
                    await _userManager.AddToRoleAsync(user, "Barber");
                    _logger.LogError($"Failed to add 'User' role to user {user.UserName}, reverted to 'Barber'");
                    return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Failed to revert role to User, kept as Barber" });
                }
            }

            await _barberRepository.Delete(id);
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"An error occurred whilst deleting barber with id {id}");
            return BadRequest(new { message = "An error occurred whilst deleting barber" });
        }
    }

}
