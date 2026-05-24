using Apex.Domain.Entities;

namespace Apex.Domain.Repositories;

public interface IUserRepository
{
    Task<List<User>> GetAllAsync(Guid userId, CancellationToken ct);
    Task<User?> GetByIdAsync(Guid id, CancellationToken ct);
    Task<User?> GetByEmailAsync(string email, CancellationToken ct);
    Task<User> CreateUserAsync(User user, CancellationToken ct);
}