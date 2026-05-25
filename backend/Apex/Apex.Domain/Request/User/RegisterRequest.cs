using System;
using System.Collections.Generic;
using System.Text;

namespace Apex.Domain.Request.User
{
    public class RegisterRequest
    {
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }
}
