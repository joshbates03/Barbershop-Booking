using BarberShopTemplate.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;

namespace BarberShopTemplate.Controllers
{
    [Authorize(Roles = "Admin")]
    [Route("api/[controller]")]
    public class MiscellaneousController : Controller
    {
        private readonly ToggleSmsService _toggleSmsService;
        private readonly TelnyxMessagingService _telnyxMessagingService;

        public MiscellaneousController(ToggleSmsService toggleSmsService, TelnyxMessagingService telnyxMessagingService)
        {
            _toggleSmsService = toggleSmsService;
            _telnyxMessagingService = telnyxMessagingService;
        }

        [HttpPost("ToggleSms")]
        public IActionResult ToggleSms()
        {
            try
            {
                bool isSmsEnabled = _toggleSmsService.ToggleSms();
                return Ok(new { isSmsEnabled });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while toggling SMS status" });
            }
        }

        [HttpGet("GetSmsStatus")]
        public IActionResult GetSmsStatus()
        {
            try
            {
                bool isSmsEnabled = _toggleSmsService.GetStatus();
                return Ok(new { isSmsEnabled });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while fetching SMS status" });
            }
        }

        [HttpGet("GetSmsBalance")]
        public async Task<IActionResult> GetSmsBalance()
        {
            try
            {
                decimal balance = await _telnyxMessagingService.GetBalance();
                return Ok(new { balance });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while fetching SMS balance" });
            }
        }
    }
}
