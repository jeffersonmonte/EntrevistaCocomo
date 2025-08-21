using System;
using System.Threading.Tasks;
using Entrevistas.Application.DTOs;
using Entrevistas.Application.Services;
using Microsoft.AspNetCore.Mvc;

namespace Entrevistas.WebApi.Controllers
{
    [ApiController]
    [Route("api/entrevistas")]
    public class MonteCarloController : ControllerBase
    {
        private readonly IMonteCarloService _mc;

        public MonteCarloController(IMonteCarloService mc)
        {
            _mc = mc;
        }

        // POST /api/entrevistas/{id}/cocomo/monte-carlo
        [HttpPost("{id:guid}/cocomo/monte-carlo")]
        public async Task<ActionResult<MonteCarloSummaryDto>> Run(Guid id, [FromBody] MonteCarloOptionsDto options)
        {
            var res = await _mc.RodarParaEntrevistaAsync(id, options);
            return Ok(res);
        }
    }
}
