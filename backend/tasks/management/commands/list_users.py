from django.core.management.base import BaseCommand
from django.contrib.auth.models import User

class Command(BaseCommand):
    help = 'Listar todos los usuarios y superusuarios existentes'

    def handle(self, *args, **options):
        # Listar todos los usuarios
        users = User.objects.all()
        
        if not users.exists():
            self.stdout.write(
                self.style.WARNING('No hay usuarios en la base de datos.')
            )
            return
        
        self.stdout.write(
            self.style.SUCCESS(f'Total de usuarios: {users.count()}')
        )
        
        # Mostrar información de cada usuario
        for user in users:
            status = []
            if user.is_superuser:
                status.append('SUPERUSER')
            if user.is_staff:
                status.append('STAFF')
            if user.is_active:
                status.append('ACTIVE')
            else:
                status.append('INACTIVE')
            
            status_str = ' | '.join(status) if status else 'NORMAL USER'
            
            self.stdout.write(
                f'Usuario: {user.username} | Email: {user.email} | Estado: {status_str}'
            )
        
        # Contar superusuarios
        superusers = User.objects.filter(is_superuser=True)
        self.stdout.write(
            self.style.SUCCESS(f'Superusuarios encontrados: {superusers.count()}')
        )
