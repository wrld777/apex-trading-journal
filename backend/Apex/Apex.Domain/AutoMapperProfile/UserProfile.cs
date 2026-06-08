using Apex.Domain.DTO;
using Apex.Domain.Entities;
using AutoMapper;

namespace Apex.Domain.AutoMapperProfile
{
    public class UserProfile : Profile
    {
        public UserProfile()
        {
            CreateMap<User, UserDto>().ReverseMap();
        }
    }
}
