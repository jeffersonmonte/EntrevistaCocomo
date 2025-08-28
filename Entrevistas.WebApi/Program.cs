using Entrevista.Application.Services;
using Entrevistas.Application.DTOs;
using Entrevistas.Application.Interfaces;
using Entrevistas.Application.Services;
using Entrevistas.Infrastructure.Database;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddHttpClient();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// DbContext
builder.Services.AddDbContext<AppDbContext>(opts =>
{
    var cs = builder.Configuration.GetConnectionString("DefaultConnection");
    opts.UseSqlServer(cs);
    opts.EnableDetailedErrors();
    opts.EnableSensitiveDataLogging(); // cuidado em produção
    opts.LogTo(Console.WriteLine, LogLevel.Information); // vê os INSERT/UPDATE no console
});

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

/// ***Diagnóstico de conexão na inicialização ***
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    try
    {
        var conn = db.Database.GetDbConnection();
        Console.WriteLine($"[DB] Provider......: {db.Database.ProviderName}");
        Console.WriteLine($"[DB] DataSource....: {conn.DataSource}");
        Console.WriteLine($"[DB] Database......: {conn.Database}");

        var canConnect = db.Database.CanConnect();
        Console.WriteLine($"[DB] CanConnect....: {canConnect}");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"[DB] Erro ao checar conexão: {ex.Message}");
    }
}


app.MapControllers();

app.Run();
