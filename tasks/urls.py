from rest_framework import routers
from django.urls import path, include
from tasks import views

router = routers.DefaultRouter()
router.register(r'tasks', views.TaskViewSet, 'task')

urlpatterns = [
    path('api/v1/', include(router.urls))
]

#esto genera las rutas para el api rest de la app tasks get, post, put, delete