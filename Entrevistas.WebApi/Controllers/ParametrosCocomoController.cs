using Entrevistas.Domain.Entities;
using Entrevistas.Infrastructure.Database;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Entrevistas.WebApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ParametrosCocomoController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ParametrosCocomoController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<ParametrosCocomo>> Get()
        {
            var parametros = await _context.ParametrosCocomo.FirstOrDefaultAsync();
            return Ok(parametros);
        }

        [HttpPut]
        public async Task<IActionResult> Update([FromBody] ParametrosCocomo input)
        {
            var parametros = await _context.ParametrosCocomo.FirstOrDefaultAsync();
            if (parametros == null) return NotFound();

            parametros.A = input.A;
            parametros.B = input.B;
            parametros.C = input.C;
            parametros.D = input.D;

            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
