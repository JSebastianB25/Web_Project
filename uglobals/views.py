# zglobals/views.py
from rest_framework import viewsets
from .models import Proveedor, Marca, Categoria, FormaPago, Cliente # Importa modelos desde su propio models.py
from .serializers import ProveedorSerializer,MarcaSerializer, CategoriaSerializer, FormaPagoSerializer, ClienteSerializer # Importa serializadores

class ProveedorViewSet(viewsets.ModelViewSet):
    queryset = Proveedor.objects.all()
    serializer_class = ProveedorSerializer

class MarcaViewSet(viewsets.ModelViewSet):
    queryset = Marca.objects.all()
    serializer_class = MarcaSerializer

class CategoriaViewSet(viewsets.ModelViewSet):
    queryset = Categoria.objects.all()
    serializer_class = CategoriaSerializer

class FormaPagoViewSet(viewsets.ModelViewSet):
    queryset = FormaPago.objects.all()
    serializer_class = FormaPagoSerializer

class ClientesViewSet(viewsets.ModelViewSet):
    queryset = Cliente.objects.all()
    serializer_class = ClienteSerializer    