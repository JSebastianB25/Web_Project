# sales/serializers.py
from rest_framework import serializers
from decimal import Decimal
from django.db import transaction
# Importa modelos de su propia aplicación
from .models import Cliente, Factura, DetalleVenta, FormaPago
# Importa modelos y serializadores de otras aplicaciones
from products.models import Producto # Modelo de 'products'
from products.serializers import ProductoSerializer # Serializador de 'products'
from uglobals.models import FormaPago # Modelo de 'uglobals'
from users.models import Usuario    # Modelo de 'users'
from uglobals.serializers import FormaPagoSerializer # Serializador de 'uglobals'
from users.serializers import UsuarioSerializer # Serializador de 'users'


class ClienteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cliente
        fields = '__all__'

class DetalleVentaSerializer(serializers.ModelSerializer):
    # Campo para la LECTURA (GET): Muestra los detalles completos del producto.
    # 'source="producto"' indica que toma los datos del campo ForeignKey 'producto' del modelo.
    # 'read_only=True' significa que este campo solo se usa para la salida (no se espera en la entrada).
    producto_details = ProductoSerializer(source='producto', read_only=True)

    # Campo para la ESCRITURA (POST/PUT): Espera el ID del producto.
    # Este es el campo que el frontend debe enviar (ej: {"producto": 123}).
    # 'write_only=True' significa que este campo solo se usa para la entrada (no se incluye en la salida).
    producto = serializers.PrimaryKeyRelatedField(queryset=Producto.objects.all(), write_only=True)

    class Meta:
        model = DetalleVenta
        # Incluimos AMBOS campos en 'fields'. DRF sabe cuál usar según read_only/write_only.
        # 'producto_details' es para la salida, 'producto' es para la entrada.
        fields = ['id', 'producto_details', 'producto', 'cantidad', 'precio_unitario', 'subtotal']
        read_only_fields = ['subtotal']

    # Opcional: Asegúrate de que el precio unitario sea el del producto si no se envía
    def validate(self, data):
        # 'producto' en 'data' ya será el objeto Producto resuelto por PrimaryKeyRelatedField
        if self.instance is None and 'precio_unitario' not in data and 'producto' in data:
            data['precio_unitario'] = data['producto'].precio_venta
        elif self.instance and 'precio_unitario' not in data and 'producto' in data:
            data['precio_unitario'] = self.instance.precio_unitario if self.instance.precio_unitario else data['producto'].precio_venta
        return data

# --- Serializador de Factura ---
class FacturaSerializer(serializers.ModelSerializer):
    # Serializador anidado para los detalles de venta
    # Many=True porque una factura tiene muchos detalles
    # Aquí, DetalleVentaSerializer se encargará de usar 'producto_details' para la salida
    # y 'producto' para la entrada.
    detalle_ventas = DetalleVentaSerializer(many=True, required=False)

    # Claves foráneas: usar PrimaryKeyRelatedField para escritura
    cliente = serializers.PrimaryKeyRelatedField(queryset=Cliente.objects.all())
    forma_pago = serializers.PrimaryKeyRelatedField(queryset=FormaPago.objects.all())
    usuario = serializers.PrimaryKeyRelatedField(queryset=Usuario.objects.all())

    class Meta:
        model = Factura
        fields = '__all__'
        read_only_fields = ['id_factura', 'fecha', 'total', 'estado']

    def create(self, validated_data):
        detalle_ventas_data = validated_data.pop('detalle_ventas', [])

        with transaction.atomic():
            factura = Factura.objects.create(**validated_data)
            total_factura = Decimal('0.00')

            for detalle_data in detalle_ventas_data:
                # 'detalle_data' ya contendrá el objeto Producto resuelto por el serializador anidado
                if 'precio_unitario' not in detalle_data:
                    detalle_data['precio_unitario'] = detalle_data['producto'].precio_venta

                detalle = DetalleVenta.objects.create(factura=factura, **detalle_data)
                total_factura += detalle.subtotal

            factura.total = total_factura
            factura.save()

        return factura

    def update(self, instance, validated_data):
        detalle_ventas_data = validated_data.pop('detalle_ventas', [])

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance

    # ESTO ES CLAVE: Sobreescribimos to_representation para la lectura (GET)
    # y así podemos anidar el ProductoSerializer completo para los detalles de venta.
    def to_representation(self, instance):
        representation = super().to_representation(instance)

        # Serialización de campos de clave foránea para la lectura (objetos completos)
        if instance.cliente:
            representation['cliente'] = ClienteSerializer(instance.cliente).data
        else:
            representation['cliente'] = None

        if instance.forma_pago:
            representation['forma_pago'] = FormaPagoSerializer(instance.forma_pago).data
        else:
            representation['forma_pago'] = None

        if instance.usuario:
            representation['usuario'] = UsuarioSerializer(instance.usuario).data
        else:
            representation['usuario'] = None

        # Serialización ANIDADA de detalle_ventas para la lectura (objetos de producto completos)
        detalle_ventas_representation = []
        for detalle_venta in instance.detalle_ventas.all():
            # Obtenemos la representación básica del DetalleVenta (que incluye el ID del producto)
            detalle_rep = DetalleVentaSerializer(detalle_venta).data
            
            # Ahora, reemplazamos el ID del producto con la representación completa del ProductoSerializer
            # Esto es lo que el frontend necesita para mostrar los detalles del producto en la factura.
            if detalle_venta.producto: # Asegurarse de que el producto exista
                detalle_rep['producto'] = ProductoSerializer(detalle_venta.producto).data
            else:
                detalle_rep['producto'] = None # O un valor por defecto si el producto no existe/fue eliminado

            detalle_ventas_representation.append(detalle_rep)

        representation['detalle_ventas'] = detalle_ventas_representation

        return representation
