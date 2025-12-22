using Microsoft.EntityFrameworkCore;
using AkıllıTrafikSistemi.Models;

namespace AkıllıTrafikSistemi.Models
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<User> Users { get; set; }
        public DbSet<WeatherLog> WeatherLogs { get; set; }
        public DbSet<RouteHistoryEntry> RouteHistories { get; set; }
        public DbSet<UserMarker> AllMarkers { get; set; }
        public DbSet<UserProfileViewModel> UserProfiles { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<User>(entity =>
            {
                entity.ToTable("Users");
                entity.HasKey(u => u.Id);
            });

            modelBuilder.Entity<WeatherLog>(entity =>
            {
                entity.HasNoKey();
                entity.ToView("vw_WeatherLogs");
            });

            modelBuilder.Entity<RouteHistoryEntry>(entity =>
            {
                entity.HasNoKey();
                entity.ToView("vw_RouteHistory");
            });

            modelBuilder.Entity<UserMarker>(entity =>
            {
                entity.HasNoKey();
                entity.ToView("vw_AllMarkers");
                entity.Ignore(m => m.TotalMarkerCount);
                entity.Ignore(m => m.UserMarkerCount);
            });

            modelBuilder.Entity<UserProfileViewModel>(entity =>
            {
                entity.HasNoKey();
                entity.ToView("vw_UserProfile");
                entity.Ignore(p => p.StatusMessage);
            });
        }
    }
}