using Apex.Domain.DTO;
using Apex.Domain.Entities;
using Apex.Domain.Response.User;
using AutoMapper;

namespace Apex.Domain.AutoMapperProfile
{
    public class UserProfile : Profile
    {
        public UserProfile()
        {
            CreateMap<User, UserDto>().ReverseMap();
            CreateMap<User, ProfileResponse>();
        }
    }
}
