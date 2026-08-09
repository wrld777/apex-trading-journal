using Apex.Domain.DTOs;
using Apex.Domain.Entities;
using AutoMapper;

namespace Apex.Domain.AutoMapperProfile
{
    public class InstrumentProfile : Profile
    {
        public InstrumentProfile()
        {
            CreateMap<Instrument, InstrumentDto>().ReverseMap();
        }
    }
}
