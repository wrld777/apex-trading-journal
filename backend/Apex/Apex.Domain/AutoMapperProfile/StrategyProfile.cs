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
            CreateMap<Strategy, StrategyDto>()
                .ForMember(d => d.InstrumentIds,
                    o => o.MapFrom(s => s.Instruments.Select(i => i.InstrumentId)));

            // In ingresso gli strumenti NON si mappano: sono entità del catalogo globale
            // e vanno risolte dal DB (StrategyService.ApplyInstruments), altrimenti
            // AutoMapper costruirebbe Instrument nuovi ed EF proverebbe a inserirli.
            CreateMap<StrategyDto, Strategy>()
                .ForMember(d => d.Instruments, o => o.Ignore());

            CreateMap<StrategyRule, StrategyRuleDto>().ReverseMap();

            CreateMap<StrategyDto, CreateStrategyRequest>().ReverseMap();
            CreateMap<StrategyDto, UpdateStrategyRequest>().ReverseMap();
            CreateMap<StrategyRuleDto, StrategyRuleRequest>().ReverseMap();

            CreateMap<StrategyDto, StrategyResponse>().ReverseMap();
            CreateMap<StrategyRuleDto, StrategyRuleResponse>().ReverseMap();
        }
    }
}
