using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

public class TelnyxMessagingService
{
    private readonly HttpClient _httpClient;
    private readonly string _apiKey;
    private readonly ILogger<TelnyxMessagingService> _logger;

    public TelnyxMessagingService(string apiKey, ILogger<TelnyxMessagingService> logger)
    {
        _httpClient = new HttpClient();
        _apiKey = apiKey;
        _logger = logger;
        _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _apiKey);
    }

    public async Task SendMessage(string messagingProfileId, string to, string text, string webhookUrl, string webhookFailoverUrl)
    {
        var payload = new
        {
            messaging_profile_id = messagingProfileId,
            to = new[] { to },
            text = text,
            webhook_url = webhookUrl,
            webhook_failover_url = webhookFailoverUrl,
            use_profile_webhooks = true,
            type = "SMS"
        };

        var content = new StringContent(JsonConvert.SerializeObject(payload), Encoding.UTF8, "application/json");
        var response = await _httpClient.PostAsync("https://api.telnyx.com/v2/messages", content);
        var responseContent = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
        {
            throw new Exception($"Failed to send message: {responseContent}");
        }
        else
        {
            Console.WriteLine($"Message sent successfully. Response: {responseContent}");
        }
    }

    public async Task<decimal> GetBalance()
    {
        var response = await _httpClient.GetAsync("https://api.telnyx.com/v2/balance");
        var responseContent = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode) { throw new Exception($"Failed to retrieve balance: {responseContent}"); }

        try
        {
            var jsonResponse = JObject.Parse(responseContent);
            var balance = jsonResponse["data"]["balance"].Value<decimal>();
            return balance;
        }
        catch (Exception ex)
        {
            throw;
        }
    }

}
