using System;
using System.Collections.Generic;
using System.Text;

namespace Apex.Domain.Response.User
{
    public class AuthResponse
    {
        public Guid UserId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Token { get; set; } = string.Empty;
    }
}
