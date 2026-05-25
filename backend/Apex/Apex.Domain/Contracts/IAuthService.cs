using Apex.Domain.Common;
using Apex.Domain.Response.User;
using Microsoft.AspNetCore.Identity.Data;
using System;
using System.Collections.Generic;
using System.Text;

namespace Apex.Domain.Contracts
{
    public interface IAuthService
    {
        Task<Result<AuthResponse>> RegisterAsync(Request.User.RegisterRequest request, CancellationToken ct);
        Task<Result<AuthResponse>> LoginAsync(Request.User.LoginRequest request, CancellationToken ct);
    }
}
