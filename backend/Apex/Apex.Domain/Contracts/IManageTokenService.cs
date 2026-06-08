using Apex.Domain.Common;
using Apex.Domain.DTO;
using Apex.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace Apex.Domain.Contracts
{
    public interface IManageTokenService
    {
        Task<Result<AccessToken>> GenerateTokenAsync(UserDto user, CancellationToken ct);
    }
}
