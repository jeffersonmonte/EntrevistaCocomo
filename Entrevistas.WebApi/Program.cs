using Entrevista.Application.Services;
using Entrevistas.Application.DTOs;
using Entrevistas.Application.Interfaces;
using Entrevistas.Application.Services;
using Entrevistas.Infrastructure.Database;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// DbContext
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// CORS (opcional – ajuste conforme sua necessidade)
builder.Services.AddCors(opt =>
{
    opt.AddDefaultPolicy(p => p.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod());
});

// DI – Services da camada Application
builder.Services.AddScoped<IEntrevistaService, EntrevistaService>();
builder.Services.AddScoped<ITamanhoService, TamanhoService>();
builder.Services.AddScoped<IFatoresConversaoService, FatoresConversaoService>();
builder.Services.AddScoped<IMonteCarloService, MonteCarloService>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors();
app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();

app.Run();
