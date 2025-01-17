from django.db import models

# Create your models here.
class SafeSpace(models.Model):
    title = models.CharField(max_length=50)
    horario = models.CharField(max_length=50)
    description = models.TextField(blank=True)
    xCoord = models.FloatField(default=0)
    yCoord = models.FloatField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title
    