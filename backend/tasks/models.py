from django.db import models

class Location(models.Model):
    x = models.FloatField(default=0.0)
    y = models.FloatField(default=0.0)
    info = models.CharField(max_length=255, default='default_info')
    campus = models.CharField(max_length=255, default='default_campus')

    class Meta:
        abstract = True  # Esto hace que Location sea una clase abstracta

    def __str__(self):
        return f"{self.__class__.__name__} {self.id} - {self.campus}"

class SafeSpace(Location):
    pass  # Hereda todos los campos de Location

class StartingPoint(Location):
    pass  # Hereda todos los campos de Location