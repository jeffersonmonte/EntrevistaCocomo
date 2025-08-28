using System;
using System.Net.Http;
using System.Net.Http.Json;
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
        private readonly IHttpClientFactory _http;

        public EntrevistasController(IEntrevistaService service, IHttpClientFactory httpClientFactory)
        {
            _service = service;
            _http = httpClientFactory;
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

            return CreatedAtRoute("Entrevistas_GetById", new { id = output.Id }, output);
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

            return CreatedAtRoute("Entrevistas_GetById", new { id = result.Id }, result);
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

        [HttpGet("{id:guid}", Name = "Entrevistas_GetById")]
        [ProducesResponseType(typeof(EntrevistaOutputDto), 200)]
        [ProducesResponseType(404)]
        public async Task<IActionResult> ObterPorIdAsync([FromRoute] Guid id, CancellationToken ct)
        {
            var dto = await _service.ObterPorIdAsync(id);
            if (dto is null) return NotFound();
            return Ok(dto);
        }

        // =========================================================================
        // EDITAR (UPDATE)  <<< SEMPRE DISPARA MONTE CARLO APÓS SALVAR >>>
        // =========================================================================
        [HttpPut("{id:guid}")]
        [ProducesResponseType(204)]
        [ProducesResponseType(404)]
        [ProducesResponseType(400)]
        public async Task<IActionResult> AtualizarAsync(
            [FromRoute] Guid id,
            [FromBody] UpdateEntrevistaRequest request,
            CancellationToken ct)
        {
            if (!ModelState.IsValid) return ValidationProblem(ModelState);
            request.Id = id;

            var ok = await _service.UpdateAsync(request, ct);
            if (!ok) return NotFound();

            // Dispara Monte Carlo (run + persist) de forma assíncrona; não bloqueia o 204.
            _ = DispararMonteCarloAposUpdateAsync(id, ct);

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
            var ok = await _service.DeleteAsync(new DeleteEntrevistaRequest(id), ct);
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

            return CreatedAtRoute("Entrevistas_ListarFunc", new { id }, new { id = fid });
        }

        [HttpGet("{id:guid}/funcionalidades", Name = "Entrevistas_ListarFunc")]
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

        // =========================================================================
        // PRIVATE: dispara Monte Carlo do próprio app via HTTP interno
        // =========================================================================
        private async Task DispararMonteCarloAposUpdateAsync(Guid entrevistaId, CancellationToken ct)
        {
            try
            {
                var client = _http.CreateClient();
                var basePath = Request.PathBase.HasValue ? Request.PathBase.Value : string.Empty;

                // 1) run + persist (overwrite=true) — ajuste se quiser apenas rodar sem persistir
                var url = $"{Request.Scheme}://{Request.Host}{basePath}/api/entrevistas/{entrevistaId}/cocomo/monte-carlo/persist?overwrite=true";

                using var resp = await client.PostAsJsonAsync(url, new { }, ct);
                // Opcional: verificar sucesso/logar retorno
                // resp.EnsureSuccessStatusCode();
            }
            catch (Exception ex)
            {
                // Não interrompe o fluxo do PUT; apenas registra o erro.
                // Substitua por seu logger (ILogger<EntrevistasController>) se preferir.
                Console.WriteLine($"[MonteCarlo] Falha ao disparar pós-update para {entrevistaId}: {ex.Message}");
            }
        }
    }
}
