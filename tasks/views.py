from rest_framework import viewsets
from django.http import HttpResponse

from tasks.models import SafeSpace
from tasks.serializer import TaskSerializer

class TaskViewSet(viewsets.ModelViewSet):
    queryset = SafeSpace.objects.all()
    serializer_class = TaskSerializer

def home(request):
    return HttpResponse("Welcome to the SafeSpace API")
