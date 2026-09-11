"""Configuración de SAFE-VG para la VM DEV de la Universidad de Talca."""

import os

from decouple import config

from .settings import *  # noqa: F403


DEBUG = False

SECRET_KEY = config('SECRET_KEY')
if SECRET_KEY.startswith('django-insecure-'):
    raise RuntimeError('SECRET_KEY debe ser una clave segura en el ambiente UTalca')

ALLOWED_HOSTS = [
    host.strip()
    for host in config(
        'ALLOWED_HOSTS',
        default='localhost,127.0.0.1',
    ).split(',')
    if host.strip()
]

# El correo institucional entregó un SID, no un service name. Por eso se usa
# un descriptor Oracle explícito en vez de la sintaxis host:puerto/servicio.
ORACLE_HOST = config('ORACLE_HOST')
ORACLE_PORT = config('ORACLE_PORT', default='1521')
ORACLE_SID = config('ORACLE_SID')
ORACLE_DSN = (
    '(DESCRIPTION='
    f'(ADDRESS=(PROTOCOL=TCP)(HOST={ORACLE_HOST})(PORT={ORACLE_PORT}))'
    f'(CONNECT_DATA=(SID={ORACLE_SID})))'
)

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.oracle',
        'NAME': ORACLE_DSN,
        'USER': config('ORACLE_USER'),
        'PASSWORD': config('ORACLE_PASSWORD'),
        'CONN_MAX_AGE': config('DB_CONN_MAX_AGE', default=60, cast=int),
        'CONN_HEALTH_CHECKS': True,
    }
}

FRONTEND_BASE_URL = config('FRONTEND_BASE_URL', default='http://localhost')

# Nginx entrega frontend y API bajo el mismo origen. Esta lista solo es
# necesaria para acceso directo al backend durante diagnóstico.
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = [
    origin.strip()
    for origin in config('CORS_ALLOWED_ORIGINS', default='').split(',')
    if origin.strip()
]
CORS_ALLOW_CREDENTIALS = True

CSRF_TRUSTED_ORIGINS = [
    origin.strip()
    for origin in config('CSRF_TRUSTED_ORIGINS', default='').split(',')
    if origin.strip()
]

STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')  # noqa: F405
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')  # noqa: F405

STORAGES = {
    'default': {
        'BACKEND': 'django.core.files.storage.FileSystemStorage',
    },
    'staticfiles': {
        'BACKEND': 'whitenoise.storage.CompressedManifestStaticFilesStorage',
    },
}

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    *MIDDLEWARE[1:],  # noqa: F405
]

SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SECURE_SSL_REDIRECT = config('SECURE_SSL_REDIRECT', default=False, cast=bool)
SESSION_COOKIE_SECURE = config('SESSION_COOKIE_SECURE', default=False, cast=bool)
CSRF_COOKIE_SECURE = config('CSRF_COOKIE_SECURE', default=False, cast=bool)
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {'console': {'class': 'logging.StreamHandler'}},
    'root': {'handlers': ['console'], 'level': config('LOG_LEVEL', default='INFO')},
}
