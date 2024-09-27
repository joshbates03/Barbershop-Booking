using BarberShopTemplate.Models;

namespace BarberShopTemplate.Repositories
{
    public interface IPriceListRepository : IRepository<PriceList>
    {
        Task UpdatePriceListAsync(IEnumerable<PriceList> priceList);
    }
}
