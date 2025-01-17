# filepath: /c:/Users/Francisco/Documents/SIGDDES/django_crud_api/urls.py
from django.contrib import admin
from django.urls import path, include
from rest_framework import routers
from tasks.views import home, TaskViewSet, SafeSpaceViewSet
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from rest_framework.permissions import AllowAny

router = routers.DefaultRouter()
router.register(r'tasks', TaskViewSet, 'task')
router.register(r'puntos', SafeSpaceViewSet)

schema_view = get_schema_view(
    openapi.Info(
        title="Tasks API",
        default_version='v1',
        description="RESTful API for Tasks",
    ),
    public=True,
    permission_classes=(AllowAny,),
)

urlpatterns = [
    path('', home),
    path('admin/', admin.site.urls),
    path('tasks/', include('tasks.urls')),
    path('docs/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('api/', include(router.urls)),
]