using System.Collections.Generic;
using System.Threading.Tasks;
using BarberShopTemplate.Models;
using BarberShopTemplate.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BarberShopTemplate.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class SpecialScheduleController : ControllerBase
    {
        private readonly ISpecialScheduleRepository _specialScheduleRepository;
        private readonly ILogger<AppointmentsController> _logger;

        public SpecialScheduleController(ISpecialScheduleRepository specialScheduleRepository, ILogger<AppointmentsController> logger)
        {
            _specialScheduleRepository = specialScheduleRepository;
            _logger = logger;
        }


        // GET
        
        // Gets all special schedules
        [HttpGet]
        public async Task<ActionResult<IEnumerable<SpecialSchedule>>> GetSpecialSchedules()
        {
            try
            {
                var schedules = await _specialScheduleRepository.GetAll();
                return Ok(schedules);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to fetch special schedules");
                return BadRequest(new { message = "An error occurred whilst fetching special schedules" });
            }
        }

        // Gets a special schedule by its id
        [HttpGet("{id}")]
        public async Task<ActionResult<SpecialSchedule>> GetSpecialSchedule(int id)
        {
            try
            {
                var schedule = await _specialScheduleRepository.GetById(id);
                return Ok(schedule);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to fetch special schedule by its id");
                return BadRequest(new { message = "An error occurred whilst fetching special schedule" });
            }
        }


        // POST

        // Adds a special schedule
        [HttpPost]
        public async Task<ActionResult<SpecialSchedule>> PostSpecialSchedule(SpecialSchedule schedule)
        {
            if (schedule.StartDate > schedule.EndDate) { return BadRequest(new { message = "Start date cannot be greater than end date" }); }
            try
            {
                var overlappingSchedule = await _specialScheduleRepository.GetOverlappingSchedule(schedule.BarberId, schedule.StartDate, schedule.EndDate);
                if (overlappingSchedule != null) { return BadRequest(new { message = $"The special schedule overlaps with an existing schedule from {overlappingSchedule.StartDate} to {overlappingSchedule.EndDate}" }); }
                await _specialScheduleRepository.Add(schedule);
                return CreatedAtAction(nameof(GetSpecialSchedule), new { id = schedule.Id }, schedule);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while adding a special schedule");
                return BadRequest(new { message = "An error occurred while adding a special schedule" });
            }
        }


        // PUT

        // Updates a special schedule
        [HttpPut("{id}")]
        public async Task<IActionResult> PutSpecialSchedule(int id, SpecialSchedule schedule)
        {
            if (id != schedule.Id) { return BadRequest(); }

            var overlappingSchedule = await _specialScheduleRepository.GetOverlappingSchedule(schedule.BarberId, schedule.StartDate, schedule.EndDate);
            if (overlappingSchedule != null) { return BadRequest(new { message = $"The special schedule overlaps with an existing schedule from {overlappingSchedule.StartDate} to {overlappingSchedule.EndDate}" }); }

            try
            {
                await _specialScheduleRepository.Update(schedule);
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to update special schedule");
                return BadRequest(new { message = "An error occurred whilst updating the special schedule" });
            }
        }


        // DELETE

        // Deletes a special schedule
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteSpecialSchedule(int id)
        {
            var schedule = await _specialScheduleRepository.GetById(id);
            if (schedule == null) { return NotFound(new { message = "Special schedule not found" }); }

            try
            {
                await _specialScheduleRepository.Delete(id);
                return Ok(new { message = "Special schedule deleted successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to delete special schedule");
                return BadRequest(new { message = "An error occurred whilst deleting the special schedule" });
            }
        }

    }
}
