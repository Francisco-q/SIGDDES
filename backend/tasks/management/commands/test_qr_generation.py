from django.core.management.base import BaseCommand
from django.test import Client
from django.contrib.auth.models import User
from tasks.models import UserProfile
from rest_framework_simplejwt.tokens import RefreshToken
from django.urls import reverse
import json

class Command(BaseCommand):
    help = 'Probar generación y acceso a QR codes'

    def handle(self, *args, **options):
        # Crear cliente de prueba
        client = Client()
        
        # Crear usuario admin de prueba si no existe
        username = 'test_admin'
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            user = User.objects.create_user(username=username, password='testpass123')
            profile, created = UserProfile.objects.get_or_create(
                user=user,
                defaults={'role': 'admin'}
            )
            if not created:
                profile.role = 'admin'
                profile.save()
        
        # Generar token JWT
        refresh = RefreshToken.for_user(user)
        token = str(refresh.access_token)
        
        # Headers de autenticación
        auth_headers = {'HTTP_AUTHORIZATION': f'Bearer {token}'}
        
        self.stdout.write("=== TESTING QR GENERATION ===")
        
        # Probar generación de QR para tótem
        try:
            response = client.post('/api/totems/', {
                'name': 'Tótem de Prueba QR',
                'description': 'Tótem para probar QR',
                'latitude': -35.4264,
                'longitude': -71.6369,
                'campus': 'Talca',
                'status': 'Operativo'
            }, content_type='application/json', **auth_headers)
            
            if response.status_code == 201:
                totem_data = json.loads(response.content)
                totem_id = totem_data['id']
                self.stdout.write(f"✓ Tótem creado: ID {totem_id}")
                
                # Generar QR
                qr_response = client.post(f'/api/totems/{totem_id}/generate_qr/', {}, **auth_headers)
                if qr_response.status_code == 201:
                    qr_data = json.loads(qr_response.content)
                    qr_url = qr_data.get('qr_image')
                    self.stdout.write(f"✓ QR generado: {qr_url}")
                    
                    # Probar acceso al QR
                    if qr_url:
                        # Extraer path relativo
                        if '/media/' in qr_url:
                            media_path = qr_url.split('/media/')[-1]
                            test_url = f'/media/{media_path}'
                            
                            media_response = client.get(test_url)
                            self.stdout.write(f"✓ Prueba de acceso a {test_url}: {media_response.status_code}")
                            
                            if media_response.status_code == 200:
                                self.stdout.write(f"✓ Archivo QR accesible correctamente")
                                self.stdout.write(f"✓ Content-Type: {media_response.get('Content-Type', 'No especificado')}")
                            else:
                                self.stdout.write(f"✗ Error al acceder al archivo QR: {media_response.status_code}")
                else:
                    self.stdout.write(f"✗ Error generando QR: {qr_response.status_code} - {qr_response.content}")
            else:
                self.stdout.write(f"✗ Error creando tótem: {response.status_code} - {response.content}")
                
        except Exception as e:
            self.stdout.write(f"✗ Excepción: {str(e)}")
            
        self.stdout.write("=== TESTING COMPLETE ===")
