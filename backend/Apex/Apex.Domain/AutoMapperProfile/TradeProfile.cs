using Apex.Domain.DTOs;
using Apex.Domain.Entities;
using AutoMapper;
using System;
using System.Collections.Generic;
using System.Text;

namespace Apex.Domain.AutoMapperProfile
{
    public class TradeProfile : Profile
    {
        public TradeProfile()
        {
            CreateMap<Trade, TradeDto>().ReverseMap();
        }
    }
}
