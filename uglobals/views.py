# zglobals/views.py
from rest_framework import viewsets
from .models import Proveedor, Marca, Categoria, FormaPago # Importa modelos desde su propio models.py
from .serializers import ProveedorSerializer,MarcaSerializer, CategoriaSerializer, FormaPagoSerializer # Importa serializadores

class ProveedorViewSet(viewsets.ModelViewSet):
    queryset = Proveedor.objects.all().order_by('nombre')
    serializer_class = ProveedorSerializer

class MarcaViewSet(viewsets.ModelViewSet):
    queryset = Marca.objects.all().order_by('nombre')
    serializer_class = MarcaSerializer

class CategoriaViewSet(viewsets.ModelViewSet):
    queryset = Categoria.objects.all().order_by('nombre')
    serializer_class = CategoriaSerializer

class FormaPagoViewSet(viewsets.ModelViewSet):
    queryset = FormaPago.objects.all().order_by('metodo')
    serializer_class = FormaPagoSerializer
   