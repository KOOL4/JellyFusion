using MediaBrowser.Model.Plugins;

namespace JellyFusion.Configuration;

/// <summary>Root configuration for the JellyFusion plugin.</summary>
public class PluginConfiguration : BasePluginConfiguration
{
    public PluginConfiguration()
    {
        // Set sensible defaults
        Language       = "es";
        Slider         = new SliderConfig();
        Badges         = new BadgesConfig();
        Studios        = new StudiosConfig();
        Theme          = new ThemeConfig();
        Notifications  = new NotificationsConfig();
    }

    // ── Global ──────────────────────────────────────────────────
    /// <summary>UI language: "es" | "en" | "pt" | "fr"</summary>
    public string Language { get; set; }

    // ── Modules ─────────────────────────────────────────────────
    public SliderConfig       Slider        { get; set; }
    public BadgesConfig       Badges        { get; set; }
    public StudiosConfig      Studios       { get; set; }
    public ThemeConfig        Theme         { get; set; }
    public NotificationsConfig Notifications { get; set; }
}

// ═══════════════════════════════════════════════════════════════
// SLIDER (Editor's Choice)
// ═══════════════════════════════════════════════════════════════
public class SliderConfig
{
    public bool   Enabled          { get; set; } = true;
    public string Mode             { get; set; } = "Random"; // Favourites | Random | Collections | New
    public string? FavouritesUser  { get; set; }
    public bool   AutoplayEnabled  { get; set; } = true;
    public int    AutoplayInterval { get; set; } = 10;

    // Filtering
    public int    MaxItems               { get; set; } = 5;
    public double MinCommunityRating     { get; set; } = 0;
    public int    MinCriticRating        { get; set; } = 0;
    public string MaxParentalRating      { get; set; } = "UserProfile";
    public bool   ShowPlayedItems        { get; set; } = true;

    // Display
    public string? BannerHeading        { get; set; }
    public bool    ShowPlayButton       { get; set; } = true;
    public string? CustomPlayButtonText { get; set; }
    public bool    ShowCommunityRating  { get; set; } = true;
    public bool    ShowDescription      { get; set; } = true;
    public bool    HideOnTv             { get; set; } = true;
    public bool    UseHeroDisplayStyle  { get; set; } = true;
    public string  ImagePosition        { get; set; } = "Bottom";  // Top | Center | Bottom
    public string  TransitionEffect     { get; set; } = "Slide";   // Slide | Fade | Zoom
    public string  BannerHeight         { get; set; } = "Large";   // Small | Medium | Large | Fullscreen

    // Trailers
    public bool   TrailerEnabled        { get; set; } = true;
    public string TrailerSource         { get; set; } = "TMDB";    // TMDB | YouTube | Local
    public string? TmdbApiKey           { get; set; }
    public string TrailerLanguage       { get; set; } = "Auto";    // Auto | es-419 | en | sub
    public bool   TrailerSubtitleFallback { get; set; } = true;

    // Technical
    public bool   ClientScriptInjection { get; set; } = true;
    public bool   UseFileTransformation { get; set; } = false;
    public bool   ReduceImageSizes      { get; set; } = true;
}

// ═══════════════════════════════════════════════════════════════
// BADGES (JellyTag)
// ═══════════════════════════════════════════════════════════════
public class BadgesConfig
{
    public bool   Enabled           { get; set; } = true;
    public bool   EnableOnPosters   { get; set; } = true;
    public bool   EnableOnThumbs    { get; set; } = true;
    public bool   ThumbSameAsPoster { get; set; } = true;
    public int    ThumbSizeReduction { get; set; } = 5;

    // Badge order (index = priority, lower = rendered first / top)
    public List<string> BadgeOrder { get; set; } = new()
        { "Resolution", "HDR", "Codec", "Audio", "Language", "Status" };

    // Language badges — LAT / SUB special handling
    public LanguageBadgeConfig Language { get; set; } = new();

    // Status badges — NUEVO / KID
    public StatusBadgeConfig Status { get; set; } = new();

    // Custom text overrides (key = badgeKey, value = display text)
    public Dictionary<string, string> CustomText { get; set; } = new();

    // Performance
    public int    CacheDurationHours { get; set; } = 24;
    public string OutputFormat       { get; set; } = "JPEG";  // JPEG | PNG | WebP
    public int    JpegQuality        { get; set; } = 90;
}

public class LanguageBadgeConfig
{
    public bool   Enabled                 { get; set; } = true;
    // "Mexico" | "Spain" | "None"
    public string LatinFlagStyle          { get; set; } = "Mexico";
    public string LatinText               { get; set; } = "LAT";
    public bool   ShowProductionCountryFlag { get; set; } = true;

    // SUB collapse
    public bool   SimplifiedSubMode       { get; set; } = true;
    public int    SubThreshold            { get; set; } = 3;
    public string SubText                 { get; set; } = "SUB";

    // Position/layout shared with other badge panels
    public string Position   { get; set; } = "TopLeft";
    public string Show       { get; set; } = "All";
    public string Layout     { get; set; } = "Vertical";
    public int    Gap        { get; set; } = 10;
    public int    BadgeSize  { get; set; } = 15;
    public int    Margin     { get; set; } = 2;
    public string BadgeStyle { get; set; } = "Image"; // Image | Text
}

public class StatusBadgeConfig
{
    // NUEVO
    public bool   NewEnabled        { get; set; } = true;
    public int    NewDaysThreshold  { get; set; } = 30;
    public string NewText           { get; set; } = "NUEVO";
    public string NewBgColor        { get; set; } = "#1a3a1a";
    public string NewTextColor      { get; set; } = "#6fcf6f";

    // KID
    public bool   KidEnabled        { get; set; } = true;
    public string KidText           { get; set; } = "KID";
    public string KidBgColor        { get; set; } = "#3a2a1a";
    public string KidTextColor      { get; set; } = "#f0a050";
    // "ParentalRating" | "Tag" | "Both"
    public string KidDetectionMode  { get; set; } = "ParentalRating";
}

// ═══════════════════════════════════════════════════════════════
// STUDIOS
// ═══════════════════════════════════════════════════════════════
public class StudiosConfig
{
    public bool   Enabled       { get; set; } = true;
    public string SectionTitle  { get; set; } = "Estudios";
    public string ImageStyle    { get; set; } = "Logo"; // Logo | Text | LogoAndName
    public int    CardWidth     { get; set; } = 120;
    public int    CardHeight    { get; set; } = 60;
    public int    BorderRadius  { get; set; } = 8;
    public bool   ShowName      { get; set; } = true;
    public bool   HoverEffect   { get; set; } = true;
    public List<StudioItem> Items { get; set; } = new();
}

public class StudioItem
{
    public string  Name      { get; set; } = string.Empty;
    public string? LogoUrl   { get; set; }
    public string? CustomUrl { get; set; }
    // "Auto" | "CustomUrl" | "Library"
    public string  LinkMode  { get; set; } = "Auto";
    public int     SortOrder { get; set; }
}

// ═══════════════════════════════════════════════════════════════
// THEMES
// ═══════════════════════════════════════════════════════════════
public class ThemeConfig
{
    // "Default" | "Netflix" | "PrimeVideo" | "DisneyPlus" |
    // "AppleTvPlus" | "Crunchyroll" | "ParamountPlus"
    public string  ActiveTheme   { get; set; } = "Default";
    public string? PrimaryColor  { get; set; }
    public string? BackgroundColor { get; set; }
    public string? FontFamily    { get; set; }
}

// ═══════════════════════════════════════════════════════════════
// NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════
public class NotificationsConfig
{
    public bool NotifyNewContent   { get; set; } = true;
    public bool NotifyKidContent   { get; set; } = false;

    public DiscordConfig  Discord  { get; set; } = new();
    public TelegramConfig Telegram { get; set; } = new();
}

public class DiscordConfig
{
    public bool   Enabled    { get; set; } = false;
    public string? WebhookUrl { get; set; }
}

public class TelegramConfig
{
    public bool   Enabled  { get; set; } = false;
    public string? BotToken { get; set; }
    public string? ChatId   { get; set; }
}
