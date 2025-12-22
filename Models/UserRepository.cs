using Microsoft.EntityFrameworkCore;

namespace AkıllıTrafikSistemi.Models
{
    public interface IUserRepository
    {
        Task<bool> CreateUserAsync(User user);
        Task<User?> GetUserByEmailAsync(string email);
        Task<User?> GetUserByUsernameAndEmailAsync(string username, string email);
        Task<bool> UsernameExistsAsync(string username);
        Task<bool> EmailExistsAsync(string email);
        Task<bool> UpdatePasswordAsync(string email, string newPasswordHash);
    }

    public class UserRepository : IUserRepository
    {
        private readonly AppDbContext _context;

        public UserRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<bool> CreateUserAsync(User user)
        {
            _context.Users.Add(user);
            return await _context.SaveChangesAsync() > 0;
        }

        public async Task<User?> GetUserByEmailAsync(string email)
        {
            return await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
        }

        public async Task<User?> GetUserByUsernameAndEmailAsync(string username, string email)
        {
            return await _context.Users.FirstOrDefaultAsync(u => u.Username == username && u.Email == email);
        }

        public async Task<bool> UsernameExistsAsync(string username)
        {
            return await _context.Users.AnyAsync(u => u.Username == username);
        }

        public async Task<bool> EmailExistsAsync(string email)
        {
            return await _context.Users.AnyAsync(u => u.Email == email);
        }

        public async Task<bool> UpdatePasswordAsync(string email, string newPasswordHash)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
            if (user == null) return false;

            user.PasswordHash = newPasswordHash;
            return await _context.SaveChangesAsync() > 0;
        }
    }
}