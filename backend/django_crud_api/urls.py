from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from rest_framework.routers import DefaultRouter
from tasks.views import TotemQRViewSet, ReceptionQRViewSet, PathViewSet, UserProfileViewSet, ImageUploadViewSet, home
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.conf.urls.static import static

router = DefaultRouter()
router.register(r'totems', TotemQRViewSet, basename='totemqr')
router.register(r'recepciones', ReceptionQRViewSet, basename='receptionqr')
router.register(r'caminos', PathViewSet, basename='path')
router.register(r'user', UserProfileViewSet, basename='user')
router.register(r'image-upload', ImageUploadViewSet, basename='image-upload')

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
    path('api/', include(router.urls)),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    re_path(r'^swagger(?P<format>\.json|\.yaml)$', schema_view.without_ui(cache_timeout=0), name='schema-json'),
    path('docs/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
]+ static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)