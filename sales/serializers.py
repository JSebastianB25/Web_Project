# sales/serializers.py
from rest_framework import serializers
from decimal import Decimal
from django.db import transaction
# Importa modelos de su propia aplicación
from .models import Cliente, Factura, DetalleVenta, FormaPago, Usuario
from uglobals.serializers import FormaPagoSerializer # Serializador de 'uglobals'
from users.serializers import UsuarioSerializer # Serializador de 'users'
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
    # Para la lectura (GET), queremos el objeto Producto completo
    producto = ProductoSerializer(read_only=True)
    # Para la escritura (POST/PUT), esperamos el ID del producto
    producto_id = serializers.PrimaryKeyRelatedField(
        queryset=Producto.objects.all(), source='producto', write_only=True
    )

    class Meta:
        model = DetalleVenta
        # Excluir 'subtotal' de los campos que el cliente envía, ya que se calcula en el save del modelo
        fields = ['id', 'producto', 'producto_id', 'cantidad', 'precio_unitario', 'subtotal']
        read_only_fields = ['subtotal'] # Subtotal es calculado, no se envía desde el frontend

    # Opcional: Asegúrate de que el precio unitario sea el del producto si no se envía
    def validate(self, data):
        # Si se está creando un nuevo detalle de venta y no se proporciona precio_unitario,
        # úsalo del producto. Esto es útil para evitar inconsistencias.
        if self.instance is None and 'precio_unitario' not in data and 'producto' in data:
            data['precio_unitario'] = data['producto'].precio_venta # Asume que Producto tiene 'precio_venta'
        elif self.instance and 'precio_unitario' not in data and 'producto' in data:
             # Si se está actualizando y no se envía precio_unitario, usa el existente o el del producto
            data['precio_unitario'] = self.instance.precio_unitario if self.instance.precio_unitario else data['producto'].precio_venta
        return data

# --- Serializador de Factura ---
class FacturaSerializer(serializers.ModelSerializer):
    # Serializador anidado para los detalles de venta
    # Many=True porque una factura tiene muchos detalles
    detalle_ventas = DetalleVentaSerializer(many=True, required=False)

    # Claves foráneas: usar PrimaryKeyRelatedField para escritura, y Serializer para lectura
    cliente = serializers.PrimaryKeyRelatedField(queryset=Cliente.objects.all())
    forma_pago = serializers.PrimaryKeyRelatedField(queryset=FormaPago.objects.all())
    usuario = serializers.PrimaryKeyRelatedField(queryset=Usuario.objects.all())

    class Meta:
        model = Factura
        fields = '__all__'
        read_only_fields = ['id_factura', 'fecha', 'total', 'estado'] # id_factura se genera en el modelo, total se calcula

    # Sobreescribir create para manejar los detalles de venta y la transacción
    def create(self, validated_data):
        detalle_ventas_data = validated_data.pop('detalle_ventas', [])
        
        # Usamos una transacción atómica para asegurar que todo se guarda o nada se guarda
        with transaction.atomic():
            factura = Factura.objects.create(**validated_data)
            total_factura = 0

            for detalle_data in detalle_ventas_data:
                # El campo 'producto' en detalle_data ya será el objeto Producto gracias a PrimaryKeyRelatedField
                # Si el precio_unitario no se envía, usar el del producto
                if 'precio_unitario' not in detalle_data:
                    detalle_data['precio_unitario'] = detalle_data['producto'].precio_venta

                detalle = DetalleVenta.objects.create(factura=factura, **detalle_data)
                total_factura += detalle.subtotal
            
            factura.total = total_factura
            factura.save() # Llama al save del modelo para actualizar id_factura y total

        return factura

    # Sobreescribir update si también quieres editar detalles de una factura existente
    def update(self, instance, validated_data):
        # Esta parte puede ser compleja para manejar actualizaciones de stock si se cambian cantidades
        # o se añaden/eliminan productos. Para este ejercicio inicial de POS,
        # nos centraremos en la creación y la anulación por borrado de factura.
        # Si la edición de una factura existente con detalles cambia, necesitarías
        # revertir el stock de las cantidades originales y aplicar las nuevas.
        # Por simplicidad, podemos dejar que solo se pueda eliminar la factura completa y crear una nueva.

        detalle_ventas_data = validated_data.pop('detalle_ventas', [])

        # Para un update robusto, tendríamos que:
        # 1. Obtener los detalles actuales de la factura.
        # 2. Compararlos con los nuevos detalles:
        #    - Si un detalle existe en ambos: ajustar stock por la diferencia de cantidad.
        #    - Si un detalle solo existe en el viejo: devolver stock y eliminar.
        #    - Si un detalle solo existe en el nuevo: añadir stock y crear.
        # 3. Actualizar los campos de la factura.

        # Por ahora, simplemente actualizaremos los campos directos de la factura
        # y si quieres actualizar los detalles, podrías considerar eliminarlos todos y crearlos de nuevo
        # o implementar una lógica más compleja para cada detalle.
        # Para un POS simple, a menudo la edición de detalles de una factura ya "cerrada" no es común.
        # Se suele anular y hacer una nueva.

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance

    # ESTO ES CLAVE para que el frontend vea los objetos completos de cliente, forma_pago, usuario
    # y los detalles de venta anidados al obtener una Factura.
    def to_representation(self, instance):
        representation = super().to_representation(instance)

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
        
        # Asegúrate de que los detalles de venta también se serialicen
        representation['detalle_ventas'] = DetalleVentaSerializer(instance.detalle_ventas.all(), many=True).data

        return representation