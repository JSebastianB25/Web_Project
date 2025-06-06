# sales/views.py
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db import transaction

# Importa modelos desde su propio models.py
from .models import Cliente, Factura, DetalleVenta
# Importa serializadores desde su propio serializers.py
from .serializers import ClienteSerializer, FacturaSerializer, DetalleVentaSerializer

class ClienteViewSet(viewsets.ModelViewSet):
    queryset = Cliente.objects.all().order_by('nombre')
    serializer_class = ClienteSerializer

class FacturaViewSet(viewsets.ModelViewSet):
    queryset = Factura.objects.all()
    serializer_class = FacturaSerializer

    # Opcional: Si necesitas un endpoint para obtener los detalles de una factura específica
    @action(detail=True, methods=['get'])
    def detalles(self, request, pk=None):
        try:
            factura = self.get_object()
            detalles = factura.detalle_ventas.all() # Asumiendo 'detalle_ventas' es el related_name
            serializer = DetalleVentaSerializer(detalles, many=True)
            return Response(serializer.data)
        except Factura.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

    # Si tu lógica de create en el serializer ya es robusta, no necesitas sobreescribir perform_create
    # Si no, podrías necesitarla para manejar contextos o relaciones complejas.
    # Por ahora, con la lógica en el serializer, probablemente no sea necesaria.

class DetalleVentaViewSet(viewsets.ModelViewSet):
    queryset = DetalleVenta.objects.all()
    serializer_class = DetalleVentaSerializer
    # Puedes añadir filtros o permisos si es necesario