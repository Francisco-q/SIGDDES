from rest_framework import serializers
from .models import TotemQR, ReceptionQR, Path, PathPoint, Denuncia, UserProfile, ImageUpload, ReporteAtencion
from django.contrib.auth.models import User
import re
from django.utils import timezone

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
        fields = ['id', 'latitude', 'longitude', 'name', 'description', 'campus', 'status', 'qr_image']

class ReceptionQRSerializer(serializers.ModelSerializer):
    effectiveStatus = serializers.SerializerMethodField()

    class Meta:
        model = ReceptionQR
        fields = ['id', 'latitude', 'longitude', 'name', 'description', 'campus', 'schedule', 'status', 'qr_image', 'effectiveStatus']

    def get_effectiveStatus(self, obj):
        if not obj.schedule:
            return "No Operativo"
        try:
            match = re.match(r"(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})", obj.schedule)
            if not match:
                return "No Operativo"
            open_time, close_time = match.groups()
            open_hours, open_minutes = map(int, open_time.split(":"))
            close_hours, close_minutes = map(int, close_time.split(":"))
            now = timezone.now()
            current_minutes = now.hour * 60 + now.minute
            open_minutes_total = open_hours * 60 + open_minutes
            close_minutes_total = close_hours * 60 + close_minutes
            if close_minutes_total < open_minutes_total:
                return current_minutes >= open_minutes_total or current_minutes <= close_minutes_total
            return current_minutes >= open_minutes_total and current_minutes <= close_minutes_total
        except Exception:
            return "No Operativo"

class DenunciaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Denuncia
        fields = '__all__'

class UserProfileSerializer(serializers.ModelSerializer):
    # Campos de User
    first_name = serializers.CharField(source='user.first_name')
    last_name = serializers.CharField(source='user.last_name')
    email = serializers.EmailField(source='user.email')
    date_joined = serializers.DateTimeField(source='user.date_joined', read_only=True)

    class Meta:
        model = UserProfile
        fields = ['id', 'first_name', 'last_name', 'email', 'telefono', 'campus', 'role', 'date_joined']
        read_only_fields = ['id', 'role', 'date_joined']

    def validate_email(self, value):
        if User.objects.exclude(pk=self.instance.user.pk).filter(email=value).exists():
            raise serializers.ValidationError("Este correo ya está en uso.")
        return value

    def update(self, instance, validated_data):
        # Actualizar campos de User
        user_data = validated_data.pop('user', {})
        instance.user.first_name = user_data.get('first_name', instance.user.first_name)
        instance.user.last_name = user_data.get('last_name', instance.user.last_name)
        instance.user.email = user_data.get('email', instance.user.email)
        instance.user.save()

        # Actualizar campos de UserProfile
        instance.telefono = validated_data.get('telefono', instance.telefono)
        instance.campus = validated_data.get('campus', instance.campus)
        instance.save()
        return instance

class ImageUploadSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(max_length=None, use_url=True)

    class Meta:
        model = ImageUpload
        fields = ['id', 'point_id', 'point_type', 'campus', 'image', 'uploaded_at']

    def create(self, validated_data):
        request = self.context.get('request')
        validated_data['uploaded_by'] = request.user if request and request.user.is_authenticated else None
        return super().create(validated_data)

class ReporteAtencionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReporteAtencion
        fields = '__all__'