# Configuración de Cloudinary para producción
from decouple import config

CLOUDINARY_STORAGE = {
    'CLOUD_NAME': config('CLOUDINARY_CLOUD_NAME', default=''),
    'API_KEY': config('CLOUDINARY_API_KEY', default=''),
    'API_SECRET': config('CLOUDINARY_API_SECRET', default=''),
}

# Solo usar Cloudinary en producción si está configurado
if all([
    config('CLOUDINARY_CLOUD_NAME', default=''),
    config('CLOUDINARY_API_KEY', default=''),
    config('CLOUDINARY_API_SECRET', default='')
]):
    DEFAULT_FILE_STORAGE = 'cloudinary_storage.storage.MediaCloudinaryStorage'
else:
    # Fallback a storage local
    DEFAULT_FILE_STORAGE = 'django.core.files.storage.FileSystemStorage'
