using Apex.Domain.Common;
using Apex.Domain.Contracts;
using Apex.Domain.DTOs;
using Apex.Domain.Repositories;
using AutoMapper;

namespace Apex.Domain.Services;

public class InstrumentService : IInstrumentService
{
    private readonly IInstrumentRepository _instrumentRepository;
    private readonly IMapper _mapper;

    public InstrumentService(IInstrumentRepository instrumentRepository, IMapper mapper)
    {
        _instrumentRepository = instrumentRepository;
        _mapper = mapper;
    }

    public async Task<Result<List<InstrumentDto>>> GetAllAsync(CancellationToken ct)
    {
        var instruments = await _instrumentRepository.GetAllAsync(ct);
        return Result<List<InstrumentDto>>.Success(_mapper.Map<List<InstrumentDto>>(instruments));
    }
}
