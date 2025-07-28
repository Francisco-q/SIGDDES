"""
Middleware personalizado para servir archivos media en producción usando WhiteNoise
"""
import os
from whitenoise import WhiteNoise
from django.conf import settings
from django.core.files.storage import default_storage
from django.http import HttpResponse, Http404
import mimetypes

class MediaWhiteNoiseMiddleware:
    """
    Middleware para servir archivos media en producción usando WhiteNoise
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
        
    def __call__(self, request):
        # Si la URL empieza con /media/, intentar servir el archivo
        if request.path.startswith('/media/'):
            # Manejar preflight requests de CORS
            if request.method == 'OPTIONS':
                response = HttpResponse()
                response['Access-Control-Allow-Origin'] = '*'
                response['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
                response['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
                response['Access-Control-Max-Age'] = '86400'
                return response
            return self.serve_media(request)
            
        response = self.get_response(request)
        return response
        
    def serve_media(self, request):
        """
        Servir archivos media directamente con headers CORS
        """
        try:
            # Obtener la ruta del archivo
            path = request.path[7:]  # Remover '/media/'
            
            # Verificar si el archivo existe
            if not default_storage.exists(path):
                raise Http404("Archivo no encontrado")
                
            # Obtener el archivo
            file_obj = default_storage.open(path)
            content_type, _ = mimetypes.guess_type(path)
            if content_type is None:
                content_type = 'application/octet-stream'
                
            response = HttpResponse(file_obj.read(), content_type=content_type)
            response['Content-Disposition'] = f'inline; filename="{os.path.basename(path)}"'
            
            # Agregar headers CORS para permitir acceso desde el frontend
            response['Access-Control-Allow-Origin'] = '*'
            response['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
            response['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
            response['Access-Control-Max-Age'] = '86400'  # 24 horas
            
            return response
            
        except Exception as e:
            print(f"Error sirviendo media file: {e}")
            raise Http404("Error sirviendo archivo")
