from django.urls import path, include
from rest_framework.routers import DefaultRouter
from tasks.views import SafeSpaceViewSet, StartingPointViewSet, PathViewSet, ImageUploadViewSet, home

router = DefaultRouter()
router.register(r'puntos', SafeSpaceViewSet)
router.register(r'partidas', StartingPointViewSet)
router.register(r'caminos', PathViewSet)
router.register(r'puntos', PointViewSet, basename='puntos')
router.register(r'caminos', PathViewSet, basename='caminos')
router.register(r'upload', ImageUploadViewSet, basename='upload')
router.register(r'denuncias', DenunciaViewSet, basename='denuncia')

urlpatterns = [
    path('', home),
    path('/api', include(router.urls)),
]