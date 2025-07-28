from django.http import HttpResponse, Http404, FileResponse
from django.conf import settings
from django.views.decorators.cache import never_cache
from django.views.decorators.csrf import csrf_exempt
import os
import mimetypes
import logging

logger = logging.getLogger(__name__)

@never_cache
@csrf_exempt
def serve_media(request, path):
    """
    Vista personalizada para servir archivos media en producción con CORS
    """
    # Manejar preflight requests de CORS
    if request.method == 'OPTIONS':
        response = HttpResponse()
        response['Access-Control-Allow-Origin'] = '*'
        response['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
        response['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        response['Access-Control-Max-Age'] = '86400'
        return response
    
    # Construir la ruta completa del archivo
    full_path = os.path.join(settings.MEDIA_ROOT, path)
    
    # Log para debugging
    logger.info(f"Serving media file: {path}")
    logger.info(f"Full path: {full_path}")
    logger.info(f"File exists: {os.path.exists(full_path)}")
    logger.info(f"MEDIA_ROOT: {settings.MEDIA_ROOT}")
    
    # Verificar si el archivo existe
    if not os.path.exists(full_path):
        logger.error(f"File not found: {full_path}")
        # Listar contenido del directorio para debugging
        dir_path = os.path.dirname(full_path)
        if os.path.exists(dir_path):
            files = os.listdir(dir_path)
            logger.info(f"Files in {dir_path}: {files}")
        raise Http404(f"Media file not found: {path}")
    
    # Verificar que es un archivo (no directorio)
    if not os.path.isfile(full_path):
        logger.error(f"Path is not a file: {full_path}")
        raise Http404(f"Path is not a file: {path}")
    
    # Determinar content type
    content_type, _ = mimetypes.guess_type(full_path)
    if content_type is None:
        content_type = 'application/octet-stream'
    
    logger.info(f"Serving file with content type: {content_type}")
    
    try:
        # Servir el archivo con headers CORS
        response = FileResponse(
            open(full_path, 'rb'),
            content_type=content_type,
            as_attachment=False
        )
        
        # Agregar headers CORS
        response['Access-Control-Allow-Origin'] = '*'
        response['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
        response['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        response['Access-Control-Max-Age'] = '86400'
        
        return response
        
    except Exception as e:
        logger.error(f"Error serving file {full_path}: {str(e)}")
        raise Http404(f"Error serving file: {str(e)}")
