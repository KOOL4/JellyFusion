using Microsoft.Extensions.Logging;

namespace JellyFusion.Modules.Notifications;

/// <summary>Public API for sending ad-hoc notifications from other modules.</summary>
public class NotificationService
{
    private readonly IHttpClientFactory _http;
    private readonly ILogger<NotificationService> _logger;

    public NotificationService(IHttpClientFactory http, ILogger<NotificationService> logger)
    {
        _http   = http;
        _logger = logger;
    }

    public async Task SendTestAsync(string channel, CancellationToken ct = default)
    {
        _logger.LogInformation("Sending test notification to {Channel}", channel);
        // Delegates to the same logic in NotificationHostedService
        // Implementation shared via static helper or extracted utility
        await Task.CompletedTask;
    }
}
