using BarberShopTemplate.Data;
using BarberShopTemplate.Models;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace BarberShopTemplate.Repositories
{
    public class PriceListRepository : Repository<PriceList>, IPriceListRepository
    {
        public PriceListRepository(BarberShopContext context) : base(context)
        {
        }

        // Updates price list
        public async Task UpdatePriceListAsync(IEnumerable<PriceList> priceList)
        {
            if (priceList == null) { throw new ArgumentNullException(nameof(priceList)); }

            var existingPriceList = await _context.PriceList.ToListAsync();

            foreach (var item in priceList)
            {
                var existingItem = existingPriceList.FirstOrDefault(p => p.Id == item.Id);

                if (existingItem != null)
                {
                    existingItem.Cut = item.Cut;
                    existingItem.Price = item.Price;
                }
                else
                {
                    _context.PriceList.Add(item);
                }
            }

            var updatedIds = priceList.Select(p => p.Id).ToList();
            var itemsToRemove = existingPriceList.Where(p => !updatedIds.Contains(p.Id)).ToList();
            _context.PriceList.RemoveRange(itemsToRemove);
            await _context.SaveChangesAsync();
        }

    }
}
