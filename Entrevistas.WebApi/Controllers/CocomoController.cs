using Entrevistas.Application.DTOs;
using Entrevistas.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Entrevistas.WebApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CocomoController : ControllerBase
    {
        private readonly ITamanhoService _tamanhoService;

        public CocomoController(ITamanhoService tamanhoService)
        {
            _tamanhoService = tamanhoService;
        }

        [HttpPost("calcular")]
        public async Task<IActionResult> Calcular([FromBody] TamanhoSistemaDto dto)
        {
            var resultado = await _tamanhoService.CalcularCocomoAsync(dto);
            return Ok(resultado);
        }
    }
}
