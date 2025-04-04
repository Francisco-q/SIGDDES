from django.http import HttpResponse
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import TotemQR, ReceptionQR, Path, PathPoint
from .serializers import TotemQRSerializer, ReceptionQRSerializer, PathSerializer
from rest_framework.parsers import MultiPartParser, FormParser
from django.core.files.storage import default_storage
import math

def home(request):
    return HttpResponse("Bienvenido al backend de mapas QR")

class ImageUploadViewSet(viewsets.ViewSet):
    parser_classes = (MultiPartParser, FormParser)

    def create(self, request, *args, **kwargs):
        file = request.FILES['file']
        file_name = default_storage.save(file.name, file)
        file_url = request.build_absolute_uri(f'/media/{file_name}')
        totem_id = request.data.get('totem_id')
        if totem_id:
            try:
                totem = TotemQR.objects.get(id=totem_id)
                totem.imageUrl = file_url
                totem.save()
            except TotemQR.DoesNotExist:
                return Response({'error': 'TotemQR no encontrado'}, status=404)
        return Response({'imageUrl': file_url})

class TotemQRViewSet(viewsets.ModelViewSet):
    serializer_class = TotemQRSerializer

    def get_queryset(self):
        queryset = TotemQR.objects.all()
        campus = self.request.query_params.get('campus', None)
        if campus is not None:
            queryset = queryset.filter(campus=campus)
        return queryset

    @action(detail=True, methods=['get'])
    def nearest_path(self, request, pk=None):
        totem = self.get_object()
        receptions = ReceptionQR.objects.filter(campus=totem.campus)  # Filtrar recepciones por campus
        if not receptions:
            return Response({"error": "No hay recepciones disponibles en este campus"}, status=404)

        nearest_reception = min(receptions, key=lambda r: math.sqrt(
            (r.latitude - totem.latitude) ** 2 + (r.longitude - totem.longitude) ** 2
        ))

        path = {
            "name": f"Camino desde {totem.name} a {nearest_reception.name}",
            "points": [
                {"latitude": totem.latitude, "longitude": totem.longitude, "order": 1},
                {"latitude": nearest_reception.latitude, "longitude": nearest_reception.longitude, "order": 2},
            ],
            "campus": totem.campus  # Asociar al campus del totem
        }
        serializer = PathSerializer(data=path)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.data)

class ReceptionQRViewSet(viewsets.ModelViewSet):
    serializer_class = ReceptionQRSerializer

    def get_queryset(self):
        queryset = ReceptionQR.objects.all()
        campus = self.request.query_params.get('campus', None)
        if campus is not None:
            queryset = queryset.filter(campus=campus)
        return queryset

class PathViewSet(viewsets.ModelViewSet):
    serializer_class = PathSerializer

    def get_queryset(self):
        queryset = Path.objects.all()
        campus = self.request.query_params.get('campus', None)
        if campus is not None:
            queryset = queryset.filter(campus=campus)
        return queryset