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
    public class StrategyProfile : Profile
    {
        public StrategyProfile()
        {
            CreateMap<Strategy, StrategyDto>().ReverseMap();
            CreateMap<StrategyRule, StrategyRuleDto>().ReverseMap();

            CreateMap<StrategyDto, CreateStrategyRequest>().ReverseMap();
            CreateMap<StrategyDto, UpdateStrategyRequest>().ReverseMap();
            CreateMap<StrategyRuleDto, StrategyRuleRequest>().ReverseMap();

            CreateMap<StrategyDto, StrategyResponse>().ReverseMap();
            CreateMap<StrategyRuleDto, StrategyRuleResponse>().ReverseMap();
        }
    }
}
