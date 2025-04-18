from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.models import User

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    role = models.CharField(max_length=20, choices=[
        ('admin', 'Administrator'),
        ('user', 'User'),
        ('guest', 'Guest'),
    ], default='guest')

    def __str__(self):
        return f"{self.user.username} - {self.role}"

class TotemQR(models.Model):
    latitude = models.FloatField()
    longitude = models.FloatField()
    name = models.CharField(max_length=255, default='Totem QR')
    description = models.TextField(blank=True, null=True)
    imageUrl = models.URLField(max_length=500, blank=True, null=True)
    campus = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        return self.name

class ReceptionQR(models.Model):
    latitude = models.FloatField()
    longitude = models.FloatField()
    name = models.CharField(max_length=255, default='Recepción QR')
    description = models.TextField(blank=True, null=True)
    imageUrl = models.URLField(max_length=500, blank=True, null=True)
    campus = models.CharField(max_length=255, blank=True, null=True)

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

class Denuncia(models.Model):
    nombre = models.CharField(max_length=255, blank=True, null=True)
    apellido = models.CharField(max_length=255, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    telefono = models.CharField(max_length=20, blank=True, null=True)
    tipo_incidente = models.CharField(max_length=100)
    fecha_incidente = models.DateField()
    lugar_incidente = models.CharField(max_length=255)
    descripcion = models.TextField()
    anonimo = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    campus = models.CharField(max_length=255, default='')

    def __str__(self):
        return f"Denuncia {self.id} - {self.tipo_incidente} - {self.campus}"



@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)