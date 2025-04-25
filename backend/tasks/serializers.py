from rest_framework import serializers
from .models import TotemQR, ReceptionQR, Path, PathPoint, Denuncia, UserProfile
from django.contrib.auth.models import User

class PathPointSerializer(serializers.ModelSerializer):
    class Meta:
        model = PathPoint
        fields = ['latitude', 'longitude', 'order']

class PathSerializer(serializers.ModelSerializer):
    points = PathPointSerializer(many=True)
    campus = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    class Meta:
        model = Path
        fields = ['id', 'name', 'points', 'campus']

    def create(self, validated_data):
        points_data = validated_data.pop('points')
        campus = validated_data.pop('campus', None)
        path = Path.objects.create(**validated_data, campus=campus)
        for point_data in points_data:
            PathPoint.objects.create(path=path, **point_data)
        return path

class TotemQRSerializer(serializers.ModelSerializer):
    class Meta:
        model = TotemQR
        fields = ['id', 'latitude', 'longitude', 'name', 'description', 'campus', 'status']

class ReceptionQRSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReceptionQR
        fields = ['id', 'latitude', 'longitude', 'name', 'description', 'campus', 'schedule', 'status']

class DenunciaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Denuncia
        fields = '__all__'

class UserProfileSerializer(serializers.ModelSerializer):
    role = serializers.CharField(source='role')

    class Meta:
        model = UserProfile
        fields = ['id', 'user', 'role']