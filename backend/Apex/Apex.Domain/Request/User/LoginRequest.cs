using System;
using System.Collections.Generic;
using System.Text;

namespace Apex.Domain.Request.User
{
    public class LoginRequest
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }
}
