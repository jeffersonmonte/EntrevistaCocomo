using Entrevistas.Application.DTOs;
using Entrevistas.Domain.Enums;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/entrevistas")]
public class MonteCarloController : ControllerBase
{
    private readonly IMonteCarloService _mc;
    public MonteCarloController(IMonteCarloService mc) { _mc = mc; }

    // Roda “stateless” (compatível com o que você tem hoje)
    [HttpPost("{id:guid}/cocomo/monte-carlo")]
    public async Task<ActionResult<MonteCarloSummaryDto>> Run(Guid id, [FromBody] MonteCarloOptionsDto options)
    {
        var res = await _mc.RodarParaEntrevistaAsync(id, options);
        return Ok(res);
    }

    // Roda e salva. Se overwrite=true, marca como “atual” e desmarca o anterior
    [HttpPost("{id:guid}/cocomo/monte-carlo/persist")]
    public async Task<ActionResult<MonteCarloRunDto>> RunAndPersist(Guid id,
        [FromBody] MonteCarloOptionsDto options, [FromQuery] bool overwrite = false)
    {
        var run = await _mc.RodarESalvarAsync(id, options, overwrite);
        return Ok(run);
    }

    // Último salvo (prioriza IsAtual)
    [HttpGet("{id:guid}/cocomo/monte-carlo/ultimo")]
    public async Task<ActionResult<MonteCarloRunDto?>> GetUltimo(Guid id)
    {
        var run = await _mc.ObterUltimoAsync(id);
        return Ok(run);
    }

    // Histórico de execuções
    [HttpGet("{id:guid}/cocomo/monte-carlo")]
    public async Task<ActionResult<IReadOnlyList<MonteCarloRunDto>>> Listar(Guid id)
    {
        var runs = await _mc.ListarAsync(id);
        return Ok(runs);
    }

    // Marcar um resultado como “atual”
    [HttpPut("{id:guid}/cocomo/monte-carlo/{runId:guid}/atual")]
    public async Task<IActionResult> MarcarAtual(Guid id, Guid runId)
    {
        await _mc.MarcarComoAtualAsync(id, runId);
        return NoContent();
    }

    // deletar um run
    [HttpDelete("{id:guid}/cocomo/monte-carlo/{runId:guid}")]
    public async Task<IActionResult> Remover(Guid id, Guid runId)
    {
        await _mc.RemoverAsync(id, runId);
        return NoContent();
    }
}
