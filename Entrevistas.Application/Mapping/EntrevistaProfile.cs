using AutoMapper;
using Entrevistas.Application.DTOs;
using Entrevistas.Domain.Entities;

namespace Entrevistas.Application.Mapping
{
    public class EntrevistaProfile : Profile
    {
        public EntrevistaProfile()
        {
            CreateMap<ScaleFactor, ScaleFactorDto>().ReverseMap();
            CreateMap<EffortMultiplier, EffortMultiplierDto>().ReverseMap();

            CreateMap<Funcionalidade, FuncInlineDto>()
                .ForCtorParam("E", m => m.MapFrom(s => s.Medicao != null ? s.Medicao.EntryE : 0))
                .ForCtorParam("X", m => m.MapFrom(s => s.Medicao != null ? s.Medicao.ExitX : 0))
                .ForCtorParam("R", m => m.MapFrom(s => s.Medicao != null ? s.Medicao.ReadR : 0))
                .ForCtorParam("W", m => m.MapFrom(s => s.Medicao != null ? s.Medicao.WriteW : 0));

            CreateMap<CreateEntrevistaDto, Domain.Entities.Entrevista>();
            CreateMap<UpdateEntrevistaDto, Domain.Entities.Entrevista>();

            CreateMap<Domain.Entities.Entrevista, EntrevistaDetailDto>()
                .ForMember(d => d.Funcionalidades, opt => opt.Ignore());
        }
    }
}
