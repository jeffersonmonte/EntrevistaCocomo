using AutoMapper;
using Entrevistas.Application.DTOs;
using Entrevistas.Domain.Entities;

namespace Entrevistas.Application.Mapping
{
    public class FatorConversaoProfile : Profile
    {
        public FatorConversaoProfile()
        {
            CreateMap<FatoresConversao, FatoresConversaoDto>().ReverseMap();
        }
    }

}
