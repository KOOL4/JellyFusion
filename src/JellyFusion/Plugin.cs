using System.Reflection;
using JellyFusion.Configuration;
using MediaBrowser.Common.Configuration;
using MediaBrowser.Common.Plugins;
using MediaBrowser.Model.Plugins;
using MediaBrowser.Model.Serialization;
using Microsoft.Extensions.Logging;

namespace JellyFusion;

/// <summary>
/// JellyFusion — All-in-one Jellyfin enhancement plugin.
/// Combines Editor's Choice slider, JellyTag badges, Studios section,
/// Theme switcher and Notifications into a single unified plugin.
/// </summary>
public class Plugin : BasePlugin<PluginConfiguration>, IHasWebPages
{
    private readonly ILogger<Plugin> _logger;

    public Plugin(
        IApplicationPaths applicationPaths,
        IXmlSerializer xmlSerializer,
        ILogger<Plugin> logger)
        : base(applicationPaths, xmlSerializer)
    {
        _logger = logger;
        Instance = this;
        _logger.LogInformation("JellyFusion v{Version} loaded", Version);
    }

    /// <inheritdoc />
    public override string Name => "JellyFusion";

    /// <inheritdoc />
    public override Guid Id => Guid.Parse("a1b2c3d4-e5f6-7890-abcd-ef1234567890");

    /// <inheritdoc />
    public override string Description =>
        "All-in-one Jellyfin plugin: Netflix-style slider with trailers, " +
        "quality badges (4K/HDR/LAT/SUB/NUEVO/KID), studios section, " +
        "theme switcher and notifications.";

    /// <summary>Global singleton instance.</summary>
    public static Plugin? Instance { get; private set; }

    /// <inheritdoc />
    public IEnumerable<PluginPageInfo> GetPages()
    {
        var prefix = GetType().Namespace + ".Web.";
        return new[]
        {
            new PluginPageInfo
            {
                Name        = Name,
                EmbeddedResourcePath = prefix + "index.html",
                EnableInMainMenu     = true
            },
            new PluginPageInfo
            {
                Name        = Name + " (script)",
                EmbeddedResourcePath = prefix + "js" + ".main.js"
            }
        };
    }
}
