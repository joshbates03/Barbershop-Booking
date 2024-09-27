using BarberShopTemplate.Models;
using BarberShopTemplate.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace BarberShopTemplate.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin, Barber")]
    public class ScheduleController : ControllerBase
    {
        private readonly IScheduleRepository _scheduleRepository;
        private readonly ILogger<AppointmentsController> _logger;

        public ScheduleController(IScheduleRepository scheduleRepository, ILogger<AppointmentsController> logger)
        {
            _scheduleRepository = scheduleRepository;
            _logger = logger;
        }

        // GET

        // Gets all schedules 
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Schedule>>> GetSchedules()
        {
            try
            {
                var schedules = await _scheduleRepository.GetAll();
                return Ok(schedules);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to fetch schedules");
                return BadRequest(new { message = "An error occurred whilst fetching schedules" });
            }
        }

        // Gets a schedule by its id
        [HttpGet("{id}")]
        public async Task<ActionResult<Schedule>> GetSchedule(int id)
        {
            try
            {
                var schedule = await _scheduleRepository.GetById(id);
                return Ok(schedule);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to fetch schedules");
                return BadRequest(new { message = "An error occurred whilst fetching schedules" });
            }
        }


        // POST 

        // Adds a schedule
        [HttpPost]
        public async Task<ActionResult<Schedule>> PostSchedule([FromBody] Schedule schedule)
        {
            try
            {
                // Validation checks
                if (string.IsNullOrWhiteSpace(schedule.Day)) { return BadRequest(new { message = "Day is required" }); }

                if (schedule.BarberId <= 0) { return BadRequest(new { message = "Valid Barber ID is required" }); }

                if (schedule.StartDate == default(DateOnly)) { return BadRequest(new { message = "Start date is required" }); }

                if (schedule.StartDate < DateOnly.FromDateTime(DateTime.Today)) { return BadRequest(new { message = "Start date cannot be earlier than today" }); }

                // Check if the Day matches the StartDate
                var startDayOfWeek = schedule.StartDate.ToDateTime(new TimeOnly(0, 0)).DayOfWeek.ToString();
                if (!string.Equals(schedule.Day, startDayOfWeek, StringComparison.OrdinalIgnoreCase)) { return BadRequest(new { message = "The start date does not match the specified day" }); }

                if (schedule.EndDate != null)
                {
                    if (schedule.EndDate < schedule.StartDate) { return BadRequest(new { message = "End date cannot be earlier than the start date" }); }

                    // Check if the Day matches the EndDate
                    var endDayOfWeek = schedule.EndDate.Value.ToDateTime(new TimeOnly(0, 0)).DayOfWeek.ToString();
                    if (!string.Equals(schedule.Day, endDayOfWeek, StringComparison.OrdinalIgnoreCase)) { return BadRequest(new { message = "The end date does not match the specified day" }); }
                }

                if (schedule.EndDate == null)
                {
                    var openEndedSchedule = await _scheduleRepository.GetOpenEndedScheduleByDayAsync(schedule.BarberId, schedule.Day);
                    if (openEndedSchedule != null)
                    {
                        // Check for overlap and adjust the existing open-ended schedule
                        if (schedule.StartDate < openEndedSchedule.StartDate)
                        {
                            return BadRequest(new { message = "Cannot start this schedule before an existing open-ended schedule" });
                        }

                        // Close the existing open-ended schedule
                        openEndedSchedule.EndDate = schedule.StartDate;
                        await _scheduleRepository.Update(openEndedSchedule);
                    }
                }
                else
                {
                    var overlappingSchedule = await _scheduleRepository.GetOverlappingScheduleAsync(
                        schedule.BarberId, schedule.Day, schedule.StartDate, schedule.EndDate);

                    if (overlappingSchedule != null) { return BadRequest(new { message = $"The schedule overlaps with an existing schedule from {overlappingSchedule.StartDate} to {overlappingSchedule.EndDate}" }); }
                }

                await _scheduleRepository.Add(schedule);

                return CreatedAtAction(nameof(GetSchedule), new { id = schedule.Id }, schedule);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to add schedule");
                return BadRequest(new { message = "An error occurred whilst adding the schedule" });
            }
        }


        // PUT

        // Updates a schedule
        [HttpPut("{id}")]
        public async Task<IActionResult> PutSchedule(int id, [FromBody] Schedule schedule)
        {
            if (id != schedule.Id) { return BadRequest(new { message = "The schedule to update doesn't match the provided schedule" }); }

            if (schedule.EndDate < schedule.StartDate) { return BadRequest(new { message = "End date cannot be earlier than the start date" }); }

            if (schedule.EndDate == null)
            {
                var openEndedSchedule = await _scheduleRepository.GetOpenEndedScheduleByDayAsync(schedule.BarberId, schedule.Day);
                if (openEndedSchedule != null && openEndedSchedule.Id != id) { return BadRequest(new { message = "An open-ended schedule already exists for this day" }); }
            }
            else
            {
                var today = DateOnly.FromDateTime(DateTime.Today);
                if (schedule.EndDate < today)
                {
                    // Pass
                }

                var overlappingSchedule = await _scheduleRepository.GetOverlappingScheduleAsync(
                    schedule.BarberId, schedule.Day, schedule.StartDate, schedule.EndDate, id);

                if (overlappingSchedule != null) { return BadRequest(new { message = "The updated schedule overlaps with an existing schedule" }); }
            }

            try
            {
                await _scheduleRepository.Update(schedule);
                return Ok();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to update schedule");
                return BadRequest(new { message = "An error occurred whilst updating the schedule" });
            }
        }


        // DELETE

        // Deletes a schedule
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteSchedule(int id)
        {
            var schedule = await _scheduleRepository.GetById(id);
            if (schedule == null) { return NotFound(new { message = "Schedule not found" }); }

            try
            {
                await _scheduleRepository.Delete(id);
                return Ok(new { message = "Schedule deleted successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to delete schedule");
                return BadRequest(new { message = "An error occurred whilst deleting the schedule" });
            }
        }

    }
}
