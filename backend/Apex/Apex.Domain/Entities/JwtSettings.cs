using System;
using System.Collections.Generic;
using System.Text;

namespace Apex.Domain.Entities
{
    // Apex.Domain/Models/JwtSettings.cs
    namespace Apex.Domain.Models;

    public class JwtSettings
    {
        public string Secret { get; set; } = string.Empty;
        public string Issuer { get; set; } = string.Empty;
        public string Audience { get; set; } = string.Empty;
        public int ExpiryDays { get; set; } = 7;
    }
}
