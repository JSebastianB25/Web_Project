# sales/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ClienteViewSet, FacturaViewSet, DetalleVentaViewSet, ProductosMasVendidosAPIView, GananciasPorFechaAPIView, IngresosDetalladosAPIView, ProductosBajoStockAPIView, RendimientoEmpleadosAPIView, VentasPorClienteAPIView # Importa tus vistas

router = DefaultRouter()
router.register(r'clientes', ClienteViewSet)
router.register(r'facturas', FacturaViewSet)
router.register(r'detalles_venta', DetalleVentaViewSet)

urlpatterns = [
    path('', include(router.urls)), # Incluye todas las rutas registradas por el router
    path('reportes/productos-mas-vendidos/', ProductosMasVendidosAPIView.as_view(), name='productos-mas-vendidos'),
    path('reportes/ganancias-por-fecha/', GananciasPorFechaAPIView.as_view(), name='ganancias-por-fecha'),
    path('reportes/ingresos-detallados/', IngresosDetalladosAPIView.as_view(), name='ingresos-detallados'),
    path('reportes/productos-bajo-stock/', ProductosBajoStockAPIView.as_view(), name='productos-bajo-stock'),
    path('reportes/rendimiento-empleados/', RendimientoEmpleadosAPIView.as_view(), name='rendimiento-empleados'),
    path('reportes/ventas-por-cliente/', VentasPorClienteAPIView.as_view(), name='ventas-por-cliente'),
]