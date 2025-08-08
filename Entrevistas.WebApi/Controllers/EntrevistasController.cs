using Entrevistas.Application.DTOs;
using Entrevistas.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Entrevistas.WebApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class EntrevistasController : ControllerBase
    {
        private readonly IEntrevistaService _service;

        public EntrevistasController(IEntrevistaService service)
        {
            _service = service;
        }

        [HttpPost]
        public async Task<IActionResult> Post([FromBody] EntrevistaInputDto dto)
        {
            var resultado = await _service.CriarEntrevistaAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = resultado.Id }, resultado);
        }

        [HttpGet]
        public async Task<IActionResult> Get()
        {
            var entrevistas = await _service.ListarEntrevistasAsync();
            return Ok(entrevistas);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var entrevista = await _service.ObterPorIdAsync(id);
            if (entrevista == null) return NotFound();
            return Ok(entrevista);
        }

        [HttpPost("com-cosmic")]
        public async Task<ActionResult<CreateEntrevistaResult>> PostComCosmic([FromBody] CreateEntrevistaDto dto)
        {
            var result = await _service.CriarEntrevistaComCosmicAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
        }

    }
}