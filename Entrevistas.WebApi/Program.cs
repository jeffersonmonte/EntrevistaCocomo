using Entrevista.Application.Services;
using Entrevistas.Application.Interfaces;
using Entrevistas.Application.Services;
using Entrevistas.Infrastructure.Database;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Injeção do DbContext
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Injeção dos serviços da Application
builder.Services.AddScoped<ITamanhoService, TamanhoService>();
builder.Services.AddScoped<IEntrevistaService, EntrevistaService>();
builder.Services.AddScoped<IFatoresConversaoService, FatoresConversaoService>();


var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors(policy => policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());

app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();

app.Run();
