from django.db import models

class TotemQR(models.Model):
    latitude = models.FloatField()
    longitude = models.FloatField()
    name = models.CharField(max_length=255, default='Totem QR')
    description = models.TextField(blank=True, default='')
    imageUrl = models.URLField(max_length=500, blank=True, default='')
    campus = models.CharField(max_length=255, default='')  # Nuevo campo para asociar al campus

    def __str__(self):
        return f"{self.name} - {self.campus}"

class ReceptionQR(models.Model):
    latitude = models.FloatField()
    longitude = models.FloatField()
    name = models.CharField(max_length=255, default='Recepción QR')
    description = models.TextField(blank=True, default='')
    imageUrl = models.URLField(max_length=500, blank=True, default='')
    campus = models.CharField(max_length=255, default='')  # Nuevo campo para asociar al campus

    def __str__(self):
        return f"{self.name} - {self.campus}"

class Path(models.Model):
    name = models.CharField(max_length=255)
    campus = models.CharField(max_length=255, default='')

    def __str__(self):
        return f"{self.name} - {self.campus}"

class PathPoint(models.Model):
    path = models.ForeignKey(Path, on_delete=models.CASCADE, related_name='points')
    latitude = models.FloatField()
    longitude = models.FloatField()
    order = models.IntegerField()

    class Meta:
        ordering = ['order']