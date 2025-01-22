from django.urls import path, include
from rest_framework.routers import DefaultRouter
from tasks.views import TaskViewSet, home

router = DefaultRouter()
router.register(r'tasks', TaskViewSet)

urlpatterns = [
    path('', home),
    path('api/', include(router.urls)),
]
#esto genera las rutas para el api rest de la app tasks get, post, put, delete