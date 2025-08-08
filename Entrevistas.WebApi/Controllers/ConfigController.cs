using Entrevistas.Domain.Entities;
using Entrevistas.Infrastructure.Database;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Entrevistas.WebApi.Controllers
{
    [ApiController]
    [Route("api/config")]
    public class ConfigController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ConfigController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("parametros")]
        public async Task<IActionResult> GetParametros()
        {
            var p = await _context.ParametrosCocomo.FirstOrDefaultAsync();
            return Ok(p);
        }

        [HttpPut("parametros")]
        public async Task<IActionResult> AtualizarParametros([FromBody] ParametrosCocomo input)
        {
            var existente = await _context.ParametrosCocomo.FirstOrDefaultAsync();
            if (existente == null)
            {
                _context.ParametrosCocomo.Add(input);
            }
            else
            {
                existente.A = input.A;
                existente.B = input.B;
                existente.C = input.C;
                existente.D = input.D;
            }

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpGet("conversoes")]
        public async Task<IActionResult> GetConversoes()
        {
            var lista = await _context.ConversoesTamanho.ToListAsync();
            return Ok(lista);
        }

        [HttpPost("conversoes")]
        public async Task<IActionResult> PostConversao([FromBody] ConversaoTamanho dto)
        {
            _context.ConversoesTamanho.Add(dto);
            await _context.SaveChangesAsync();
            return Created("", dto);
        }
    }
}
