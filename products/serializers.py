# products/serializers.py
from rest_framework import serializers
from .models import Producto # Importa desde su propio models.py

class ProductoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Producto
        fields = ['referencia_producto', 'nombre', 'precio_sugerido_venta', 'stock']