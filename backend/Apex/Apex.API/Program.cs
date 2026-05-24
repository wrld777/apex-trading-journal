using Apex.Domain.AutoMapperProfile;
using Apex.Domain.Contracts;
using Apex.Domain.Repositories;
using Apex.Domain.Services;
using Apex.Infrastructure.DbContext;
using Apex.Infrastructure.Repositories;
using AutoMapper;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
    });

//Repository
builder.Services.AddScoped<ITradeRepository, TradeRepository>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
//Service
builder.Services.AddScoped<ITradeService, TradeService>();
builder.Services.AddScoped<IStatsService, StatsService>();
//AutoMapper
builder.Services.AddAutoMapper(cfg =>
{
    cfg.AddProfile<TradeProfile>();
});
// Database
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();

app.Run();