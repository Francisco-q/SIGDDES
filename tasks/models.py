from django.db import models

class SafeSpace(models.Model):
    x = models.FloatField(default=0.0)
    y = models.FloatField(default=0.0)
    info = models.CharField(max_length=255, default='default_info')
    campus = models.CharField(max_length=255,  default='default_campus')

    def __str__(self):
        return f"SafeSpace {self.id} - {self.campus}"
    
class StartingPoint(models.Model):
    x = models.FloatField(default=0.0)
    y = models.FloatField(default=0.0)
    info = models.CharField(max_length=255, default='default_info')
    campus = models.CharField(max_length=255, default='default_campus')

    def __str__(self):
        return f"StartingPoint {self.id} - {self.campus}"