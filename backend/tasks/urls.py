from django.urls import path, include
from rest_framework.routers import DefaultRouter
from tasks.views import SafeSpaceViewSet, StartingPointViewSet, PathViewSet, ImageUploadViewSet, home, ReporteAtencionViewSet, DenunciaViewSet, PerfilUsuarioViewSet, ImageListView, ImageUploadView, PointViewSet

router = DefaultRouter()
router.register(r'puntos', SafeSpaceViewSet)
router.register(r'partidas', StartingPointViewSet)
router.register(r'caminos', PathViewSet)
router.register(r'puntos', PointViewSet, basename='puntos')
router.register(r'caminos', PathViewSet, basename='caminos')
router.register(r'upload', ImageUploadView, basename='upload')
router.register(r'denuncias', DenunciaViewSet, basename='denuncias')
router.register(r'usuario', PerfilUsuarioViewSet, basename='usuario')
router.register(r'images', ImageListView, basename='images')
router.register(r'upload', ImageUploadViewSet, basename='upload')
router.register(r'reportes-atencion', ReporteAtencionViewSet, basename='reporteatencion')

urlpatterns = [
    path('', home),
    path('/api', include(router.urls)),
]