using BarberShopTemplate.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using System;

namespace BarberShopTemplate.Data
{
    public class BarberShopContext : IdentityDbContext<AppUser>
    {
        public BarberShopContext(DbContextOptions<BarberShopContext> options) : base(options)
        {
        }

        public DbSet<Appointment> Appointments { get; set; }
        public DbSet<Barber> Barbers { get; set; }
        public DbSet<Schedule> Schedules { get; set; }
        public DbSet<SpecialSchedule> SpecialSchedules { get; set; }
        public DbSet<VerificationCode> VerificationCode { get; set; }
        public DbSet<UserActivity> UserActivity { get; set; }
        public DbSet<PriceList> PriceList { get; set; }
        public DbSet<OpeningTimes> OpeningTimes { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            foreach (var entityType in modelBuilder.Model.GetEntityTypes())
            {
                foreach (var property in entityType.GetProperties())
                {
                    if (property.ClrType == typeof(DateTime) || property.ClrType == typeof(DateTime?))
                    {
                        property.SetValueConverter(new Microsoft.EntityFrameworkCore.Storage.ValueConversion.ValueConverter<DateTime, DateTime>(
                            v => v.ToUniversalTime(),  
                            v => DateTime.SpecifyKind(v, DateTimeKind.Utc) 
                        ));
                    }
                }
            }

            modelBuilder.Entity<Appointment>()
                .HasOne(a => a.AppUser)
                .WithMany(u => u.Appointments)
                .HasForeignKey(a => a.AppUserId)
                .OnDelete(DeleteBehavior.Restrict);  

            modelBuilder.Entity<Appointment>()
                .HasOne(a => a.Barber)
                .WithMany(b => b.Appointments)
                .HasForeignKey(a => a.BarberId)
                .OnDelete(DeleteBehavior.Cascade);  

            modelBuilder.Entity<Schedule>()
                .HasOne(s => s.Barber)
                .WithMany(b => b.Schedules)
                .HasForeignKey(s => s.BarberId)
                .OnDelete(DeleteBehavior.Cascade); 

            modelBuilder.Entity<SpecialSchedule>()
                .HasOne(ss => ss.Barber)
                .WithMany(b => b.SpecialSchedules)
                .HasForeignKey(ss => ss.BarberId)
                .OnDelete(DeleteBehavior.Cascade); 

            modelBuilder.Entity<Barber>()
               .HasOne(b => b.AppUser)
               .WithMany()
               .HasForeignKey(b => b.UserName)
               .HasPrincipalKey(u => u.UserName)
               .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
