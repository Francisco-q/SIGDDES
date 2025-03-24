from rest_framework import serializers
from tasks.models import SafeSpace
from tasks.models import StartingPoint

class SafeSpaceSerializer(serializers.ModelSerializer):
    class Meta:
        model = SafeSpace
        fields = ['id', 'x', 'y', 'info', 'campus']

class StartingPointSerializer(serializers.ModelSerializer):
    class Meta:
        model = StartingPoint
        fields = ['id', 'x', 'y', 'info', 'campus']

class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = SafeSpace
        fields = '__all__'