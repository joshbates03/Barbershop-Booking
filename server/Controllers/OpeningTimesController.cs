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
    public class OpeningTimesController : Controller
    {
        private readonly IOpeningTimesRepository _openingTimesRepository;
        private readonly ILogger<OpeningTimesController> _logger;

        public OpeningTimesController(IOpeningTimesRepository openingTimesRepository, ILogger<OpeningTimesController> logger)
        {
            _openingTimesRepository = openingTimesRepository;
            _logger = logger;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<OpeningTimes>>> GetOpeningTimes()
        {
            try
            {
                var openingTimes = await _openingTimesRepository.GetAll();
                return Ok(openingTimes);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred whilst fetching opening times");
                return BadRequest(new { message = "An error occurred whilst fetching opening times" });
            }
        }

        [Authorize(Roles = "Admin")]
        [HttpPut]
        public async Task<IActionResult> PutOpeningTimes([FromBody] List<OpeningTimes> openingTimes)
        {
            try
            {
                await _openingTimesRepository.UpdateOpeningTimesAsync(openingTimes);
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred whilst updating the opening times");
                return BadRequest(new { message = "An error occurred whilst updating the opening times" });
            }
        }
    }
}
