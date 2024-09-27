using Microsoft.AspNetCore.Mvc;

namespace BarberShopTemplate.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class WebhookController : ControllerBase
    {
        [HttpPost]
        public IActionResult Post([FromBody] dynamic data)
        {
            Console.WriteLine($"Received message: {data}");
            return Ok();
        }
    }
}