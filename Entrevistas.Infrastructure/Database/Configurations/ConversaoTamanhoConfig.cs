using Entrevistas.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Entrevistas.Infrastructure.Database.Configurations
{
    public class ConversaoTamanhoConfig : IEntityTypeConfiguration<ConversaoTamanho>
    {
        public void Configure(EntityTypeBuilder<ConversaoTamanho> builder)
        {
            builder.HasKey(p => p.Id);
            builder.Property(p => p.TipoEntrada).IsRequired();
            builder.Property(p => p.Contexto).IsRequired();
            builder.Property(p => p.FatorConversao).IsRequired();
        }
    }
}
