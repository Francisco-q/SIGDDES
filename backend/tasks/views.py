from django.http import HttpResponse
import networkx as nx
from django.db.models import Q
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
import os

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
        if self.action in ['create', 'update', 'partial_update', 'destroy', 'generate_qr']:
            return [RoleBasedPermission()]
        return [AllowAny()]

    def calculate_distance(self, p1_lat, p1_lon, p2_lat, p2_lon):
        return math.sqrt((p1_lat - p2_lat) ** 2 + (p1_lon - p2_lon) ** 2)

    def build_graph(self, campus):
        G = nx.Graph()
        paths = Path.objects.filter(campus=campus).prefetch_related('points')
        
        for path in paths:
            points = path.points.order_by('order')
            for i in range(len(points) - 1):
                p1 = points[i]
                p2 = points[i + 1]
                G.add_edge(
                    (p1.latitude, p1.longitude),
                    (p2.latitude, p2.longitude),
                    weight=self.calculate_distance(p1.latitude, p1.longitude, p2.latitude, p2.longitude)
                )
        
        totems = TotemQR.objects.filter(campus=campus)
        receptions = ReceptionQR.objects.filter(campus=campus)
        all_points = list(points.values_list('latitude', 'longitude', flat=False))

        for totem in totems:
            G.add_node((totem.latitude, totem.longitude))
            for point in all_points:
                if abs(totem.latitude - point[0]) < 0.0001 and abs(totem.longitude - point[1]) < 0.0001:
                    G.add_edge(
                        (totem.latitude, totem.longitude),
                        point,
                        weight=0
                    )

        for reception in receptions:
            G.add_node((reception.latitude, reception.longitude))
            for point in all_points:
                if abs(reception.latitude - point[0]) < 0.0001 and abs(reception.longitude - point[1]) < 0.0001:
                    G.add_edge(
                        (reception.latitude, reception.longitude),
                        point,
                        weight=0
                    )

        return G

    @action(detail=True, methods=['post'], permission_classes=[RoleBasedPermission])
    def generate_qr(self, request, pk=None):
        totem = self.get_object()
        
        if totem.qr_image:
            return Response(
                {'detail': 'Este tótem ya tiene un código QR generado'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if not request.user.is_authenticated or request.user.userprofile.role not in ['admin', 'superuser']:
            return Response({'detail': 'Solo administradores pueden generar QRs.'}, status=status.HTTP_403_FORBIDDEN)

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
        file_path = f"qr_codes/{file_name}"  # Save to media/qr_codes/
        file_content = ContentFile(buffer.getvalue(), name=file_name)

        default_storage.save(file_path, file_content)
        qr_image_url = request.build_absolute_uri(default_storage.url(file_path))

        image_upload = ImageUpload.objects.create(
            point_id=totem.id,
            point_type='totem',
            campus=totem.campus,
            image=file_path,
            uploaded_by=request.user
        )

        totem.qr_image = qr_image_url
        totem.save()

        serializer = ImageUploadSerializer(image_upload, context={'request': request})
        return Response({
            'qr_image': totem.qr_image,
            'image_upload': serializer.data
        }, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'])
    def nearest_path(self, request, pk=None):
        totem = self.get_object()
        G = self.build_graph(totem.campus)
        receptions = ReceptionQR.objects.filter(campus=totem.campus)

        if not receptions:
            return Response({"error": "No hay recepciones en este campus"}, status=404)

        shortest_path = None
        min_distance = float('inf')
        totem_coords = (totem.latitude, totem.longitude)

        for reception in receptions:
            reception_coords = (reception.latitude, reception.longitude)
            try:
                path = nx.shortest_path(G, totem_coords, reception_coords, weight='weight')
                distance = nx.shortest_path_length(G, totem_coords, reception_coords, weight='weight')
                if distance < min_distance:
                    min_distance = distance
                    shortest_path = path
            except nx.NetworkXNoPath:
                continue

        if not shortest_path:
            return Response({"error": "No se encontró un camino a ninguna recepción"}, status=404)

        path_points = [{"latitude": lat, "longitude": lon, "order": idx} for idx, (lat, lon) in enumerate(shortest_path)]
        path_data = {
            "name": f"Camino desde {totem.name} a la recepción más cercana",
            "points": path_points,
            "campus": totem.campus
        }

        serializer = PathSerializer(data=path_data)
        if serializer.is_valid():
            return Response(serializer.data)
        else:
            print("Errores de serialización:", serializer.errors)
            return Response(serializer.errors, status=400)

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
        if self.action in ['create', 'update', 'partial_update', 'destroy', 'generate_qr']:
            return [RoleBasedPermission()]
        return [AllowAny()]

    @action(detail=True, methods=['post'], permission_classes=[RoleBasedPermission])
    def generate_qr(self, request, pk=None):
        reception = self.get_object()
        if reception.qr_image:
            return Response(
                {'detail': 'Este espacio seguro ya tiene un código QR generado'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if not request.user.is_authenticated or request.user.userprofile.role not in ['admin', 'superuser']:
            return Response({'detail': 'Solo administradores pueden generar QRs.'}, status=status.HTTP_403_FORBIDDEN)

        qr_url = f"{settings.FRONTEND_BASE_URL}/mapa2/{reception.campus}?pointId={reception.id}&pointType=reception"
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
        file_name = f"qr_reception_{reception.id}_{reception.campus}.png"
        file_path = f"qr_codes/{file_name}"  # Save to media/qr_codes/
        file_content = ContentFile(buffer.getvalue(), name=file_name)

        default_storage.save(file_path, file_content)
        qr_image_url = request.build_absolute_uri(default_storage.url(file_path))

        image_upload = ImageUpload.objects.create(
            point_id=reception.id,
            point_type='reception',
            campus=reception.campus,
            image=file_path,
            uploaded_by=request.user
        )

        reception.qr_image = qr_image_url
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
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [RoleBasedPermission()]
        return [AllowAny()]

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
        try:
            jira_response = self.create_jira_issue(serializer.validated_data)
            print(f"Issue de Jira creado: {jira_response}")
        except Exception as e:
            print(f"No se pudo crear el issue en Jira: {e}")

    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)
            
    def create_jira_issue(self, denuncia_data):
        url = f"{settings.JIRA_API_URL}/rest/api/3/issue"
        auth = (settings.JIRA_EMAIL, settings.JIRA_API_TOKEN)
        headers = {
            "Accept": "application/json",
            "Content-Type": "application/json",
        }
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

        file_path = f'images/points/{campus}/{point_id}_{file_obj.name}'
        # Guardar el archivo físicamente
        from django.core.files.storage import default_storage
        saved_path = default_storage.save(file_path, file_obj)

        image_upload = ImageUpload.objects.create(
            point_id=point_id,
            point_type=point_type,
            campus=campus,
            image=saved_path
        )

        serializer = ImageUploadSerializer(image_upload, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class ImageListView(viewsets.ViewSet):
    permission_classes = [AllowAny]

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
        images = [img for img in images if os.path.exists(os.path.join(settings.MEDIA_ROOT, img.image.name))]
        serializer = ImageUploadSerializer(images, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated()]
        return [AllowAny()]

class ReporteAtencionViewSet(viewsets.ModelViewSet):
    queryset = ReporteAtencion.objects.all()
    serializer_class = ReporteAtencionSerializer
    permission_classes = [AllowAny]