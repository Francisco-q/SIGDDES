from django.http import HttpResponse
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import permissions, status, viewsets
from .models import TotemQR, ReceptionQR, Path, PathPoint, UserProfile, Denuncia, ImageUpload, ReporteAtencion
from .serializers import TotemQRSerializer, ReceptionQRSerializer, PathSerializer, DenunciaSerializer, UserProfileSerializer, ImageUploadSerializer, ReporteAtencionSerializer
from .permissions import RoleBasedPermission
from rest_framework.parsers import MultiPartParser, FormParser
from django.core.files.storage import default_storage
from django.conf import settings
from rest_framework.permissions import IsAuthenticated, AllowAny
import math
import requests
import qrcode
from io import BytesIO
from django.core.files.base import ContentFile

def home(request):
    return HttpResponse("Bienvenido al backend de mapas QR")

class TotemQRViewSet(viewsets.ModelViewSet):
    serializer_class = TotemQRSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        queryset = TotemQR.objects.all()
        campus = self.request.query_params.get('campus', None)
        if campus is not None:
            queryset = queryset.filter(campus=campus)
        return queryset
    
    def get_permissions(self):
        # Restrict POST, PUT, DELETE to authenticated users with appropriate roles
        if self.action in ['create', 'update', 'partial_update', 'destroy', 'generate_qr']:
            return [RoleBasedPermission()]
        return [AllowAny()]  # Allow GET and nearest_path for all

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

    @action(detail=True, methods=['post'], permission_classes=[RoleBasedPermission])
    def generate_qr(self, request, pk=None):
        totem = self.get_object()
        if not request.user.is_authenticated or request.user.userprofile.role not in ['admin', 'superuser']:
            return Response({'detail': 'Solo administradores pueden generar QRs.'}, status=status.HTTP_403_FORBIDDEN)

        # Generar URL para el QR
        qr_url = f"http://localhost:5173/mapa2/{totem.campus}?pointId={totem.id}&pointType=totem"
        
        # Crear el QR
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(qr_url)
        qr.make(fit=True)
        
        # Convertir a imagen
        img = qr.make_image(fill_color="black", back_color="white")
        buffer = BytesIO()
        img.save(buffer, format="PNG")
        file_name = f"qr_totem_{totem.id}_{totem.campus}.png"
        file_content = ContentFile(buffer.getvalue(), name=file_name)

        # Guardar en ImageUpload
        image_upload = ImageUpload.objects.create(
            point_id=totem.id,
            point_type='totem',
            campus=totem.campus,
            image=file_content,
            uploaded_by=request.user
        )

        # Actualizar el campo qr_image
        totem.qr_image = request.build_absolute_uri(default_storage.url(image_upload.image.name))
        totem.save()

        serializer = ImageUploadSerializer(image_upload, context={'request': request})
        return Response({
            'qr_image': totem.qr_image,
            'image_upload': serializer.data
        }, status=status.HTTP_201_CREATED)

class ReceptionQRViewSet(viewsets.ModelViewSet):
    serializer_class = ReceptionQRSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        queryset = ReceptionQR.objects.all()
        campus = self.request.query_params.get('campus', None)
        if campus is not None:
            queryset = queryset.filter(campus=campus)
        return queryset

    def get_permissions(self):
        # Restrict POST, PUT, DELETE to authenticated users with appropriate roles
        if self.action in ['create', 'update', 'partial_update', 'destroy', 'generate_qr']:
            return [RoleBasedPermission()]
        return [AllowAny()]  # Allow GET for all

    @action(detail=True, methods=['post'], permission_classes=[RoleBasedPermission])
    def generate_qr(self, request, pk=None):
        reception = self.get_object()
        if not request.user.is_authenticated or request.user.userprofile.role not in ['admin', 'superuser']:
            return Response({'detail': 'Solo administradores pueden generar QRs.'}, status=status.HTTP_403_FORBIDDEN)

        # Generar URL para el QR
        qr_url = f"http://localhost:5173/mapa2/{reception.campus}?pointId={reception.id}&pointType=reception"
        
        # Crear el QR
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(qr_url)
        qr.make(fit=True)
        
        # Convertir a imagen
        img = qr.make_image(fill_color="black", back_color="white")
        buffer = BytesIO()
        img.save(buffer, format="PNG")
        file_name = f"qr_reception_{reception.id}_{reception.campus}.png"
        file_content = ContentFile(buffer.getvalue(), name=file_name)

        # Guardar en ImageUpload
        image_upload = ImageUpload.objects.create(
            point_id=reception.id,
            point_type='reception',
            campus=reception.campus,
            image=file_content,
            uploaded_by=request.user
        )

        # Actualizar el campo qr_image
        reception.qr_image = request.build_absolute_uri(default_storage.url(image_upload.image.name))
        reception.save()

        serializer = ImageUploadSerializer(image_upload, context={'request': request})
        return Response({
            'qr_image': reception.qr_image,
            'image_upload': serializer.data
        }, status=status.HTTP_201_CREATED)

class PathViewSet(viewsets.ModelViewSet):
    serializer_class = PathSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        queryset = Path.objects.all()
        campus = self.request.query_params.get('campus', None)
        if campus is not None:
            queryset = queryset.filter(campus=campus)
        return queryset

    def get_permissions(self):
        # Restrict POST, PUT, DELETE to authenticated users with appropriate roles
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [RoleBasedPermission()]
        return [AllowAny()]  # Allow GET for all

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
                'role': 'guest'
            }, status=200)

class PerfilUsuarioViewSet(viewsets.GenericViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = UserProfileSerializer
    queryset = UserProfile.objects.all()

    def get_queryset(self):
        return UserProfile.objects.filter(user=self.request.user)

    @action(detail=False, methods=['get'], url_path='perfil')
    def retrieve_profile(self, request):
        try:
            profile = self.get_queryset().get()
            serializer = self.get_serializer(profile, context={'request': request})
            return Response(serializer.data)
        except UserProfile.DoesNotExist:
            return Response({'detail': 'Perfil de usuario no encontrado'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['patch'], url_path='perfil')
    def update_profile(self, request):
        try:
            profile = self.get_queryset().get()
            serializer = self.get_serializer(profile, data=request.data, partial=True, context={'request': request})
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except UserProfile.DoesNotExist:
            return Response({'detail': 'Perfil de usuario no encontrado'}, status=status.HTTP_404_NOT_FOUND)

class DenunciaViewSet(viewsets.ModelViewSet):
    queryset = Denuncia.objects.all()
    serializer_class = DenunciaSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        denuncia = serializer.save(usuario=self.request.user)
        # Crear issue en Jira
        try:
            jira_response = self.create_jira_issue(serializer.validated_data)
            print(f"Issue de Jira creado: {jira_response}")
        except Exception as e:
            print(f"No se pudo crear el issue en Jira: {e}")
            # Opcional: decidir si fallar la creación de la denuncia si Jira falla
            # raise e

    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)
            
    def create_jira_issue(self, denuncia_data):
        url = f"{settings.JIRA_API_URL}/rest/api/3/issue"
        auth = (settings.JIRA_EMAIL, settings.JIRA_API_TOKEN)
        headers = {
            "Accept": "application/json",
            "Content-Type": "application/json",
        }
        # Formatear todos los campos en la descripción
        description_content = [
            {
                "type": "paragraph",
                "content": [
                    {"type": "text", "text": f"Nombre: {denuncia_data.get('nombre', 'No especificado')}"}
                ]
            },
            {
                "type": "paragraph",
                "content": [
                    {"type": "text", "text": f"Apellido: {denuncia_data.get('apellido', 'No especificado')}"}
                ]
            },
            {
                "type": "paragraph",
                "content": [
                    {"type": "text", "text": f"Correo Electrónico: {denuncia_data.get('email', 'No especificado')}"}
                ]
            },
            {
                "type": "paragraph",
                "content": [
                    {"type": "text", "text": f"Teléfono: {denuncia_data.get('telefono', 'No especificado')}"}
                ]
            },
            {
                "type": "paragraph",
                "content": [
                    {"type": "text", "text": f"Tipo de Incidente: {denuncia_data.get('tipo_incidente', 'No especificado')}"}
                ]
            },
            {
                "type": "paragraph",
                "content": [
                    {"type": "text", "text": f"Fecha del Incidente: {denuncia_data.get('fecha_incidente', 'No especificado')}"}
                ]
            },
            {
                "type": "paragraph",
                "content": [
                    {"type": "text", "text": f"Lugar del Incidente: {denuncia_data.get('lugar_incidente', 'No especificado')}"}
                ]
            },
            {
                "type": "paragraph",
                "content": [
                    {"type": "text", "text": f"Descripción: {denuncia_data.get('descripcion', 'No especificado')}"}
                ]
            },
            {
                "type": "paragraph",
                "content": [
                    {"type": "text", "text": f"Campus: {denuncia_data.get('campus', 'No especificado')}"}
                ]
            },
            {
                "type": "paragraph",
                "content": [
                    {"type": "text", "text": f"Encargado de Acogida: {denuncia_data.get('encargado_acogida', 'No especificado')}"}
                ]
            },
        ]
        issue_data = {
            "fields": {
                "project": {"key": settings.JIRA_PROJECT_KEY},
                "summary": f"Caso de acogida: {denuncia_data.get('nombre', '')} {denuncia_data.get('apellido', '')}",
                "description": {
                    "type": "doc",
                    "version": 1,
                    "content": description_content
                },
                "issuetype": {"name": "Task"},
            }
        }
        print("Payload enviado a Jira:", issue_data)
        try:
            response = requests.post(url, json=issue_data, auth=auth, headers=headers)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.HTTPError as e:
            print(f"Error al crear issue en Jira: {e}")
            print(f"Detalles del error: {response.text}")
            error_details = response.text
            raise Exception(f"Error de Jira: {error_details}")

class ImageUploadView(viewsets.ViewSet):
    permission_classes = [RoleBasedPermission]
    parser_classes = (MultiPartParser, FormParser)

    def create(self, request, *args, **kwargs):
        if not request.user.is_authenticated or request.user.userprofile.role != 'admin':
            return Response({'detail': 'Solo administradores pueden subir imágenes.'}, status=status.HTTP_403_FORBIDDEN)

        point_id = request.data.get('point_id')
        point_type = request.data.get('point_type')
        campus = request.data.get('campus')

        if not all([point_id, point_type, campus]):
            return Response({'detail': 'Faltan parámetros requeridos (point_id, point_type, campus).'}, status=status.HTTP_400_BAD_REQUEST)

        if point_type not in ['totem', 'reception']:
            return Response({'detail': 'Tipo de punto inválido.'}, status=status.HTTP_400_BAD_REQUEST)

        if point_type == 'totem' and not TotemQR.objects.filter(id=point_id, campus=campus).exists():
            return Response({'detail': 'TotemQR no encontrado o no pertenece a este campus.'}, status=status.HTTP_404_NOT_FOUND)
        if point_type == 'reception' and not ReceptionQR.objects.filter(id=point_id, campus=campus).exists():
            return Response({'detail': 'ReceptionQR no encontrado o no pertenece a este campus.'}, status=status.HTTP_404_NOT_FOUND)

        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({'detail': 'No se proporcionó un archivo.'}, status=status.HTTP_400_BAD_REQUEST)

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

class ImageListView(viewsets.ViewSet):
    permission_classes = [AllowAny]  # Allow unauthenticated access for GET

    def list(self, request, *args, **kwargs):
        point_id = request.query_params.get('point_id')
        point_type = request.query_params.get('point_type')
        campus = request.query_params.get('campus')

        if not all([point_id, point_type, campus]):
            return Response({'detail': 'Faltan parámetros requeridos (point_id, point_type, campus).'}, status=status.HTTP_400_BAD_REQUEST)

        if point_type not in ['totem', 'reception']:
            return Response({'detail': 'Tipo de punto inválido.'}, status=status.HTTP_400_BAD_REQUEST)

        if point_type == 'totem' and not TotemQR.objects.filter(id=point_id, campus=campus).exists():
            return Response({'detail': 'TotemQR no encontrado o no pertenece a este campus.'}, status=status.HTTP_404_NOT_FOUND)
        if point_type == 'reception' and not ReceptionQR.objects.filter(id=point_id, campus=campus).exists():
            return Response({'detail': 'ReceptionQR no encontrado o no pertenece a este campus.'}, status=status.HTTP_404_NOT_FOUND)

        images = ImageUpload.objects.filter(point_id=point_id, point_type=point_type, campus=campus)
        serializer = ImageUploadSerializer(images, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    def get_permissions(self):
        # Restrict any future non-GET actions (e.g., POST, DELETE) to authenticated users
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated()]
        return [AllowAny()]  # Allow GET for all

class ReporteAtencionViewSet(viewsets.ModelViewSet):
    queryset = ReporteAtencion.objects.all()
    serializer_class = ReporteAtencionSerializer
    permission_classes = [AllowAny]
