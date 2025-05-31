# sales/models.py
from django.db import models, transaction
from django.core.exceptions import ValidationError
from decimal import Decimal

# Importaciones de modelos desde otras apps
from uglobals.models import FormaPago # Desde la app 'globals'
from products.models import Producto # Desde la app 'products'
from users.models import Usuario     # Desde la app 'users'

# Modelo Cliente
class Cliente(models.Model):
    id = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=255)
    telefono = models.CharField(max_length=15, blank=True)
    email = models.EmailField(unique=True)
    def __str__(self):
        return self.nombre

# Modelo Factura
class Factura(models.Model):
    id_factura = models.CharField(max_length=20, unique=True, default='00000000000')
    fecha = models.DateTimeField(auto_now_add=True)
    cliente = models.ForeignKey(Cliente, on_delete=models.PROTECT, related_name='facturas')
    forma_pago = models.ForeignKey(FormaPago, on_delete=models.PROTECT, related_name='facturas')
    total = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    estado = models.CharField(max_length=50, default='Pendiente')
    usuario = models.ForeignKey(Usuario, on_delete=models.PROTECT, related_name='facturas_creadas')

    def save(self, *args, **kwargs):
        if not self.id_factura or self.id_factura == '00000000000':
            last_factura = Factura.objects.all().order_by('-id').first()
            if last_factura and last_factura.id_factura and last_factura.id_factura.isdigit():
                new_id_num = int(last_factura.id_factura) + 1
                self.id_factura = str(new_id_num).zfill(11)
            else:
                self.id_factura = '00000000001'
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Factura #{self.id_factura} - {self.cliente.nombre} ({self.total})"

# Modelo DetalleVenta
class DetalleVenta(models.Model):
    id = models.AutoField(primary_key=True)
    factura = models.ForeignKey(Factura, on_delete=models.CASCADE, related_name='detalle_ventas')
    producto = models.ForeignKey(Producto, on_delete=models.PROTECT, related_name='detalles_venta')
    cantidad = models.IntegerField()
    precio_unitario = models.DecimalField(max_digits=10, decimal_places=2)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, editable=False)

    def save(self, *args, **kwargs):
        self.subtotal = self.cantidad * self.precio_unitario

        is_new_creation = self.pk is None
        original_cantidad = 0
        if not is_new_creation:
            original_detalle = DetalleVenta.objects.get(pk=self.pk)
            original_cantidad = original_detalle.cantidad

        cantidad_a_deducir = self.cantidad if is_new_creation else (self.cantidad - original_cantidad)

        with transaction.atomic():
            try:
                product_for_update = Producto.objects.select_for_update().get(pk=self.producto.pk)

                if product_for_update.stock >= cantidad_a_deducir:
                    product_for_update.stock -= cantidad_a_deducir
                    product_for_update.save()
                    print(f"Stock para {product_for_update.nombre} (Ref: {product_for_update.referencia_producto}) actualizado. Nuevo stock: {product_for_update.stock}")
                else:
                    raise ValidationError(
                        f"Stock insuficiente para el producto '{product_for_update.nombre}'. "
                        f"Stock actual: {product_for_update.stock}, intentó vender: {self.cantidad}."
                    )
            except Producto.DoesNotExist:
                raise ValidationError(f"Producto con referencia '{self.producto.pk}' no encontrado.")
            except Exception as e:
                print(f"Error inesperado deduciendo stock para {self.producto.nombre}: {e}")
                raise ValidationError(f"Error interno al actualizar stock: {e}")

        super().save(*args, **kwargs)

    def __str__(self):
        return f"Detalle de Venta para {self.factura.id_factura} - {self.producto.nombre}"