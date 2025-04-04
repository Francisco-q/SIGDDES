from django.contrib import admin
from django.urls import path, include, re_path
from rest_framework.routers import DefaultRouter
from tasks.views import TotemQRViewSet, ReceptionQRViewSet, PathViewSet, home
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from rest_framework.permissions import AllowAny

router = DefaultRouter()
router.register(r'totems', TotemQRViewSet, basename='totemqr')
router.register(r'recepciones', ReceptionQRViewSet, basename='receptionqr')
router.register(r'caminos', PathViewSet, basename='path')

schema_view = get_schema_view(
    openapi.Info(
        title="QR Maps API",
        default_version='v1',
        description="RESTful API for QR Totems, Receptions, and Paths",
    ),
    public=True,
    permission_classes=(AllowAny,),
)

urlpatterns = [
    path('', home),
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),  # Endpoints: /api/totems/, /api/recepciones/, /api/caminos/
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    re_path(r'^swagger(?P<format>\.json|\.yaml)$', schema_view.without_ui(cache_timeout=0), name='schema-json'),
    path('docs/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
]