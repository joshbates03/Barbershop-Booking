using BarberShopTemplate.Models;
using BarberShopTemplate.Repositories;
using BarberShopTemplate.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;

namespace BarberShopTemplate.Controllers
{
   
    [Route("api/[controller]")]
    public class PriceListController : Controller
    {
        private readonly IPriceListRepository _priceListRepository;
        private ILogger<PriceListController> _logger;

        public PriceListController(IPriceListRepository priceListRepository, ILogger<PriceListController> logger)
        {
            _priceListRepository = priceListRepository;
            _logger = logger;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Barber>>> GetPriceList()
        {
            try
            {
                var pricelist = await _priceListRepository.GetAll();
                return Ok(pricelist);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred whilst fetching pricelist");
                return BadRequest(new { message = "An error occurred whilst fetching pricelist" });
            }
        }
        [Authorize(Roles = "Admin")]
        [HttpPut]
        public async Task<IActionResult> PutPriceList([FromBody] List<PriceList> priceList)
        {
            try
            {
                await _priceListRepository.UpdatePriceListAsync(priceList);
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred whilst updating the price list");
                return BadRequest(new { message = "An error occurred whilst updating the price list" });
            }
        }

    }
}
