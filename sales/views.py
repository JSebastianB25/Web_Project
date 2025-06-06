# sales/views.py
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db import transaction
from django.core.exceptions import ValidationError

# Importa modelos desde su propio models.py
from .models import Cliente, Factura, DetalleVenta, Cliente
from products.models import Producto  # Importa el modelo Producto desde la app 'products'
from uglobals.models import FormaPago  # Importa el modelo FormaPago desde la app 'globals'
from users.models import Usuario  # Importa el modelo Usuario desde la app 'users'

# Importa serializers de sales
from .serializers import FacturaSerializer, DetalleVentaSerializer, ClienteSerializer

# Importa serializers de otros apps para usar en to_representation o en la lógica de vistas
from products.serializers import ProductoSerializer # <--- IMPORTA ESTO
from uglobals.serializers import FormaPagoSerializer # <--- IMPORTA ESTO
from users.serializers import UsuarioSerializer # <--- IMPORTA ESTO

class ClienteViewSet(viewsets.ModelViewSet):
    queryset = Cliente.objects.all().order_by('nombre')
    serializer_class = ClienteSerializer

class FacturaViewSet(viewsets.ModelViewSet):
    queryset = Factura.objects.all().order_by('-fecha')
    serializer_class = FacturaSerializer
    pagination_class = None # Para este ejemplo, no paginamos

    # Acción personalizada para "anular" una factura y devolver stock
    @action(detail=True, methods=['post'])
    def anular(self, request, pk=None):
        factura = self.get_object()
        if factura.estado == 'Anulada':
            return Response({'detail': 'La factura ya está anulada.'}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            try:
                # 1. Cambiar el estado de la factura a 'Anulada'
                factura.estado = 'Anulada'
                factura.save()

                # 2. Devolver stock de cada producto en los detalles de venta
                for detalle in factura.detalle_ventas.all():
                    producto = detalle.producto
                    # Incrementa el stock del producto
                    producto.stock += detalle.cantidad
                    producto.save()
                    print(f"Stock devuelto para {producto.nombre} (Ref: {producto.referencia_producto}). Nuevo stock: {producto.stock}")

                return Response({'detail': 'Factura anulada y stock devuelto exitosamente.'}, status=status.HTTP_200_OK)
            except Exception as e:
                return Response({'detail': f'Error al anular la factura: {e}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # Sobreescribir destroy para evitar que se eliminen facturas directamente
    # En un entorno real, prefieres "anular" que eliminar para mantener un historial.
    # Si de verdad quieres eliminar, deberías replicar la lógica de devolución de stock aquí.
    def destroy(self, request, *args, **kwargs):
        return Response({'detail': 'La eliminación directa de facturas no está permitida. Use la acción de anular.'}, status=status.HTTP_405_METHOD_NOT_ALLOWED)


class FacturaViewSet(viewsets.ModelViewSet):
    queryset = Factura.objects.all().order_by('-fecha')
    serializer_class = FacturaSerializer
    pagination_class = None

    @action(detail=True, methods=['post'])
    def anular(self, request, pk=None):
        factura = self.get_object()
        if factura.estado == 'Anulada':
            return Response({'detail': 'La factura ya está anulada.'}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            try:
                factura.estado = 'Anulada'
                factura.save()

                for detalle in factura.detalle_ventas.all():
                    producto = detalle.producto
                    # Incrementa el stock del producto
                    producto.stock += detalle.cantidad
                    producto.save()
                    print(f"Stock devuelto para {producto.nombre} (Ref: {producto.referencia_producto}). Nuevo stock: {producto.stock}")

                return Response({'detail': 'Factura anulada y stock devuelto exitosamente.'}, status=status.HTTP_200_OK)
            except Exception as e:
                return Response({'detail': f'Error al anular la factura: {e}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def destroy(self, request, *args, **kwargs):
        # Implementa la lógica de devolución de stock si permites la eliminación directa
        # O si no, devuelve el error como lo tenías
        return Response({'detail': 'La eliminación directa de facturas no está permitida. Use la acción de anular.'}, status=status.HTTP_405_METHOD_NOT_ALLOWED)


class DetalleVentaViewSet(viewsets.ModelViewSet):
    queryset = DetalleVenta.objects.all()
    serializer_class = DetalleVentaSerializer
    pagination_class = None

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        with transaction.atomic():
            try:
                producto = instance.producto
                producto.stock += instance.cantidad
                producto.save()
                print(f"Stock de {producto.nombre} devuelto por eliminación de detalle. Nuevo stock: {producto.stock}")
                self.perform_destroy(instance)
                return Response(status=status.HTTP_204_NO_CONTENT)
            except Exception as e:
                return Response({'detail': f'Error al eliminar detalle de venta y devolver stock: {e}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

