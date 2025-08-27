using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Entrevistas.Application.Interfaces;
using Entrevistas.Application.DTOs;
using Entrevistas.Application.DTOs.Entrevistas;

namespace Entrevistas.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Produces("application/json")]
    public class EntrevistasController : ControllerBase
    {
        private readonly IEntrevistaService _service;

        public EntrevistasController(IEntrevistaService service)
        {
            _service = service;
        }

        // =========================================================================
        // CRIAR (fluxo "antigo": EntrevistaInputDto)
        // =========================================================================
        [HttpPost]
        [ProducesResponseType(typeof(EntrevistaOutputDto), 201)]
        [ProducesResponseType(400)]
        public async Task<IActionResult> CriarAsync([FromBody] EntrevistaInputDto dto, CancellationToken ct)
        {
            if (!ModelState.IsValid) return ValidationProblem(ModelState);
            var output = await _service.CriarEntrevistaAsync(dto);
            return CreatedAtAction(nameof(ObterPorIdAsync), new { id = output.Id }, output);
        }

        // =========================================================================
        // CRIAR (fluxo com CreateEntrevistaDto)
        // =========================================================================
        [HttpPost("com-cosmic")]
        [ProducesResponseType(typeof(CreateEntrevistaResult), 201)]
        [ProducesResponseType(400)]
        public async Task<IActionResult> CriarComCosmicAsync([FromBody] CreateEntrevistaDto dto, CancellationToken ct)
        {
            if (!ModelState.IsValid) return ValidationProblem(ModelState);
            var result = await _service.CriarEntrevistaComCosmicAsync(dto);
            return CreatedAtAction(nameof(ObterPorIdAsync), new { id = result.Id }, result);
        }

        // =========================================================================
        // LISTAR / DETALHAR
        // =========================================================================
        [HttpGet]
        [ProducesResponseType(typeof(EntrevistaOutputDto[]), 200)]
        public async Task<IActionResult> ListarAsync(CancellationToken ct)
        {
            var list = await _service.ListarEntrevistasAsync();
            return Ok(list);
        }

        [HttpGet("{id:guid}")]
        [ProducesResponseType(typeof(EntrevistaOutputDto), 200)]
        [ProducesResponseType(404)]
        public async Task<IActionResult> ObterPorIdAsync([FromRoute] Guid id, CancellationToken ct)
        {
            var dto = await _service.ObterPorIdAsync(id);
            if (dto is null) return NotFound();
            return Ok(dto);
        }

        // =========================================================================
        // EDITAR (UPDATE)  <<< ENDPOINT DE EDIÇÃO >>>
        // =========================================================================
        [HttpPut("{id:guid}")]
        [ProducesResponseType(204)]
        [ProducesResponseType(404)]
        [ProducesResponseType(400)]
        public async Task<IActionResult> AtualizarAsync([FromRoute] Guid id, [FromBody] UpdateEntrevistaRequest request, CancellationToken ct)
        {
            if (!ModelState.IsValid) return ValidationProblem(ModelState);

            // Garante consistência do Id
            request.Id = id;

            var ok = await _service.UpdateAsync(request, ct);
            if (!ok) return NotFound();
            return NoContent();
        }

        // =========================================================================
        // EXCLUIR
        // =========================================================================
        [HttpDelete("{id:guid}")]
        [ProducesResponseType(204)]
        [ProducesResponseType(404)]
        public async Task<IActionResult> DeletarAsync([FromRoute] Guid id, CancellationToken ct)
        {
            var ok = await _service.DeleteAsync(new DeleteEntrevistaRequest(id ), ct);
            if (!ok) return NotFound();
            return NoContent();
        }

        // =========================================================================
        // FUNCIONALIDADES (adicionar / listar)
        // =========================================================================
        [HttpPost("{id:guid}/funcionalidades")]
        [ProducesResponseType(typeof(Guid), 201)]
        [ProducesResponseType(404)]
        [ProducesResponseType(400)]
        public async Task<IActionResult> AdicionarFuncionalidadeAsync([FromRoute] Guid id, [FromBody] NovaFuncDto dto, CancellationToken ct)
        {
            if (!ModelState.IsValid) return ValidationProblem(ModelState);

            var fid = await _service.AdicionarFuncionalidadeAsync(id, dto);
            // Created com rota de listagem/detalhe da própria entrevista
            return CreatedAtAction(nameof(ListarFuncionalidadesAsync), new { id }, new { id = fid });
        }

        [HttpGet("{id:guid}/funcionalidades")]
        [ProducesResponseType(typeof(FuncionalidadeVm[]), 200)]
        [ProducesResponseType(404)]
        public async Task<IActionResult> ListarFuncionalidadesAsync([FromRoute] Guid id, CancellationToken ct)
        {
            var entre = await _service.ObterPorIdAsync(id);
            if (entre is null) return NotFound();

            var vms = await _service.ListarFuncionalidadesAsync(id);
            return Ok(vms);
        }

        // =========================================================================
        // RECALC (recalibragem de COSMIC/COCOMO para a entrevista)
        // ========================================================================= 
        [HttpPost("{id:guid}/recalcular")]
        [ProducesResponseType(typeof(RecalculoCosmicVm), 200)]
        [ProducesResponseType(404)]
        public async Task<IActionResult> RecalcularCosmicAsync([FromRoute] Guid id, CancellationToken ct)
        {
            // Garante que existe
            var existe = await _service.ObterPorIdAsync(id);
            if (existe is null) return NotFound();

            var vm = await _service.RecalcularCosmicAsync(id);
            return Ok(vm);
        }

		[HttpGet("{id:guid}/detalhe")]
		[ProducesResponseType(typeof(EntrevistaDetailDto), 200)]
		[ProducesResponseType(404)]
		public async Task<IActionResult> ObterDetalheAsync([FromRoute] Guid id, CancellationToken ct)
		{
			var dto = await _service.ObterDetalheAsync(id, ct);
			if (dto is null) return NotFound();
			return Ok(dto);
		}
	}
}