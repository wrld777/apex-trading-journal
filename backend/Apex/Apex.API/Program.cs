using Apex.Domain.AutoMapperProfile;
using Apex.Domain.Contracts;
using Apex.Domain.Entities;
using Apex.Domain.Repositories;
using Apex.Domain.Services;
using Apex.Domain.Validators;
using Apex.Infrastructure.DbContext;
using Apex.Infrastructure.Email;
using Apex.Infrastructure.Repositories;
using FluentValidation;
using FluentValidation.AspNetCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// In produzione l'app gira come **servizio di Windows**: parte con la macchina,
// prima ancora che qualcuno faccia login. Fuori da un servizio la chiamata è
// innocua, quindi non serve un ramo per ambiente.
builder.Host.UseWindowsService();

// CORS serve **solo in sviluppo**, dove Vite sta su una porta diversa. In
// produzione è questa stessa applicazione a servire il frontend: l'origine è
// una sola e il browser non ha niente da chiedere.
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://127.0.0.1:5173")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(
            new System.Text.Json.Serialization.JsonStringEnumConverter());
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// FluentValidation
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddValidatorsFromAssemblyContaining<CreateTradeRequestValidator>();

// Repository
builder.Services.AddScoped<ITradeRepository, TradeRepository>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IStrategyRepository, StrategyRepository>();
builder.Services.AddScoped<IInstrumentRepository, InstrumentRepository>();
builder.Services.AddScoped<IPasswordResetTokenRepository, PasswordResetTokenRepository>();

// Service
builder.Services.AddScoped<ITradeService, TradeService>();
builder.Services.AddScoped<IInstrumentService, InstrumentService>();
builder.Services.AddScoped<IStrategyService, StrategyService>();
builder.Services.AddScoped<IStatsService, StatsService>();
builder.Services.AddScoped<IAnalyticsService, AnalyticsService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IManageTokenService, ManageTokenService>();
builder.Services.AddScoped<IEmailSender, SmtpEmailSender>();

// AutoMapper
builder.Services.AddAutoMapper(cfg =>
{
    cfg.AddProfile<TradeProfile>();
    cfg.AddProfile<UserProfile>();
    cfg.AddProfile<InstrumentProfile>();
    cfg.AddProfile<StrategyProfile>();
});

// Email — come JwtSettings: l'oggetto è iniettato direttamente, non via IOptions.
// Senza la sezione in appsettings si parte con Enabled = false, cioè le email
// finiscono nel log invece che in rete: è ciò che serve in sviluppo.
builder.Services.AddSingleton(
    builder.Configuration.GetSection("Email").Get<EmailSettings>() ?? new EmailSettings());

// Database
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// JWT
builder.Services.Configure<JwtSettings>(
    builder.Configuration.GetSection("JwtSettings"));

// ManageTokenService consuma JwtSettings direttamente (non via IOptions)
builder.Services.AddSingleton(
    builder.Configuration.GetSection("JwtSettings").Get<JwtSettings>()!);

var jwtSettings = builder.Configuration.GetSection("JwtSettings");
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtSettings["Issuer"],
            ValidAudience = jwtSettings["Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtSettings["Secret"]!))
        };
    });

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

if (app.Environment.IsDevelopment())
{
    app.UseCors("AllowFrontend");
    // Il dirottamento su HTTPS vale solo qui. In produzione l'app risponde in
    // chiaro su una rete privata (Tailscale), dove il traffico è già cifrato da
    // WireGuard: un redirect verso una porta HTTPS che non esiste renderebbe
    // l'app irraggiungibile, e sarebbe il modo più stupido di rompere il deploy.
    app.UseHttpsRedirection();
}

app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// ── Il frontend, servito da qui ──────────────────────────────────────────────
// La build di Vite viene copiata in wwwroot dallo script di pubblicazione.
// Un processo solo invece di due: niente CORS, niente seconda porta da aprire,
// niente reverse proxy da configurare. Per un'installazione a utente singolo è
// tutto quello che serve.
// `MapStaticAssets` e non `UseStaticFiles`: dalla pubblicazione .NET descrive i
// file di wwwroot in un manifesto (`*.staticwebassets.endpoints.json`) con tanto
// di varianti compresse e impronte per la cache. Il vecchio middleware guarda
// solo il disco e, in output pubblicato, non serviva **niente** — ogni richiesta
// finiva nel fallback e il browser riceveva l'HTML della pagina al posto del
// JavaScript, con una schermata bianca e nessun errore in console.
app.MapStaticAssets();

// Un endpoint `/api/...` che non esiste deve rispondere 404, non la pagina.
// Va dichiarato **prima** del fallback e come catch-all: fra gli endpoint veri
// il catch-all è quello a priorità più bassa, quindi i controller continuano a
// vincere, ma batte comunque il fallback. Senza, un indirizzo sbagliato tornava
// 200 con dell'HTML, il client provava a leggerlo come JSON e falliva con un
// errore di sintassi — cioè il più lontano possibile dalla causa vera.
app.Map("/api/{**rest}", () => Results.NotFound());

// Tutto il resto è il router del browser: `/trades/123`, `/discipline` e la
// home non esistono sul server, e ricaricando la pagina si otterrebbe un 404.
app.MapFallbackToFile("index.html");

app.Run();