using Apex.Domain.AutoMapperProfile;
using Apex.Domain.Contracts;
using Apex.Domain.Repositories;
using Apex.Domain.Services;
using Apex.Infrastructure.DbContext;
using Apex.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

//Repository
builder.Services.AddScoped<ITradeRepository, TradeRepository>();
//Service
builder.Services.AddScoped<ITradeService, TradeService>();
//AutoMapper
builder.Services.AddAutoMapper(typeof(TradeProfile));
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