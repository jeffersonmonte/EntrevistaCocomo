using Entrevistas.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Entrevista.WebApi.Controllers;

[ApiController]
[Route("api/fatores-conversao")]
public class FatoresConversaoController : ControllerBase
{
    private readonly IFatoresConversaoService _service;

    public FatoresConversaoController(IFatoresConversaoService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var resultado = await _service.ListarTodos();
        return Ok(resultado);
    }
}
