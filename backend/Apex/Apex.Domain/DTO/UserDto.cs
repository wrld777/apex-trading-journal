using System;
using System.Collections.Generic;
using System.Text;

namespace Apex.Domain.DTO
{
    public class UserDto
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
    }
}
