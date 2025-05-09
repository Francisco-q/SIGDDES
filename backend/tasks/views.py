from django.http import HttpResponse
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import permissions, status, viewsets
from .models import TotemQR, ReceptionQR, Path, PathPoint, UserProfile, Denuncia, ImageUpload
from .serializers import TotemQRSerializer, ReceptionQRSerializer, PathSerializer, DenunciaSerializer, UserProfileSerializer,ImageUploadSerializer
from .permissions import RoleBasedPermission
from rest_framework.parsers import MultiPartParser, FormParser
from django.core.files.storage import default_storage
from django.conf import settings
from rest_framework.permissions import IsAuthenticated
from .permissions import RoleBasedPermission
import math

def home(request):
    return HttpResponse("Bienvenido al backend de mapas QR")

class TotemQRViewSet(viewsets.ModelViewSet):
    serializer_class = TotemQRSerializer
    permission_classes = [RoleBasedPermission]

    def get_queryset(self):
        queryset = TotemQR.objects.all()
        campus = self.request.query_params.get('campus', None)
        if campus is not None:
            queryset = queryset.filter(campus=campus)
        return queryset

    @action(detail=True, methods=['get'])
    def nearest_path(self, request, pk=None):
        totem = self.get_object()
        receptions = ReceptionQR.objects.filter(campus=totem.campus)
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
            "campus": totem.campus
        }
        serializer = PathSerializer(data=path)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.data)

class ReceptionQRViewSet(viewsets.ModelViewSet):
    serializer_class = ReceptionQRSerializer
    permission_classes = [RoleBasedPermission]

    def get_queryset(self):
        queryset = ReceptionQR.objects.all()
        campus = self.request.query_params.get('campus', None)
        if campus is not None:
            queryset = queryset.filter(campus=campus)
        return queryset

class PathViewSet(viewsets.ModelViewSet):
    serializer_class = PathSerializer
    permission_classes = [RoleBasedPermission]

    def get_queryset(self):
        queryset = Path.objects.all()
        campus = self.request.query_params.get('campus', None)
        if campus is not None:
            queryset = queryset.filter(campus=campus)
        return queryset

class UserProfileViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserProfileSerializer

    def get_queryset(self):
        return UserProfile.objects.filter(user=self.request.user)

    @action(detail=False, methods=['get'])
    def current_user(self, request):
        try:
            profile = request.user.userprofile
            return Response({
                'username': request.user.username,
                'role': profile.role
            })
        except UserProfile.DoesNotExist:
            return Response({
                'username': request.user.username,
                'role': 'guest'  # O crea un UserProfile aquí
            }, status=200)

class DenunciaViewSet(viewsets.ModelViewSet):
    queryset = Denuncia.objects.all()
    serializer_class = DenunciaSerializer
    permission_classes = [permissions.IsAuthenticated]

class ImageUploadView(APIView):
    permission_classes = [RoleBasedPermission]
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request, *args, **kwargs):
        if request.method not in permissions.SAFE_METHODS:  # Solo aplica para POST
            if not request.user.is_authenticated or request.user.userprofile.role != 'admin':
                return Response({'detail': 'Solo administradores pueden subir imágenes.'}, status=status.HTTP_403_FORBIDDEN)

        point_id = request.POST.get('point_id')
        point_type = request.POST.get('point_type')
        campus = request.POST.get('campus')

        if not all([point_id, point_type, campus]):
            return Response({'detail': 'Faltan parámetros requeridos (point_id, point_type, campus).'}, status=status.HTTP_400_BAD_REQUEST)

        if point_type not in ['totem', 'reception']:
            return Response({'detail': 'Tipo de punto inválido.'}, status=status.HTTP_400_BAD_REQUEST)

        if point_type == 'totem' and not TotemQR.objects.filter(id=point_id, campus=campus).exists():
            return Response({'detail': 'TotemQR no encontrado o no pertenece a este campus.'}, status=status.HTTP_404_NOT_FOUND)
        if point_type == 'reception' and not ReceptionQR.objects.filter(id=point_id, campus=campus).exists():
            return Response({'detail': 'ReceptionQR no encontrado o no pertenece a este campus.'}, status=status.HTTP_404_NOT_FOUND)

        if not request.FILES.get('file'):
            return Response({'detail': 'No se proporcionó un archivo.'}, status=status.HTTP_400_BAD_REQUEST)

        file_obj = request.FILES['file']
        file_path = default_storage.save(f'images/points/{campus}/{point_id}_{file_obj.name}', file_obj)
        full_url = request.build_absolute_uri(default_storage.url(file_path))

        image_upload = ImageUpload.objects.create(
            point_id=point_id,
            point_type=point_type,
            campus=campus,
            image=file_path
        )

        serializer = ImageUploadSerializer(image_upload, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class ImageListView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)

    def get(self, request, *args, **kwargs):
        point_id = request.query_params.get('point_id')
        point_type = request.query_params.get('point_type')
        campus = request.query_params.get('campus')

        if not all([point_id, point_type, campus]):
            return Response({'detail': 'Faltan parámetros requeridos (point_id, point_type, campus).'}, status=status.HTTP_400_BAD_REQUEST)

        if point_type not in ['totem', 'reception']:
            return Response({'detail': 'Tipo de punto inválido.'}, status=status.HTTP_400_BAD_REQUEST)

        # Validar que el point_id existe
        if point_type == 'totem' and not TotemQR.objects.filter(id=point_id, campus=campus).exists():
            return Response({'detail': 'TotemQR no encontrado o no pertenece a este campus.'}, status=status.HTTP_404_NOT_FOUND)
        if point_type == 'reception' and not ReceptionQR.objects.filter(id=point_id, campus=campus).exists():
            return Response({'detail': 'ReceptionQR no encontrado o no pertenece a este campus.'}, status=status.HTTP_404_NOT_FOUND)

        # Obtener las imágenes asociadas
        images = ImageUpload.objects.filter(point_id=point_id, point_type=point_type, campus=campus)
        serializer = ImageUploadSerializer(images, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)