# sales/views.py
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db import transaction
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
from rest_framework.views import APIView
from django.db.models import F, Sum, Count, ExpressionWrapper, fields
from django.db.models.functions import Coalesce
from rest_framework.filters import SearchFilter
from rest_framework.pagination import LimitOffsetPagination
# Importa tus modelos
from .models import Cliente, Factura, DetalleVenta, FormaPago
from products.models import Producto
from users.models import Usuario

# Importa tus serializadores
from .serializers import ClienteSerializer, FacturaSerializer, DetalleVentaSerializer
# Asegúrate de que estos imports sean correctos según la ubicación de tus serializadores
from uglobals.serializers import FormaPagoSerializer
from users.serializers import UsuarioSerializer

# Importa datetime y time para manejar fechas
from datetime import datetime, time
from django.shortcuts import get_object_or_404 # Para obtener objetos o lanzar 404
import os # Para manejar archivos temporales

# Importar las funciones de utilidad que crearemos en sales/utils.py
from .utils import generate_invoice_pdf, send_invoice_email


class ClienteViewSet(viewsets.ModelViewSet):
    queryset = Cliente.objects.all().order_by('nombre')
    serializer_class = ClienteSerializer

class CustomFacturaPagination(LimitOffsetPagination):
    default_limit = 2500 # Por si no se especifica 'limit' en la URL
    max_limit = 100 # Limite máximo que se puede pedir

class FacturaViewSet(viewsets.ModelViewSet):
    queryset = Factura.objects.all().order_by('-fecha') # Ordenar por fecha descendente
    serializer_class = FacturaSerializer
    pagination_class = CustomFacturaPagination

    filter_backends = [DjangoFilterBackend, SearchFilter, filters.OrderingFilter]
    filterset_fields = {
        'fecha': ['gte', 'lte', 'exact', 'range'],
        'id_factura': ['exact', 'icontains'],
        'cliente__nombre': ['icontains'],
        'estado': ['exact'],
    }
    search_fields = ['id_factura', 'cliente__nombre']
    ordering_fields = ['fecha', 'total']

    # Sobreescribir el método create para manejar los detalles de venta
    # La lógica de stock ya está en DetalleVenta.save(), así que solo creamos los detalles.
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        detalle_ventas_data = serializer.validated_data.pop('detalle_ventas', [])

        with transaction.atomic():
            factura = serializer.save() # Guarda la factura principal

            # Procesar los detalles de venta
            for detalle_data in detalle_ventas_data:
                # La lógica de descuento de stock está en DetalleVenta.save()
                # Si DetalleVenta.save() lanza una ValidationError (por stock),
                # la transacción se revertirá automáticamente.
                DetalleVenta.objects.create(factura=factura, **detalle_data)

            # Recalcular el total de la factura después de crear todos los detalles
            # Esto es importante si el total no se calcula en el modelo Factura.save()
            factura.total = sum(item.subtotal for item in factura.detalle_ventas.all())
            factura.save() # Guardar el total actualizado

        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

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

    # Acción para anular una factura y devolver el stock
    @action(detail=True, methods=['post'], url_path='anular')
    def anular_factura(self, request, pk=None):
        try:
            factura = self.get_object()
        except Factura.DoesNotExist:
            return Response({'error': 'Factura no encontrada.'}, status=status.HTTP_404_NOT_FOUND)

        if factura.estado == 'Anulada':
            return Response({'error': 'La factura ya está Anulada y no se puede anular de nuevo.'}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            # Devolver stock
            # Esta lógica asume que el stock se descontó al crear el DetalleVenta.
            for detalle in factura.detalle_ventas.all():
                producto = detalle.producto
                producto.stock += detalle.cantidad
                producto.save()
            
            factura.estado = 'Anulada'
            factura.save()

        return Response({'message': 'Factura marcada como Anulada y stock devuelto exitosamente.'}, status=status.HTTP_200_OK)

    # NUEVA ACCIÓN: Enviar PDF de Factura por Email
    @action(detail=True, methods=['post'], url_path='send_pdf_email')
    def send_pdf_email(self, request, pk=None):
        """
        Genera un PDF de la factura y lo envía por email al cliente asociado.
        """
        try:
            invoice = self.get_object() # Obtiene la factura por su ID (pk)
        except Factura.DoesNotExist:
            return Response({'error': 'Factura no encontrada.'}, status=status.HTTP_404_NOT_FOUND)

        # Verificar si el cliente tiene un email
        if not invoice.cliente or not invoice.cliente.email:
            return Response({'error': 'El cliente de esta factura no tiene un email registrado.'}, status=status.HTTP_400_BAD_REQUEST)

        # 1. Generar el PDF
        pdf_path, pdf_error = generate_invoice_pdf(invoice.id)
        if pdf_error:
            return Response({'error': f'Error al generar el PDF: {pdf_error}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # 2. Enviar el Email
        email_sent, email_error = send_invoice_email(invoice.id, invoice.cliente.email, pdf_path)

        # Opcional: Limpiar el archivo PDF temporal después de enviarlo
        if os.path.exists(pdf_path):
            try:
                os.remove(pdf_path)
            except Exception as e:
                print(f"Advertencia: No se pudo eliminar el archivo PDF temporal {pdf_path}: {e}")

        if email_sent:
            return Response({'message': 'PDF de factura enviado por email exitosamente.'}, status=status.HTTP_200_OK)
        else:
            return Response({'error': f'Error al enviar el email: {email_error}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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

# REPORTES DE AQUI HACIA ABAJO----------------->
#
class ProductosMasVendidosAPIView(APIView):
    """
    API para obtener los productos más vendidos por cantidad.
    """
    def get(self, request, format=None):
        try:
            productos_vendidos = DetalleVenta.objects.values(
                'producto__referencia_producto',
                'producto__nombre',
                'producto__precio_sugerido_venta'
            ).annotate(
                cantidad_total_vendida=Sum('cantidad')
            ).order_by('-cantidad_total_vendida')

            data = []
            for item in productos_vendidos:
                data.append({
                    'referencia_producto': item['producto__referencia_producto'],
                    'nombre_producto': item['producto__nombre'],
                    'cantidad_total_vendida': item['cantidad_total_vendida'],
                })
            
            return Response(data, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class GananciasPorFechaAPIView(APIView):
    """
    API para obtener las ganancias totales (ventas brutas) por un rango de fechas.
    """
    def get(self, request, format=None):
        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')

        facturas = Factura.objects.all()

        if start_date_str:
            try:
                start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
                facturas = facturas.filter(fecha__date__gte=start_date)
            except ValueError:
                return Response({"error": "Formato de fecha de inicio inválido. Use YYYY-MM-DD."},
                                status=status.HTTP_400_BAD_REQUEST)

        if end_date_str:
            try:
                end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
                end_date = datetime.combine(end_date, time.max).date()
            except ValueError:
                return Response({"error": "Formato de fecha de fin inválido. Use YYYY-MM-DD."},
                                status=status.HTTP_400_BAD_REQUEST)
        
        ganancia_total = facturas.aggregate(total_ventas=Sum('total'))['total_ventas'] or 0

        num_facturas = facturas.count()

        data = {
            'ganancia_bruta_total': float(ganancia_total),
            'numero_facturas': num_facturas,
            'start_date': start_date_str,
            'end_date': end_date_str,
        }
        
        return Response(data, status=status.HTTP_200_OK)


class IngresosDetalladosAPIView(APIView):
    """
    API para obtener ingresos detallados por producto, por día y por factura.
    Incluye costo unitario y ganancia unitaria.
    """
    def get(self, request, format=None):
        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')

        detalles_ventas = DetalleVenta.objects.all()

        if start_date_str:
            try:
                start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
                detalles_ventas = detalles_ventas.filter(factura__fecha__date__gte=start_date)
            except ValueError:
                return Response({"error": "Formato de fecha de inicio inválido. Use %Y-%MM-DD."},
                                status=status.HTTP_400_BAD_REQUEST)

        if end_date_str:
            try:
                end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
                detalles_ventas = detalles_ventas.filter(factura__fecha__date__lte=end_date)
            except ValueError:
                return Response({"error": "Formato de fecha de fin inválido. Use %Y-%MM-DD."},
                                status=status.HTTP_400_BAD_REQUEST)
        
        detalles_con_ganancia = detalles_ventas.annotate(
            ingreso_por_item=ExpressionWrapper(
                F('cantidad') * F('precio_unitario'),
                output_field=fields.DecimalField(max_digits=10, decimal_places=2)
            ),
            costo_por_item=ExpressionWrapper(
                F('cantidad') * F('producto__precio_costo'),
                output_field=fields.DecimalField(max_digits=10, decimal_places=2)
            ),
            ganancia_por_item=ExpressionWrapper(
                (F('cantidad') * F('precio_unitario')) - (F('cantidad') * F('producto__precio_costo')),
                output_field=fields.DecimalField(max_digits=10, decimal_places=2)
            )
        ).select_related('producto', 'factura', 'factura__cliente')

        data = []
        for detalle in detalles_con_ganancia:
            data.append({
                'id_detalle_venta': detalle.id,
                'factura_id': detalle.factura.id_factura,
                'fecha_factura': detalle.factura.fecha.isoformat(),
                'nombre_cliente': detalle.factura.cliente.nombre if detalle.factura.cliente else 'N/A',
                'referencia_producto': detalle.producto.referencia_producto,
                'nombre_producto': detalle.producto.nombre,
                'cantidad': detalle.cantidad,
                'precio_unitario_venta': detalle.precio_unitario,
                'costo_unitario_producto': detalle.producto.precio_costo,
                'ingreso_por_item': detalle.ingreso_por_item,
                'costo_por_item': detalle.costo_por_item,
                'ganancia_por_item': detalle.ganancia_por_item,
            })
        
        return Response(data, status=status.HTTP_200_OK)
    
class ProductosBajoStockAPIView(APIView):
    """
    API para obtener productos con stock bajo (cercano a 0), ordenados por stock de forma ascendente.
    Se puede añadir un parámetro 'umbral' para filtrar el stock máximo a considerar.
    """
    def get(self, request, format=None):
        umbral_param = request.query_params.get('umbral')
        
        umbral_stock = 10

        if umbral_param is not None and umbral_param != '':
            try:
                umbral_stock = int(umbral_param)
            except ValueError:
                return Response({"error": "El umbral debe ser un número entero válido."}, status=status.HTTP_400_BAD_REQUEST)

        productos_bajo_stock = Producto.objects.filter(
            stock__lte=umbral_stock,
            activo=True
        ).order_by('stock', 'nombre')

        data = []
        for producto in productos_bajo_stock:
            data.append({
                'id_producto': producto.referencia_producto,
                'nombre': producto.nombre,
                'referencia_producto': producto.referencia_producto,
                'stock_actual': producto.stock,
                'categoria': producto.categoria.nombre if producto.categoria else 'Sin Categoría',
                'proveedor': producto.proveedor.nombre if producto.proveedor else 'Sin Proveedor',
                'precio_costo': producto.precio_costo,
            })
        
        return Response(data, status=status.HTTP_200_OK)
    
class RendimientoEmpleadosAPIView(APIView):
    """
    API para obtener el rendimiento de ventas por empleado (usuario) en un rango de fechas.
    Calcula el total de ventas (campo 'total' de Factura) y el número de facturas.
    Los resultados se ordenan por las ventas totales de forma descendente.
    """
    def get(self, request, format=None):
        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')

        start_date = None
        end_date = None

        if start_date_str:
            try:
                start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
            except ValueError:
                return Response({"error": "Formato de fecha de inicio incorrecto. Usa AAAA-MM-DD."}, status=status.HTTP_400_BAD_REQUEST)
        
        if end_date_str:
            try:
                end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
                end_date = datetime.combine(end_date, time.max).date()
            except ValueError:
                return Response({"error": "Formato de fecha de fin incorrecto. Usa AAAA-MM-DD."}, status=status.HTTP_400_BAD_REQUEST)

        facturas_queryset = Factura.objects.all()
        if start_date:
            facturas_queryset = facturas_queryset.filter(fecha__date__gte=start_date)
        if end_date:
            facturas_queryset = facturas_queryset.filter(fecha__date__lte=end_date)
        
        rendimiento = facturas_queryset.values('usuario__id', 'usuario__username').annotate(
            total_ventas=Sum('total'),
            numero_facturas=Count('id')
        ).order_by('-total_ventas')

        data = []
        for item in rendimiento:
            usuario_id = item['usuario__id']
            username = item['usuario__username']

            nombre_empleado = "Sin Asignar"
            if usuario_id:
                 nombre_empleado = username

            data.append({
                'empleado_id': usuario_id,
                'nombre_empleado': nombre_empleado,
                'total_ventas_netas': item['total_ventas'],
                'numero_facturas': item['numero_facturas']
            })
        
        return Response(data, status=status.HTTP_200_OK)

class VentasPorClienteAPIView(APIView):
    """
    API para obtener el total de ventas y el número de facturas por cliente
    en un rango de fechas.
    """
    def get(self, request, format=None):
        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')

        start_date = None
        end_date = None

        if start_date_str:
            try:
                start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
            except ValueError:
                return Response({"error": "Formato de fecha de inicio incorrecto. Usa AAAA-MM-DD."}, status=status.HTTP_400_BAD_REQUEST)
        
        if end_date_str:
            try:
                end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
                end_date = datetime.combine(end_date, time.max).date()
            except ValueError:
                return Response({"error": "Formato de fecha de fin incorrecto. Usa AAAA-MM-DD."}, status=status.HTTP_400_BAD_REQUEST)

        facturas_queryset = Factura.objects.all()
        if start_date:
            facturas_queryset = facturas_queryset.filter(fecha__date__gte=start_date)
        if end_date:
            facturas_queryset = facturas_queryset.filter(fecha__date__lte=end_date)
        
        rendimiento_clientes = facturas_queryset.values('cliente__id', 'cliente__nombre').annotate(
            total_ventas=Sum('total'),
            numero_facturas=Count('id')
        ).order_by('-total_ventas')

        data = []
        for item in rendimiento_clientes:
            cliente_id = item['cliente__id']
            nombre_cliente = item['cliente__nombre']

            data.append({
                'cliente_id': cliente_id,
                'nombre_cliente': nombre_cliente,
                'total_ventas': item['total_ventas'],
                'numero_facturas': item['numero_facturas']
            })
        
        return Response(data, status=status.HTTP_200_OK)
