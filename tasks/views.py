from rest_framework import viewsets
from django.http import HttpResponse
from tasks.models import SafeSpace, StartingPoint
from tasks.serializer import SafeSpaceSerializer, TaskSerializer, StartingPointSerializer

class TaskViewSet(viewsets.ModelViewSet):
    queryset = SafeSpace.objects.all()
    serializer_class = TaskSerializer

class SafeSpaceViewSet(viewsets.ModelViewSet):
    queryset = SafeSpace.objects.all()
    serializer_class = SafeSpaceSerializer
    
    def get_queryset(self):
        campus = self.request.query_params.get('campus', None)
        if campus is not None:
            return SafeSpace.objects.filter(campus=campus)
        return SafeSpace.objects.all()

class StartingPointViewSet(viewsets.ModelViewSet):
    queryset = StartingPoint.objects.all()
    serializer_class = StartingPointSerializer

    def get_queryset(self):
        campus = self.request.query_params.get('campus', None)
        if campus is not None:
            return StartingPoint.objects.filter(campus=campus)
        return StartingPoint.objects.all()


def home(request):
    return HttpResponse("Welcome to the SafeSpace API")