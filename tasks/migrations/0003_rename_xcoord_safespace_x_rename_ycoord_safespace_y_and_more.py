# Generated by Django 5.1.4 on 2025-01-22 00:28

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('tasks', '0002_safespace_xcoord_safespace_ycoord'),
    ]

    operations = [
        migrations.RenameField(
            model_name='safespace',
            old_name='xCoord',
            new_name='x',
        ),
        migrations.RenameField(
            model_name='safespace',
            old_name='yCoord',
            new_name='y',
        ),
        migrations.RemoveField(
            model_name='safespace',
            name='created_at',
        ),
        migrations.RemoveField(
            model_name='safespace',
            name='description',
        ),
        migrations.RemoveField(
            model_name='safespace',
            name='horario',
        ),
        migrations.RemoveField(
            model_name='safespace',
            name='title',
        ),
        migrations.AddField(
            model_name='safespace',
            name='campus',
            field=models.CharField(default='default_campus', max_length=255),
        ),
        migrations.AddField(
            model_name='safespace',
            name='info',
            field=models.CharField(default='default_info', max_length=255),
        ),
    ]