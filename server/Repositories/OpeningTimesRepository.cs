using BarberShopTemplate.Data;
using BarberShopTemplate.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace BarberShopTemplate.Repositories
{
    public class OpeningTimesRepository : Repository<OpeningTimes>, IOpeningTimesRepository
    {
        public OpeningTimesRepository(BarberShopContext context) : base(context)
        {
        }

        // Updates opening times
        public async Task UpdateOpeningTimesAsync(IEnumerable<OpeningTimes> openingTimes)
        {
            if (openingTimes == null) { throw new ArgumentNullException(nameof(openingTimes)); }

            var existingOpeningTimes = await _context.OpeningTimes.ToListAsync();

            foreach (var item in openingTimes)
            {
                var existingItem = existingOpeningTimes.FirstOrDefault(p => p.Id == item.Id);

                if (existingItem != null)
                {
                    existingItem.Day = item.Day;
                    existingItem.OpeningTime = item.OpeningTime;
                }
                else
                {
                    _context.OpeningTimes.Add(item);
                }
            }

            var updatedIds = openingTimes.Select(p => p.Id).ToList();
            var itemsToRemove = existingOpeningTimes.Where(p => !updatedIds.Contains(p.Id)).ToList();
            _context.OpeningTimes.RemoveRange(itemsToRemove);
            await _context.SaveChangesAsync();
        }
    }
}
