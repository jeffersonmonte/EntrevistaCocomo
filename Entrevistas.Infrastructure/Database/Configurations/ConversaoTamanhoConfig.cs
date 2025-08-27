using Entrevistas.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Entrevistas.Infrastructure.Configurations
{
    public class ConversaoTamanhoConfig : IEntityTypeConfiguration<ConversaoTamanho>
    {
        public void Configure(EntityTypeBuilder<ConversaoTamanho> b)
        {
            b.ToTable("ConversoesTamanho");
            b.HasKey(x => x.Id);

            b.Property(x => x.TipoEntrada).IsRequired().HasMaxLength(20);
            b.Property(x => x.Contexto).IsRequired().HasMaxLength(100);
            b.Property(x => x.FatorConversao).HasColumnType("decimal(12,6)");

            b.HasIndex(x => new { x.TipoEntrada, x.Contexto }).IsUnique();
        }
    }
}
