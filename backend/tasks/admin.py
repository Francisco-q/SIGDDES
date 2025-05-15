from django.contrib import admin
from .models import TotemQR, ReceptionQR, Path, PathPoint, UserProfile, Denuncia

# Inline para PathPoint dentro de Path
class PathPointInline(admin.TabularInline):
    model = PathPoint
    extra = 1  # Número de puntos vacíos que se muestran por defecto

# Personalizar la administración de Path
@admin.register(Path)
class PathAdmin(admin.ModelAdmin):
    inlines = [PathPointInline]
    list_display = ('name', 'point_count')  # Mostrar nombre y cantidad de puntos

    def point_count(self, obj):
        return obj.points.count()
    point_count.short_description = 'Cantidad de puntos'

@admin.register(Denuncia)
class DenunciaAdmin(admin.ModelAdmin):
    list_display = ('id', 'tipo_incidente', 'campus', 'created_at')
    list_filter = ('tipo_incidente', 'campus')
    search_fields = ('descripcion', 'lugar_incidente')


# Registro simple para los otros modelos
admin.site.register(TotemQR)
admin.site.register(ReceptionQR)
admin.site.register(PathPoint)
admin.site.register(UserProfile)