using BarberShopTemplate.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace BarberShopTemplate.Repositories
{
    public interface IOpeningTimesRepository : IRepository<OpeningTimes>
    {
        Task UpdateOpeningTimesAsync(IEnumerable<OpeningTimes> openingTimes);
    }
}
