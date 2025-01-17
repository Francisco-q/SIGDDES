from rest_framework import viewsets
from django.http import HttpResponse

from tasks.models import SafeSpace
from tasks.serializer import SafeSpaceSerializer, TaskSerializer

class TaskViewSet(viewsets.ModelViewSet):
    queryset = SafeSpace.objects.all()
    serializer_class = TaskSerializer

class SafeSpaceViewSet(viewsets.ModelViewSet):
    queryset = SafeSpace.objects.all()
    serializer_class = SafeSpaceSerializer

def home(request):
    return HttpResponse("Welcome to the SafeSpace API")