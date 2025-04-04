from rest_framework import serializers
from .models import TotemQR, ReceptionQR, Path, PathPoint

class TotemQRSerializer(serializers.ModelSerializer):
    class Meta:
        model = TotemQR
        fields = ['id', 'latitude', 'longitude', 'name', 'description', 'imageUrl', 'campus']

class ReceptionQRSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReceptionQR
        fields = ['id', 'latitude', 'longitude', 'name', 'description', 'imageUrl', 'campus']

class PathPointSerializer(serializers.ModelSerializer):
    class Meta:
        model = PathPoint
        fields = ['latitude', 'longitude', 'order']

class PathSerializer(serializers.ModelSerializer):
    points = PathPointSerializer(many=True)

    class Meta:
        model = Path
        fields = ['id', 'name', 'points', 'campus']

    def create(self, validated_data):
        points_data = validated_data.pop('points')
        path = Path.objects.create(**validated_data)
        for point_data in points_data:
            PathPoint.objects.create(path=path, **point_data)
        return path