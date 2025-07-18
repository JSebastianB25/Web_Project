# Generated by Django 5.2.1 on 2025-07-11 17:55

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('sales', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name='factura',
            name='usuario',
            field=models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='facturas_creadas', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='detalleventa',
            name='factura',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='detalle_ventas', to='sales.factura'),
        ),
    ]
