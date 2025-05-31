# products/views.py
from rest_framework import viewsets
from .models import Producto # Importa modelo desde su propio models.py
from .serializers import ProductoSerializer # Importa serializador

class ProductoViewSet(viewsets.ModelViewSet):
    queryset = Producto.objects.all()
    serializer_class = ProductoSerializer