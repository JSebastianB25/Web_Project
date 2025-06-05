# products/serializers.py
from rest_framework import serializers
from .models import Producto
# Asegúrate de importar los modelos de Proveedor y Categoria desde su ubicación real
from uglobals.models import Proveedor, Categoria # Ajusta la ruta si es diferente

class ProductoSerializer(serializers.ModelSerializer):
    # Campo para la lectura (GET): devuelve el nombre del proveedor. Es solo lectura.
    proveedor_nombre = serializers.ReadOnlyField(source='proveedor.nombre')
    # Campo para la lectura (GET): devuelve el nombre de la categoría. Es solo lectura.
    categoria_nombre = serializers.ReadOnlyField(source='categoria.nombre')

    # Campo para la escritura (POST/PUT): Acepta el ID del proveedor.
    # QUITAR allow_null=True y required=False para que sea OBLIGATORIO.
    proveedor = serializers.PrimaryKeyRelatedField(
        queryset=Proveedor.objects.all()
    )
    # Campo para la escritura (POST/PUT): Acepta el ID de la categoría.
    # QUITAR allow_null=True y required=False para que sea OBLIGATORIO.
    categoria = serializers.PrimaryKeyRelatedField(
        queryset=Categoria.objects.all()
    )

    class Meta:
        model = Producto
        fields = [
            'referencia_producto',
            'nombre',
            'descripcion',
            'precio_costo',
            'precio_sugerido_venta',
            'stock',
            'proveedor',         # Este es el campo para escribir/enviar el ID
            'categoria',         # Este es el campo para escribir/enviar el ID
            'imagen',
            'fecha_creacion',
            'activo',
            'proveedor_nombre',  # Este es el campo para leer el nombre
            'categoria_nombre'   # Este es el campo para leer el nombre
        ]
        read_only_fields = ['fecha_creacion']