# products/views.py
from rest_framework import viewsets, filters # Asegúrate de importar 'filters'
from django_filters.rest_framework import DjangoFilterBackend # ¡Importa esto también! (Necesitarás instalar django-filter)
from .models import Producto
from .serializers import ProductoSerializer


class ProductoViewSet(viewsets.ModelViewSet):
    queryset = Producto.objects.all().order_by('-fecha_creacion') # <-- ¡CAMBIO CLAVE AQUÍ!
    serializer_class = ProductoSerializer
    
    # 1. Configurar la clave de búsqueda en la URL
    # Esto es CRUCIAL para que DRF use 'referencia_producto' en URLs como /api/productos/PROD001/
    lookup_field = 'referencia_producto'

    # 2. Configurar los filtros para la búsqueda
    # Usaremos 'SearchFilter' de DRF para la búsqueda general (por referencia, nombre, etc.)
    # Y 'DjangoFilterBackend' si en el futuro quieres filtros exactos por campos específicos (ej. ?categoria=1)
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    
    # Define los campos por los cuales se puede buscar.
    # '__nombre' es para campos de relaciones (ForeignKey) y busca por el nombre de esa relación.
    search_fields = [
        'referencia_producto',
        'nombre',
        'descripcion',
        'proveedor__nombre',   # Busca por el nombre del proveedor
        'categoria__nombre'    # Busca por el nombre de la categoría
        # Si agregaras un campo 'marca' en Producto, lo añadirías aquí: 'marca__nombre'
    ]
    
    # Opcional: Define campos para filtros exactos (ej. /api/productos/?activo=true)
    # filterset_fields = ['categoria', 'proveedor', 'activo']