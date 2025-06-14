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
from .models import Cliente, Factura, DetalleVenta, Producto  # Importa los modelos de ventas
from datetime import datetime # Importa datetime y time para manejar fechas
from datetime import datetime, time # <-- ¡Añade 'time' aquí!
# Importa modelos desde su propio models.py
from .models import Cliente, Factura, DetalleVenta, Cliente
from products.models import Producto  # Importa el modelo Producto desde la app 'products'

# Importa serializers de sales
from .serializers import FacturaSerializer, DetalleVentaSerializer, ClienteSerializer

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

#REPORTES DE AQUI HACIA ABAJO----------------->
#    
class ProductosMasVendidosAPIView(APIView):
    """
    API para obtener los productos más vendidos por cantidad.
    """
    def get(self, request, format=None):
        try:
            # Agrupar por producto y sumar las cantidades vendidas
            productos_vendidos = DetalleVenta.objects.values(
                'producto__referencia_producto', # La PK del producto
                'producto__nombre',              # El nombre del producto
                'producto__precio_sugerido_venta'# Precio unitario original del producto
            ).annotate(
                cantidad_total_vendida=Sum('cantidad') # Suma de la cantidad vendida
            ).order_by('-cantidad_total_vendida') # Ordenar de mayor a menor

            # Preparar los datos para la respuesta
            data = []
            for item in productos_vendidos:
                data.append({
                    'referencia_producto': item['producto__referencia_producto'],
                    'nombre_producto': item['producto__nombre'],
                    'cantidad_total_vendida': item['cantidad_total_vendida'],
                    # Opcional: podrías calcular el ingreso total si el precio se mantiene
                    # 'ingreso_total': item['cantidad_total_vendida'] * item['producto__precio_sugerido_venta']
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

        facturas = Factura.objects.all() # Empieza con todas las facturas

        if start_date_str:
            try:
                # Convertir la fecha de inicio a un objeto datetime, asegurando que sea el comienzo del día
                start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
                facturas = facturas.filter(fecha__date__gte=start_date)
            except ValueError:
                return Response({"error": "Formato de fecha de inicio inválido. Use YYYY-MM-DD."},
                                status=status.HTTP_400_BAD_REQUEST)

        if end_date_str:
            try:
                # Convertir la fecha de fin a un objeto datetime, asegurando que sea el final del día
                end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
                facturas = facturas.filter(fecha__date__lte=end_date)
            except ValueError:
                return Response({"error": "Formato de fecha de fin inválido. Use YYYY-MM-DD."},
                                status=status.HTTP_400_BAD_REQUEST)
        
        # Sumar el campo 'total' de las facturas filtradas
        ganancia_total = facturas.aggregate(total_ventas=Sum('total'))['total_ventas'] or 0

        # Opcional: También puedes devolver el número de facturas
        num_facturas = facturas.count()

        data = {
            'ganancia_bruta_total': float(ganancia_total), # Asegura que sea un flotante
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

        # Filtro por rango de fechas
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
        
        # Anotar para calcular ingreso_por_item, costo_por_item y ganancia_por_item
        detalles_con_ganancia = detalles_ventas.annotate(
            ingreso_por_item=ExpressionWrapper(
                F('cantidad') * F('precio_unitario'),
                output_field=fields.DecimalField(max_digits=10, decimal_places=2)
            ),
            # === CAMBIO CLAVE AQUÍ: F('producto__precio_costo') ===
            costo_por_item=ExpressionWrapper(
                F('cantidad') * F('producto__precio_costo'),
                output_field=fields.DecimalField(max_digits=10, decimal_places=2)
            ),
            # === CAMBIO CLAVE AQUÍ: F('producto__precio_costo') ===
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
                'costo_unitario_producto': detalle.producto.precio_costo, # === CAMBIO CLAVE AQUÍ ===
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
        # Obtiene el umbral. Si no está presente, usa None. Si está, obtiene su valor.
        umbral_param = request.query_params.get('umbral')
        
        umbral_stock = 10 # Valor por defecto

        if umbral_param is not None and umbral_param != '':
            try:
                umbral_stock = int(umbral_param)
            except ValueError:
                # Si el umbral es una cadena no numérica (pero no vacía), devuelve un error 400
                return Response({"error": "El umbral debe ser un número entero válido."}, status=status.HTTP_400_BAD_REQUEST)
        # Si umbral_param es None (no se envió) o es una cadena vacía (''), se usa el umbral_stock por defecto (10).

        productos_bajo_stock = Producto.objects.filter(
            stock__lte=umbral_stock, # Filtra productos cuyo stock es menor o igual al umbral
            activo=True # Solo productos activos
        ).order_by('stock', 'nombre') # Ordena por stock (el más bajo primero) y luego por nombre

        data = []
        for producto in productos_bajo_stock:
            data.append({
                'id_producto': producto.referencia_producto, # Usamos referencia_producto como clave primaria
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

        # Define el rango de fechas para el filtro
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
                # Ajusta la fecha final para incluir todo el día
                end_date = datetime.combine(end_date, time.max).date()
            except ValueError:
                return Response({"error": "Formato de fecha de fin incorrecto. Usa AAAA-MM-DD."}, status=status.HTTP_400_BAD_REQUEST)

        # Filtra facturas por rango de fechas si se proporcionan
        facturas_queryset = Factura.objects.all()
        if start_date:
            facturas_queryset = facturas_queryset.filter(fecha__date__gte=start_date) # Usa el campo 'fecha' de Factura
        if end_date:
            facturas_queryset = facturas_queryset.filter(fecha__date__lte=end_date) # Usa el campo 'fecha' de Factura
        
        # Agrupa por el campo 'usuario' de la Factura y calcula el total y el número de facturas.
        # Usa 'usuario__id' y 'usuario__username' de tu modelo Usuario.
        rendimiento = facturas_queryset.values('usuario__id', 'usuario__username').annotate(
            total_ventas=Sum('total'), # Usa el campo 'total' de Factura
            numero_facturas=Count('id') # Cuenta las facturas por su ID
        ).order_by('-total_ventas') # Ordena por las ventas totales de forma descendente

        data = []
        for item in rendimiento:
            usuario_id = item['usuario__id']
            username = item['usuario__username'] # Obtiene el username del usuario

            nombre_empleado = "Sin Asignar"
            if usuario_id: # Si hay un ID de usuario (no es NULL), asigna el username como nombre
                 nombre_empleado = username

            data.append({
                'empleado_id': usuario_id,
                'nombre_empleado': nombre_empleado,
                'total_ventas_netas': item['total_ventas'], # Se mantiene el nombre 'total_ventas_netas' para consistencia con el frontend
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

        # Filtra facturas por rango de fechas si se proporcionan
        facturas_queryset = Factura.objects.all()
        if start_date:
            facturas_queryset = facturas_queryset.filter(fecha__date__gte=start_date)
        if end_date:
            facturas_queryset = facturas_queryset.filter(fecha__date__lte=end_date)
        
        # Agrupa por cliente y calcula el total de ventas y el número de facturas
        # Asumo que tu modelo Factura tiene un ForeignKey a Cliente llamado 'cliente'
        rendimiento_clientes = facturas_queryset.values('cliente__id', 'cliente__nombre').annotate(
            total_ventas=Sum('total'), # Usa el campo 'total' de Factura
            numero_facturas=Count('id') # Cuenta las facturas por su ID
        ).order_by('-total_ventas') # Ordena por las ventas totales de forma descendente

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