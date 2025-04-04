from django.contrib import admin
from .models import TotemQR, ReceptionQR, Path, PathPoint

# Register your models here.
admin.site.register(TotemQR)
admin.site.register(ReceptionQR)
admin.site.register(Path)
admin.site.register(PathPoint)