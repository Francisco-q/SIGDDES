# Generated by Django 5.1.4 on 2024-12-21 04:50

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('tasks', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='safespace',
            name='xCoord',
            field=models.FloatField(default=0),
        ),
        migrations.AddField(
            model_name='safespace',
            name='yCoord',
            field=models.FloatField(default=0),
        ),
    ]
