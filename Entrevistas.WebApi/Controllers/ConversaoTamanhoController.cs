using Entrevistas.Domain.Entities;
using Entrevistas.Infrastructure.Database;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Entrevistas.WebApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ConversaoTamanhoController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ConversaoTamanhoController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<ConversaoTamanho>>> Get()
        {
            return Ok(await _context.ConversoesTamanho.ToListAsync());
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] ConversaoTamanho input)
        {
            var item = await _context.ConversoesTamanho.FindAsync(id);
            if (item == null) return NotFound();

            item.FatorConversao = input.FatorConversao;
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
