using Entrevistas.Application.DTOs.Funcionalidades;
using Entrevistas.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Entrevistas.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class FuncionalidadesController : ControllerBase
{
    private readonly IFuncionalidadeService _service;

    public FuncionalidadesController(IFuncionalidadeService service)
    {
        _service = service;
    }

    /// <summary>
    /// Exclui uma funcionalidade; a MedicaoCosmic vinculada é excluída em cascade.
    /// </summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var ok = await _service.DeleteAsync(new DeleteFuncionalidadeRequest(id), ct);
        return ok ? NoContent() : NotFound();
    }

    /// <summary>Edita dados de uma funcionalidade.</summary>
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Put(Guid id, [FromBody] UpdateFuncionalidadeRequest body, CancellationToken ct)
    {
        if (id != body.Id) return BadRequest("Id do path difere do body.");
        var ok = await _service.UpdateAsync(body, ct);
        return ok ? NoContent() : NotFound();
    }
}
