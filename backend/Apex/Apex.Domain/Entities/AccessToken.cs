using System;
using System.Collections.Generic;
using System.Text;

namespace Apex.Domain.Entities
{
    public  class AccessToken
    {
        public string Token { get; set; }
        public DateTime ExpirationDate { get; set; }
    }
}
