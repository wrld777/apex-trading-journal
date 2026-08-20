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
            // Outcome è solo un ingresso abbreviato: in lettura la verità sono le Exits.
            CreateMap<Trade, TradeDto>()
                .ForMember(d => d.Symbol, o => o.MapFrom(s => s.Instrument != null ? s.Instrument.Symbol : string.Empty))
                .ForMember(d => d.StrategyName, o => o.MapFrom(s => s.Strategy != null ? s.Strategy.Name : null))
                .ForMember(d => d.Outcome, o => o.Ignore())
                .ReverseMap()
                .ForMember(d => d.Instrument, o => o.Ignore())
                .ForMember(d => d.Strategy, o => o.Ignore())
                // Le uscite le costruisce il service (prezzi derivati, ordine, id):
                // mapparle qui produrrebbe entità da buttare.
                .ForMember(d => d.Exits, o => o.Ignore());
            CreateMap<TradeDto, CreateTradeRequest>().ReverseMap();
            CreateMap<TradeDto, UpdateTradeRequest>().ReverseMap();
            CreateMap<TradeDto, TradeResponse>().ReverseMap();
            // Label/Order/Required arrivano dalla regola quando la navigation è
            // caricata (GetById la include); restano null nelle letture che non la
            // caricano, e in scrittura non toccano nulla.
            CreateMap<TradeRuleCheck, TradeRuleCheckDto>()
                .ForMember(d => d.Label, o => o.MapFrom(s => s.StrategyRule != null ? s.StrategyRule.Label : null))
                .ForMember(d => d.Order, o => o.MapFrom(s => s.StrategyRule != null ? (int?)s.StrategyRule.Order : null))
                .ForMember(d => d.Required, o => o.MapFrom(s => s.StrategyRule != null ? (bool?)s.StrategyRule.Required : null))
                .ReverseMap()
                .ForMember(d => d.StrategyRule, o => o.Ignore());
            // In uscita Price è sempre valorizzato; in ingresso è nullable perché
            // serve solo sulle uscite manuali (#96).
            CreateMap<TradeExit, TradeExitDto>().ReverseMap();

        }
    }
}
