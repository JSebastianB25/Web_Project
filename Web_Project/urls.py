from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ProveedorViewSet, CategoriaViewSet, ClienteViewSet, FormaPagoViewSet,
    ProductoViewSet, FacturaViewSet, DetalleVentaViewSet, RolViewSet, PermisoViewSet, UsuarioViewSet
)

router = DefaultRouter()
router.register(r'proveedores', ProveedorViewSet)
router.register(r'categorias', CategoriaViewSet)
router.register(r'clientes', ClienteViewSet)
router.register(r'formas-pago', FormaPagoViewSet)
router.register(r'productos', ProductoViewSet)
router.register(r'facturas', FacturaViewSet)
router.register(r'detalle-ventas', DetalleVentaViewSet)
router.register(r'roles', RolViewSet)
router.register(r'permisos', PermisoViewSet)
router.register(r'usuarios', UsuarioViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
]
