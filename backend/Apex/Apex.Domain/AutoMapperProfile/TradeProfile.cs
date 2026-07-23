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
            CreateMap<Trade, TradeDto>().ReverseMap();
            CreateMap<TradeDto, CreateTradeRequest>().ReverseMap();
            CreateMap<TradeDto, UpdateTradeRequest>().ReverseMap();
            CreateMap<TradeDto, TradeResponse>().ReverseMap();
            CreateMap<TradeRuleCheck, TradeRuleCheckDto>().ReverseMap();

        }
    }
}
