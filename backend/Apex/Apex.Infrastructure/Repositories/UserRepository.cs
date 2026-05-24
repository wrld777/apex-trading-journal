using Apex.Domain.Entities;
using Apex.Domain.Repositories;
using Apex.Infrastructure.DbContext;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Text;

namespace Apex.Infrastructure.Repositories
{
    public class UserRepository : IUserRepository
    {
        private readonly AppDbContext _context;

        public UserRepository(AppDbContext appDbContext )
        {
            _context = appDbContext;
            
        }

        public async Task<List<User>> GetAllAsync(Guid userId, CancellationToken ct)
        {
            return await _context.Users
                .AsNoTracking()
                .ToListAsync(ct);
        }

        public async Task<User?> GetByIdAsync(Guid id, CancellationToken ct)
        {
            return await _context.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(t => t.Id == id, ct);
        }

        public async Task<User?> GetByEmailAsync(string email, CancellationToken ct)
        {
            return await _context.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(t => t.Email == email, ct);
        }

        public async Task<User> CreateUserAsync(User user, CancellationToken ct)
        {
            _context.Users.AddAsync(user);
            await _context.SaveChangesAsync(ct);
            return user;
        }


    }
}
