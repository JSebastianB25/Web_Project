# users/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RolViewSet, PermisoViewSet, UsuarioViewSet # Importa tus vistas

router = DefaultRouter()
router.register(r'roles', RolViewSet)
router.register(r'permisos', PermisoViewSet)
router.register(r'usuarios', UsuarioViewSet)

urlpatterns = [
    path('', include(router.urls)), # Incluye todas las rutas registradas por el router
]