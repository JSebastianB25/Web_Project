# yourappname/views.py

from rest_framework import viewsets
# Make sure to import Producto model
from .models import Proveedor, Categoria, Cliente, FormaPago, Producto, Factura, DetalleVenta, Rol, Permiso, Usuario
from .serializers import (
    ProveedorSerializer, CategoriaSerializer, ClienteSerializer, FormaPagoSerializer,
    ProductoSerializer, FacturaSerializer, DetalleVentaSerializer, RolSerializer,
    PermisoSerializer, UsuarioSerializer
)

class ProveedorViewSet(viewsets.ModelViewSet):
    queryset = Proveedor.objects.all()
    serializer_class = ProveedorSerializer

class CategoriaViewSet(viewsets.ModelViewSet):
    queryset = Categoria.objects.all()
    serializer_class = CategoriaSerializer

class ClienteViewSet(viewsets.ModelViewSet):
    queryset = Cliente.objects.all()
    serializer_class = ClienteSerializer

class FormaPagoViewSet(viewsets.ModelViewSet):
    queryset = FormaPago.objects.all()
    serializer_class = FormaPagoSerializer

class ProductoViewSet(viewsets.ModelViewSet):
    queryset = Producto.objects.all()
    serializer_class = ProductoSerializer
    # Add this to filter products by stock > 0 for POS
    def get_queryset(self):
        # Only show active products with stock > 0 for listing in POS
        if self.action == 'list':
            return Producto.objects.filter(activo=True, stock__gt=0)
        return Producto.objects.all()


class FacturaViewSet(viewsets.ModelViewSet):
    queryset = Factura.objects.all()
    serializer_class = FacturaSerializer

class DetalleVentaViewSet(viewsets.ModelViewSet):
    queryset = DetalleVenta.objects.all()
    serializer_class = DetalleVentaSerializer

    # --- THIS IS THE KEY CHANGE FOR STOCK DEDUCTION ---
    def perform_create(self, serializer):
        # Save the DetalleVenta instance first
        detalle_venta = serializer.save()

        # Deduct stock from the related Product
        producto = detalle_venta.producto # Get the product instance from the saved DetalleVenta
        cantidad_vendida = detalle_venta.cantidad

        # Use F() expressions for atomic updates to prevent race conditions
        from django.db.models import F
        try:
            # Update the stock using an F() expression, which is atomic at the database level
            # This is more robust than fetching, modifying, and saving
            rows_updated = Producto.objects.filter(
                referencia_producto=producto.referencia_producto,
                stock__gte=cantidad_vendida # Ensure stock is sufficient before deducting
            ).update(stock=F('stock') - cantidad_vendida)

            if rows_updated == 0:
                # This means stock was insufficient or product not found
                # It's crucial to handle this. For now, we'll raise an error.
                # A more refined solution might rollback the DetalleVenta as well.
                # In a real app, you'd likely want to raise a ValidationError here
                # before saving the DetalleVenta if stock is not sufficient.
                # However, perform_create is called *after* initial serializer.save() (though not committed yet).
                # For now, print and consider enhancing validation in serializer.
                print(f"FAILED STOCK DEDUCTION: Not enough stock for {producto.nombre}. Needed {cantidad_vendida}, Current would be insufficient.")
                # You might choose to raise a validation error here to prevent the sale,
                # but it requires a bit more context. For now, we'll log the issue.
                raise serializers.ValidationError(
                    {"stock_error": f"No hay suficiente stock para {producto.nombre}. Stock insuficiente para la venta."}
                )
            else:
                print(f"Stock for {producto.nombre} (Ref: {producto.referencia_producto}) deducted by {cantidad_vendida}.")

        except Exception as e:
            print(f"Error during atomic stock deduction for {producto.nombre}: {e}")
            raise serializers.ValidationError(
                {"server_error": f"Error interno al actualizar stock: {e}"}
            )


class RolViewSet(viewsets.ModelViewSet):
    queryset = Rol.objects.all()
    serializer_class = RolSerializer

class PermisoViewSet(viewsets.ModelViewSet):
    queryset = Permiso.objects.all()
    serializer_class = PermisoSerializer

class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer