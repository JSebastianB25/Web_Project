# users/views.py
from rest_framework import viewsets
from .models import Rol, Permiso, Usuario # Importa modelos desde su propio models.py
from .serializers import RolSerializer, PermisoSerializer, UsuarioSerializer # Importa serializadores

class RolViewSet(viewsets.ModelViewSet):
    queryset = Rol.objects.all()
    serializer_class = RolSerializer

class PermisoViewSet(viewsets.ModelViewSet):
    queryset = Permiso.objects.all()
    serializer_class = PermisoSerializer

class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer