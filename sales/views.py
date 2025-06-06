# sales/views.py
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db import transaction
from django.core.exceptions import ValidationError
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
from rest_framework.filters import SearchFilter # <-- ¡Añade esta importación!

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
    queryset = Factura.objects.all().order_by('-fecha') # Ordenar por fecha descendente
    serializer_class = FacturaSerializer

    # Añadir backends de filtrado
    filter_backends = [DjangoFilterBackend, SearchFilter, filters.OrderingFilter] # <--- ¡Añade SearchFilter!
    # Definir los campos por los que se puede filtrar (aquí 'fecha')
    filterset_fields = {
        'fecha': ['gte', 'lte', 'exact', 'range'], # Permite buscar por fecha exacta, rango, mayor o igual, menor o igual
        'id_factura': ['exact', 'icontains'], # Permite buscar por ID de factura exacto o que contenga
        'cliente__nombre': ['icontains'], # Buscar cliente por nombre
        'estado': ['exact'], # Buscar por estado exacto
    }
     # Definir los campos por los que SearchFilter buscará (texto libre con OR)
    # <--- ¡Añade esto!
    search_fields = ['id_factura', 'cliente__nombre'] # Buscará en id_factura O en nombre del cliente

    # Permite ordenar los resultados por fecha
    ordering_fields = ['fecha', 'total']

    # Acción personalizada para completar una factura
    @action(detail=True, methods=['post'], url_path='completar')
    def completar_factura(self, request, pk=None):
        try:
            factura = self.get_object() # Obtiene la factura por su PK (pk)
        except Factura.DoesNotExist:
            return Response({'error': 'Factura no encontrada.'}, status=status.HTTP_404_NOT_FOUND)

        if factura.estado == 'Pendiente':
            factura.estado = 'Completada'
            factura.save()
            return Response({'message': 'Factura marcada como Completada.'}, status=status.HTTP_200_OK)
        else:
            return Response({'error': 'La factura no está en estado Pendiente o ya está Completada.'}, status=status.HTTP_400_BAD_REQUEST)

    # Puedes mantener o modificar tu método create si tenías lógica específica
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    # Acción para anular una factura y devolver el stock
    @action(detail=True, methods=['post'], url_path='anular')
    def anular_factura(self, request, pk=None):
        try:
            factura = self.get_object()
        except Factura.DoesNotExist:
            return Response({'error': 'Factura no encontrada.'}, status=status.HTTP_404_NOT_FOUND)

        # Verificar si la factura ya está anulada
        if factura.estado == 'Anulada':
            return Response({'error': 'La factura ya está Anulada y no se puede anular de nuevo.'}, status=status.HTTP_400_BAD_REQUEST)

        # Aquí es donde añadimos la lógica para devolver el stock
        # Solo devolvemos stock si la factura no está ya en un estado final de no-stock-afectado (como Anulada)
        # o si la lógica de tu negocio dice que solo se devuelve stock de facturas 'Completadas'.
        # Basado en tu comentario, si se completa y luego se anula, debería devolver stock.
        # Si se anula desde 'Pendiente', probablemente el stock ya se restó en la creación del DetalleVenta.
        
        # Iterar sobre todos los detalles de venta asociados a esta factura
        for detalle in factura.detalle_ventas.all(): # Accede a los detalles a través de la relación inversa
            producto = detalle.producto # Obtiene el objeto Producto
            cantidad_vendida = detalle.cantidad # Cantidad de este producto en el detalle

            # Devolver la cantidad al stock del producto
            producto.stock += cantidad_vendida
            producto.save() # Guarda el producto con el stock actualizado
        
        # Una vez que el stock ha sido devuelto, cambia el estado de la factura a Anulada
        factura.estado = 'Anulada'
        factura.save()

        return Response({'message': 'Factura marcada como Anulada y stock devuelto exitosamente.'}, status=status.HTTP_200_OK)


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

