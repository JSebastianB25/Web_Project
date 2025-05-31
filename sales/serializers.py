# sales/serializers.py
from rest_framework import serializers
from decimal import Decimal

# Importa modelos de su propia aplicación
from .models import Cliente, Factura, DetalleVenta

# Importa modelos y serializadores de otras aplicaciones
from products.models import Producto # Modelo de 'products'
from products.serializers import ProductoSerializer # Serializador de 'products'
from uglobals.models import FormaPago # Modelo de 'zglobals'
from users.models import Usuario     # Modelo de 'users'

class ClienteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cliente
        fields = '__all__'

class DetalleVentaSerializer(serializers.ModelSerializer):
    # slug_field es la referencia_producto porque así está definido en el modelo Producto
    producto = serializers.SlugRelatedField(
        slug_field='referencia_producto',
        queryset=Producto.objects.all(),
        write_only=True # Solo para escritura, no se muestra al leer
    )
    # producto_info se usa para mostrar los detalles del producto al leer DetalleVenta
    producto_info = ProductoSerializer(source='producto', read_only=True)

    class Meta:
        model = DetalleVenta
        fields = ['id', 'factura', 'producto', 'producto_info', 'cantidad', 'precio_unitario', 'subtotal']
        read_only_fields = ['id', 'factura', 'producto_info', 'subtotal']

class FacturaSerializer(serializers.ModelSerializer):
    # Campos de solo lectura para mostrar nombres relacionados
    cliente_nombre = serializers.CharField(source='cliente.nombre', read_only=True)
    forma_pago_nombre = serializers.CharField(source='forma_pago.metodo', read_only=True)
    usuario_nombre = serializers.CharField(source='usuario.username', read_only=True)

    # Para incluir los detalles de venta anidados
    detalle_ventas = DetalleVentaSerializer(many=True, required=False)

    class Meta:
        model = Factura
        fields = [
            'id',
            'id_factura', 'fecha', 'cliente', 'cliente_nombre', 'forma_pago', 'forma_pago_nombre',
            'total', 'estado', 'usuario', 'usuario_nombre', 'detalle_ventas'
        ]
        read_only_fields = [
            'id', 'id_factura', 'fecha', 'total',
            'cliente_nombre', 'forma_pago_nombre', 'usuario_nombre'
        ]

    def create(self, validated_data):
        # Extrae los datos de los detalles de venta antes de crear la factura
        detalle_ventas_data = validated_data.pop('detalle_ventas', [])

        # Asigna el usuario actual a la factura si está autenticado
        if 'request' in self.context and self.context['request'].user.is_authenticated:
            # Asegúrate de que el usuario autenticado corresponda al modelo 'Usuario' de tu app 'users'
            # Esto es crucial: si estás usando django.contrib.auth.models.User, necesitarás ajustar esta línea.
            # Asumo que tu modelo 'Usuario' es el que quieres usar.
            try:
                validated_data['usuario'] = Usuario.objects.get(pk=self.context['request'].user.pk)
            except Usuario.DoesNotExist:
                raise serializers.ValidationError("El usuario autenticado no existe en el sistema de usuarios personalizado.")
        else:
             raise serializers.ValidationError("Se requiere un usuario autenticado para crear una factura.")

        # Calcula el total de la factura sumando los subtotales de los detalles
        calculated_total = Decimal('0.00')
        for item_data in detalle_ventas_data:
            try:
                cantidad = Decimal(str(item_data.get('cantidad', 0)))
                precio_unitario = Decimal(str(item_data.get('precio_unitario', 0)))
                calculated_total += (cantidad * precio_unitario)
            except (ValueError, TypeError, Decimal.InvalidOperation):
                raise serializers.ValidationError("Cantidad o precio unitario inválido en detalle de venta.")

        validated_data['total'] = calculated_total

        # Crea la instancia de la factura
        factura = Factura.objects.create(**validated_data)

        # Crea los detalles de venta asociados a la factura
        for detalle_data in detalle_ventas_data:
            producto_referencia = detalle_data.pop('producto')
            try:
                producto_instance = Producto.objects.get(referencia_producto=producto_referencia)
            except Producto.DoesNotExist:
                raise serializers.ValidationError(f"Producto con referencia '{producto_referencia}' no encontrado en el detalle de venta.")

            DetalleVenta.objects.create(factura=factura, producto=producto_instance, **detalle_data)

        return factura