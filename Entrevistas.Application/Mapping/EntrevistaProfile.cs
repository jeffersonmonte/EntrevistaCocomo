using AutoMapper;
using Entrevistas.Domain.Entities;
using Entrevistas.Application.DTOs;

namespace Entrevistas.Application.Mappings;

public class EntrevistaProfile : Profile
{
    public EntrevistaProfile()
    {
        CreateMap<Domain.Entities.Entrevista, EntrevistaInputDto>().ReverseMap();
        CreateMap<Domain.Entities.Entrevista, EntrevistaOutputDto>().ReverseMap();
    }
}
