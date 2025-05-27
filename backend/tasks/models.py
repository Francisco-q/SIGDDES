from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.models import User
from django.conf import settings

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    role = models.CharField(max_length=20, choices=[
        ('admin', 'Administrator'),
        ('user', 'User'),
        ('guest', 'Guest'),
    ], default='guest')
    telefono = models.CharField(max_length=20, blank=True, null=True)  # Nuevo campo
    campus = models.CharField(max_length=255, blank=True, null=True)  # Nuevo campo

    def __str__(self):
        return f"{self.user.username} - {self.role}"

# Señal para crear UserProfile al crear un User
@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)

class TotemQR(models.Model):
    id = models.AutoField(primary_key=True)
    latitude = models.FloatField()
    longitude = models.FloatField()
    name = models.CharField(max_length=255, default='Totem QR')
    description = models.TextField(blank=True, null=True)
    campus = models.CharField(max_length=255, blank=True, null=True)
    status = models.CharField(max_length=20, choices=[('Operativo', 'Operativo'), ('No Operativo', 'No Operativo')], default='Operativo')
    qr_image = models.URLField(max_length=500, blank=True, null=True)  # Nuevo campo para la URL del QR

    def __str__(self):
        return self.name

class ReceptionQR(models.Model):
    id = models.AutoField(primary_key=True)
    latitude = models.FloatField()
    longitude = models.FloatField()
    name = models.CharField(max_length=255, default='Recepción QR')
    description = models.TextField(blank=True, null=True)
    campus = models.CharField(max_length=255, blank=True, null=True)
    schedule = models.CharField(max_length=100, blank=True)
    status = models.CharField(max_length=20, choices=[('Operativo', 'Operativo'), ('No Operativo', 'No Operativo')], default='Operativo')
    qr_image = models.URLField(max_length=500, blank=True, null=True)  # Nuevo campo para la URL del QR

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
    TIPO_INCIDENTE_CHOICES = [
        ('Acoso_sexual', 'Acoso Sexual'),
        ('Violencia_fisica', 'Violencia Física'),
        ('Violencia_psicologica', 'Violencia Psicológica'),
        ('Discriminacion', 'Discriminación de Género'),
        ('No estoy seguro necesito orientación', 'Otro'),
    ]

    nombre = models.CharField(max_length=100, default='')
    apellido = models.CharField(max_length=100, default='')
    email = models.EmailField( default='')
    telefono = models.CharField(max_length=15, default='')
    tipo_incidente = models.CharField(max_length=100, choices=TIPO_INCIDENTE_CHOICES, default='')
    fecha_incidente = models.DateField()
    lugar_incidente = models.CharField(max_length=200)
    descripcion = models.TextField()
    campus = models.CharField(max_length=100, blank=True, null=True)
    encargado_acogida = models.CharField(max_length=200, default='')  # Nuevo campo
    usuario = models.ForeignKey('auth.User', on_delete=models.CASCADE, related_name='denuncias', default='',null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    estado = models.CharField(max_length=20, choices=[('pendiente', 'Pendiente'), ('tomada', 'Tomada')], default='pendiente')
    comentarios = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.nombre} {self.apellido} - {self.tipo_incidente}"

class ImageUpload(models.Model):
    point_id = models.IntegerField()
    point_type = models.CharField(max_length=20, choices=[('totem', 'Totem'), ('reception', 'Reception')])
    campus = models.CharField(max_length=50)
    image = models.ImageField(upload_to='images/points/')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return f"{self.point_type} {self.point_id} - {self.image.name}"

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)


class ReporteAtencion(models.Model):
    MOTIVOS_CHOICES = [
        ('noHabiaPersonal', 'No había personal disponible'),
        ('oficinaCerrada', 'La oficina o espacio estaba cerrado'),
        ('largoTiempoEspera', 'Tiempo de espera excesivamente largo'),
        ('personalOcupado', 'El personal estaba ocupado'),
        ('otro', 'Otro motivo'),
    ]
    nombre = models.CharField(max_length=100)
    email = models.EmailField()
    telefono = models.CharField(max_length=20, blank=True)
    motivos_no_atencion = models.JSONField()  # Guarda la lista de motivos seleccionados
    comentarios = models.TextField(blank=True)
    campus = models.CharField(max_length=100)
    tipo_reporte = models.CharField(max_length=50, default="falta_atencion")
    created_at = models.DateTimeField(auto_now_add=True)
    estado = models.CharField(max_length=20, default="nuevo") 

    def __str__(self):
        return f"{self.nombre} - {self.campus} - {self.created_at.date()}"