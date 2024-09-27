using BarberShopTemplate.Models;
using BarberShopTemplate.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace BarberShopTemplate.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class UserActivityController : ControllerBase
    {
        private readonly IUserActivityRepository _userActivityRepository;
        private readonly ILogger<UserActivityController> _logger;

        public UserActivityController(IUserActivityRepository userActivityRepository, ILogger<UserActivityController> logger)
        {
            _userActivityRepository = userActivityRepository;
            _logger = logger;
        }

        // GET

        [HttpGet("GetActivities")]
        public async Task<ActionResult<IEnumerable<UserActivity>>> GetActivities()
        {
            try
            {
                var activities = await _userActivityRepository.GetAll();
                return Ok(activities);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred whilst fetching activities");
                return BadRequest(new { message = "An error occurred whilst fetching activities" });
            }
        }

        [Authorize(Roles = "Admin, Barber")]
        [HttpGet("Notiflications")]
        public async Task<ActionResult<IEnumerable<UserActivity>>> GetNotiflications()
        {
            try
            {
                var activities = await _userActivityRepository.GetBookingRelatedActivities();
                return Ok(activities);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred whilst fetching activities");
                return BadRequest(new { message = "An error occurred whilst fetching activities" });
            }
        }
    }
}
