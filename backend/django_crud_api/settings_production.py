import os
from .settings import *
from decouple import config

# Importar configuración de Cloudinary
from .cloudinary_config import CLOUDINARY_STORAGE, DEFAULT_FILE_STORAGE

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = False

# Hosts permitidos para producción
ALLOWED_HOSTS = [
    'localhost',
    '127.0.0.1',
    'front-0opi.onrender.com',  # URL real de Render
    'safevg.onrender.com',      # Para Render personalizado
    'safevg.railway.app',       # Para Railway
    'safevg.vercel.app',        # Para Vercel
    config('PRODUCTION_HOST', default='localhost'),
]

# Middleware con WhiteNoise para archivos estáticos
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',  # WhiteNoise debe ir después de SecurityMiddleware
    'django_crud_api.middleware.MediaWhiteNoiseMiddleware',  # Middleware personalizado para media
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# Base de datos para producción (PostgreSQL)
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': config('DB_NAME', default='safevg_prod'),
        'USER': config('DB_USER', default='postgres'),
        'PASSWORD': config('DB_PASSWORD'),
        'HOST': config('DB_HOST', default='localhost'),
        'PORT': config('DB_PORT', default='5432'),
        'OPTIONS': {
            'sslmode': 'require',
        },
    }
}

# Configuración HTTPS para producción
SECURE_SSL_REDIRECT = True
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_BROWSER_XSS_FILTER = True

# Configuración de archivos estáticos
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# Configuración de WhiteNoise para servir archivos media en producción
WHITENOISE_USE_FINDERS = True
WHITENOISE_AUTOREFRESH = True

# Configurar WhiteNoise para servir archivos media también
WHITENOISE_SERVE_STATIC_FILES = True
WHITENOISE_STATIC_PREFIX = '/static/'

# Configuración de archivos media
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# Configuración de almacenamiento (Cloudinary en producción)
DEFAULT_FILE_STORAGE = DEFAULT_FILE_STORAGE
if DEFAULT_FILE_STORAGE == 'cloudinary_storage.storage.MediaCloudinaryStorage':
    # Configurar Cloudinary
    CLOUDINARY_STORAGE = CLOUDINARY_STORAGE
    # La URL de media será servida por Cloudinary
    print("✓ Usando Cloudinary para almacenamiento de archivos media")
else:
    print("⚠ Usando almacenamiento local para archivos media")

# Configurar rutas adicionales para WhiteNoise (incluir media) - Solo si no usamos Cloudinary
WHITENOISE_ROOT = os.path.join(BASE_DIR, 'staticfiles')
if DEFAULT_FILE_STORAGE != 'cloudinary_storage.storage.MediaCloudinaryStorage':
    WHITENOISE_DIRECTORIES = [
        ('media', os.path.join(BASE_DIR, 'media')),
    ]

# CORS para producción
CORS_ALLOWED_ORIGINS = [
    "https://safevg.vercel.app",  # URL de producción
    config('FRONTEND_URL', default='http://localhost:5173'),
]

CORS_ALLOW_CREDENTIALS = True

# URL del frontend para QR codes - DEBE APUNTAR AL FRONTEND EN PRODUCCIÓN
FRONTEND_BASE_URL = config('FRONTEND_BASE_URL', default='https://safevg.vercel.app')

# Logging para producción
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': 'safevg.log',
        },
        'console': {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['file', 'console'],
            'level': 'INFO',
            'propagate': True,
        },
    },
}

# Configuración de email para producción (opcional)
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = config('EMAIL_HOST', default='smtp.gmail.com')
EMAIL_PORT = config('EMAIL_PORT', default=587, cast=int)
EMAIL_USE_TLS = True
EMAIL_HOST_USER = config('EMAIL_HOST_USER', default='')
EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD', default='')
