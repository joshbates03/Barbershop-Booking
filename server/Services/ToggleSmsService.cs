using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace BarberShopTemplate.Services
{
    public class ToggleSmsService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<ToggleSmsService> _logger;
        public bool IsSmsEnabled { get; private set; }

        public ToggleSmsService(IConfiguration configuration, ILogger<ToggleSmsService> logger)
        {
            _configuration = configuration;
            _logger = logger;
            IsSmsEnabled = false;     
        }

        public bool ToggleSms()
        {       
            IsSmsEnabled = !IsSmsEnabled;
            return IsSmsEnabled;
        }

        public bool GetStatus()
        {  
            return IsSmsEnabled;
        }
    }
}
