from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.contrib.auth.hashers import make_password

class Command(BaseCommand):
    help = 'Crear superusuario con credenciales específicas'

    def handle(self, *args, **options):
        username = 'admin'
        email = 'admin@safevg.com'
        password = 'bracKleciRew'
        
        # Verificar si el usuario ya existe
        if User.objects.filter(username=username).exists():
            self.stdout.write(
                self.style.WARNING(f'El usuario "{username}" ya existe. Eliminando...')
            )
            User.objects.filter(username=username).delete()
        
        # Crear el superusuario con hash correcto
        try:
            user = User.objects.create_superuser(
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
            self.stdout.write(
                self.style.SUCCESS(f'Password hash: {user.password}')
            )
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error al crear superusuario: {e}')
            )
