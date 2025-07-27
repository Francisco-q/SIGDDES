from django.core.management.base import BaseCommand
from tasks.models import TotemQR
from django.contrib.auth.models import User
from tasks.models import UserProfile
import qrcode
from io import BytesIO
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.conf import settings
import os

class Command(BaseCommand):
    help = 'Generar QR de prueba directamente'

    def handle(self, *args, **options):
        self.stdout.write("=== GENERACIÓN DIRECTA DE QR ===")
        
        try:
            # Crear tótem de prueba
            totem = TotemQR.objects.create(
                name="Tótem Test QR",
                description="Tótem para probar generación de QR",
                latitude=-35.4264,
                longitude=-71.6369,
                campus="Talca",
                status="Operativo"
            )
            
            self.stdout.write(f"✓ Tótem creado con ID: {totem.id}")
            
            # Generar QR manualmente
            qr_url = f"{settings.FRONTEND_BASE_URL}/mapa2/{totem.campus}?pointId={totem.id}&pointType=totem"
            qr = qrcode.QRCode(
                version=1,
                error_correction=qrcode.constants.ERROR_CORRECT_L,
                box_size=10,
                border=4,
            )
            qr.add_data(qr_url)
            qr.make(fit=True)
            
            img = qr.make_image(fill_color="black", back_color="white")
            buffer = BytesIO()
            img.save(buffer, format="PNG")
            file_name = f"qr_totem_{totem.id}_{totem.campus}.png"
            file_path = f"qr_codes/{file_name}"
            
            # Guardar archivo
            file_content = ContentFile(buffer.getvalue(), name=file_name)
            saved_path = default_storage.save(file_path, file_content)
            
            # Construir URL completa
            if hasattr(settings, 'FRONTEND_BASE_URL'):
                base_url = settings.FRONTEND_BASE_URL.replace('https://safevg.vercel.app', 'https://front-0opi.onrender.com')
            else:
                base_url = 'https://front-0opi.onrender.com'
            
            qr_image_url = f"{base_url}/media/{saved_path}"
            
            # Guardar en el modelo
            totem.qr_image = qr_image_url
            totem.save()
            
            self.stdout.write(f"✓ QR generado: {qr_image_url}")
            self.stdout.write(f"✓ Archivo guardado en: {saved_path}")
            
            # Verificar que el archivo existe físicamente
            full_path = os.path.join(settings.MEDIA_ROOT, saved_path)
            self.stdout.write(f"✓ Ruta completa: {full_path}")
            self.stdout.write(f"✓ Archivo existe: {os.path.exists(full_path)}")
            
            if os.path.exists(full_path):
                size = os.path.getsize(full_path)
                self.stdout.write(f"✓ Tamaño del archivo: {size} bytes")
            
            self.stdout.write(f"✓ Tótem actualizado con QR_image: {totem.qr_image}")
            
        except Exception as e:
            self.stdout.write(f"✗ Error: {str(e)}")
            import traceback
            traceback.print_exc()
            
        self.stdout.write("=== GENERACIÓN COMPLETA ===")
