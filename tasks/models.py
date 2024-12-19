from django.db import models

# Create your models here.
class SafeSpace(models.Model):
    title = models.CharField(max_length=50)
    horario = models.CharField(max_length=50)
    description = models.TextField(blank=True)
    xCoord = models.FloatField()
    yCoord = models.FloatField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title
    
