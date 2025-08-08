using AutoMapper;
using Entrevistas.Application.DTOs;
using Entrevistas.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

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
