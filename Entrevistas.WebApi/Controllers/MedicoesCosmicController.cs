
using Entrevistas.Application.DTOs.Medicoes;
using Entrevistas.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Entrevistas.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class MedicoesCosmicController : ControllerBase
{
    private readonly IMedicaoCosmicService _service;

    public MedicoesCosmicController(IMedicaoCosmicService service) => _service = service;

    /// <summary>Edita os valores E/X/R/W de uma medição COSMIC.</summary>
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Put(Guid id, [FromBody] UpdateMedicaoCosmicRequest body, CancellationToken ct)
    {
        if (id != body.Id) return BadRequest("Id do path difere do body.");
        var ok = await _service.UpdateAsync(body, ct);
        return ok ? NoContent() : NotFound();
    }
}
