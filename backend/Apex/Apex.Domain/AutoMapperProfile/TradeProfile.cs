using Apex.Domain.DTO;
using Apex.Domain.DTOs;
using Apex.Domain.Entities;
using Apex.Domain.Requests;
using Apex.Domain.Responses;
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
            // Symbol non esiste più su Trade (#94): arriva dal catalogo via join.
            // In senso inverso è ignorato — la navigation la risolve il service.
            CreateMap<Trade, TradeDto>()
                .ForMember(d => d.Symbol, o => o.MapFrom(s => s.Instrument != null ? s.Instrument.Symbol : string.Empty))
                .ReverseMap()
                .ForMember(d => d.Instrument, o => o.Ignore());
            CreateMap<TradeDto, CreateTradeRequest>().ReverseMap();
            CreateMap<TradeDto, UpdateTradeRequest>().ReverseMap();
            CreateMap<TradeDto, TradeResponse>().ReverseMap();
            CreateMap<TradeRuleCheck, TradeRuleCheckDto>().ReverseMap();

        }
    }
}
