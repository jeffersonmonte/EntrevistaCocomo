using Entrevistas.Application.DTOs;
using Entrevistas.Application.DTOs.Cocomo;
using Entrevistas.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Entrevistas.WebApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CocomoController : ControllerBase
    {
        private readonly ITamanhoService _tamanhoService;
        private readonly ICocomoService _service;

        public CocomoController(ITamanhoService tamanhoService, ICocomoService service)
        {
            _tamanhoService = tamanhoService;
            _service = service;
        }

        [HttpPost("calcular")]
        public async Task<IActionResult> Calcular([FromBody] TamanhoSistemaDto dto)
        {
            var resultado = await _tamanhoService.CalcularCocomoAsync(dto);
            return Ok(resultado);
        }

        /// <summary>Retorna as seleções (SF/EM) e o resultado consolidado da entrevista.</summary>
        [HttpGet("{entrevistaId:guid}")]
        public async Task<ActionResult<CocomoSelecoesResponse>> Get(Guid entrevistaId, CancellationToken ct)
        {
            try
            {
                var resp = await _service.GetSelecoesEResultadoAsync(entrevistaId, ct);
                return Ok(resp);
            }
            catch (InvalidOperationException ex)
            {
                return NotFound(new { error = ex.Message });
            }
        }

        /// <summary>
        /// Persiste seleções de SF/EM da entrevista e recalcula KLOC, Esforço (PM) e Prazo.
        /// Aceita mapas: { "PREC":"Nominal", ... } e { "RCPX":"Alto", ... }.
        /// </summary>
        [HttpPut("{entrevistaId:guid}")]
        public async Task<ActionResult<CocomoResultadoDto>> Put(Guid entrevistaId, [FromBody] CocomoSelecoesRequest body, CancellationToken ct)
        {
            if (entrevistaId != body.EntrevistaId)
                return BadRequest("Id do path difere do body.");

            try
            {
                var result = await _service.UpsertSelecoesERecalcularAsync(body, ct);
                return Ok(result);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return UnprocessableEntity(new { error = ex.Message });
            }
        }
    }
}
