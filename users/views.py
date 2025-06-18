# users/views.py
from rest_framework import viewsets
from rest_framework_simplejwt.views import TokenObtainPairView # <--- IMPORTA ESTO
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated # Puedes descomentar y usar estas líneas más adelante para controlar el acceso a los ViewSets

from .models import Rol, Permiso, Usuario # Importa modelos desde su propio models.py
# Importa tus serializadores, incluyendo el personalizado para JWT:
from .serializers import RolSerializer, PermisoSerializer, UsuarioSerializer, MyTokenObtainPairSerializer # <--- IMPORTA MyTokenObtainPairSerializer

# ViewSet para la gestión de Roles (CRUD)
class RolViewSet(viewsets.ModelViewSet):
    queryset = Rol.objects.all().order_by('nombre')
    serializer_class = RolSerializer
    # permission_classes = [IsAdminUser] # Ejemplo: solo administradores pueden gestionar roles

# ViewSet para la gestión de Permisos (CRUD)
class PermisoViewSet(viewsets.ModelViewSet):
    queryset = Permiso.objects.all().order_by('nombre')
    serializer_class = PermisoSerializer
    # permission_classes = [IsAdminUser] # Ejemplo: solo administradores pueden gestionar permisos

# ViewSet para la gestión de Usuarios (CRUD)
class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = Usuario.objects.all().order_by('username')
    serializer_class = UsuarioSerializer
    # permission_classes = [IsAuthenticated, IsAdminUser] # Ejemplo: solo administradores autenticados pueden gestionar usuarios

# Vista personalizada para el endpoint de inicio de sesión JWT
# Utiliza tu serializador MyTokenObtainPairSerializer que incluye la información del usuario y su rol/permisos
class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer

class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated] # Only authenticated users can access this

    def get(self, request):
        # request.user contains the authenticated user object
        serializer = UsuarioSerializer(request.user) # Use your existing UsuarioSerializer
        return Response(serializer.data)
