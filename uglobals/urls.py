# zglobals/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProveedorViewSet, MarcaViewSet, CategoriaViewSet, FormaPagoViewSet# Importa tus vistas

router = DefaultRouter()
router.register(r'proveedores', ProveedorViewSet)
router.register(r'marcas', MarcaViewSet)
router.register(r'categorias', CategoriaViewSet)
router.register(r'formas_pago', FormaPagoViewSet)

urlpatterns = [
    path('', include(router.urls)), # Incluye todas las rutas registradas por el router
]