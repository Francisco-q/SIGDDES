from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from decouple import config
import os

class Command(BaseCommand):
    help = 'Crear superusuario automáticamente si no existe'

    def handle(self, *args, **options):
        # Obtener credenciales desde variables de entorno (SIN valores por defecto)
        username = config('SUPERUSER_USERNAME', default=None)
        email = config('SUPERUSER_EMAIL', default=None)
        password = config('SUPERUSER_PASSWORD', default=None)
        
        # Verificar que todas las variables estén configuradas
        if not all([username, email, password]):
            self.stdout.write(
                self.style.ERROR('Faltan variables de entorno: SUPERUSER_USERNAME, SUPERUSER_EMAIL, SUPERUSER_PASSWORD')
            )
            return
        
        # Verificar si el superusuario ya existe
        if User.objects.filter(username=username).exists():
            self.stdout.write(
                self.style.WARNING(f'El superusuario "{username}" ya existe.')
            )
            return
        
        # Crear el superusuario
        try:
            User.objects.create_superuser(
                username=username,
                email=email,
                password=password
            )
            self.stdout.write(
                self.style.SUCCESS(f'Superusuario "{username}" creado exitosamente.')
            )
            self.stdout.write(
                self.style.SUCCESS(f'Email: {email}')
            )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error al crear superusuario: {e}')
            )
