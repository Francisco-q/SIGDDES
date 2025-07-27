from django.core.management.base import BaseCommand
from django.conf import settings
import os

class Command(BaseCommand):
    help = 'Verificar archivos QR existentes'

    def handle(self, *args, **options):
        media_root = settings.MEDIA_ROOT
        qr_dir = os.path.join(media_root, 'qr_codes')
        
        self.stdout.write(f"MEDIA_ROOT: {media_root}")
        self.stdout.write(f"QR directory: {qr_dir}")
        
        if os.path.exists(qr_dir):
            files = os.listdir(qr_dir)
            self.stdout.write(f"Archivos QR encontrados: {len(files)}")
            for file in files:
                file_path = os.path.join(qr_dir, file)
                size = os.path.getsize(file_path)
                self.stdout.write(f"  - {file} ({size} bytes)")
        else:
            self.stdout.write("Directorio qr_codes no existe")
            
        # Verificar estructura de media
        if os.path.exists(media_root):
            self.stdout.write(f"\nContenido de media:")
            for item in os.listdir(media_root):
                item_path = os.path.join(media_root, item)
                if os.path.isdir(item_path):
                    self.stdout.write(f"  DIR: {item}/")
                else:
                    size = os.path.getsize(item_path)
                    self.stdout.write(f"  FILE: {item} ({size} bytes)")
        else:
            self.stdout.write("MEDIA_ROOT no existe")
