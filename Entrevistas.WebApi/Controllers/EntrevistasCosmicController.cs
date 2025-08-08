using Entrevistas.Application.DTOs;
using Entrevistas.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Entrevistas.WebApi.Controllers
{
    [ApiController]
    [Route("api/entrevistas")]
    public class EntrevistasCosmicController : ControllerBase
    {
        private readonly IEntrevistaService _service;
        public EntrevistasCosmicController(IEntrevistaService service) => _service = service;

        // POST /api/entrevistas/{id}/funcionalidades
        [HttpPost("{id:guid}/funcionalidades")]
        public async Task<IActionResult> AddFunc(Guid id, [FromBody] NovaFuncDto dto)
        {
            var funcId = await _service.AdicionarFuncionalidadeAsync(id, dto);
            return CreatedAtAction(nameof(GetFuncs), new { id }, funcId);
        }

        // GET /api/entrevistas/{id}/funcionalidades
        [HttpGet("{id:guid}/funcionalidades")]
        public Task<IReadOnlyList<FuncionalidadeVm>> GetFuncs(Guid id)
            => _service.ListarFuncionalidadesAsync(id);

        // POST /api/entrevistas/{id}/cosmic/recalcular
        [HttpPost("{id:guid}/cosmic/recalcular")]
        public Task<RecalculoCosmicVm> Recalc(Guid id)
            => _service.RecalcularCosmicAsync(id);
    }
}
