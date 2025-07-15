# products/serializers.py
from rest_framework import serializers
from .models import Producto, Proveedor, Categoria, Marca

class ProductoSerializer(serializers.ModelSerializer):
    proveedor_nombre = serializers.ReadOnlyField(source='proveedor.nombre')
    categoria_nombre = serializers.ReadOnlyField(source='categoria.nombre')
    marca_nombre = serializers.ReadOnlyField(source='marca.nombre')

    proveedor = serializers.PrimaryKeyRelatedField(
        queryset=Proveedor.objects.all()
    )
    categoria = serializers.PrimaryKeyRelatedField(
        queryset=Categoria.objects.all(),
        # Si quieres que la categoría sea opcional como en tu modelo (null=True),
        # deberías agregar blank=True en el modelo y luego aquí:
        # allow_null=True,
        # required=False
    )
    marca = serializers.PrimaryKeyRelatedField(
        queryset=Marca.objects.all(),
        allow_null=True,
        required=False
    )
    
    # CAMBIO AQUÍ: Ahora es ImageField
    # Lo hacemos no requerido y permitimos nulos, ya que es opcional y puede venir de URL o archivo
    imagen = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = Producto
        fields = [
            'id',
            'referencia_producto',
            'nombre',
            'marca',
            'precio_costo',
            'precio_sugerido_venta',
            'stock',
            'proveedor',
            'categoria',
            'imagen',
            'fecha_creacion',
            'activo',
            'marca_nombre',
            'proveedor_nombre',
            'categoria_nombre'
        ]
        read_only_fields = ['fecha_creacion']
        extra_kwargs = {
            'referencia_producto': {'required': False, 'allow_null': True}
        }