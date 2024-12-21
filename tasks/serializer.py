from rest_framework import serializers
from tasks.models import SafeSpace

class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = SafeSpace
        fields = '__all__'