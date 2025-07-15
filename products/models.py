# products/models.py
from django.db import models
from decimal import Decimal
from uglobals.models import Proveedor, Categoria, Marca
from django.db.models.signals import pre_save
from django.dispatch import receiver
from django.db import transaction

# Modelo Producto
class Producto(models.Model):
    referencia_producto = models.CharField(max_length=50, unique=True, blank=True, null=True)
    nombre = models.CharField(max_length=255)
    precio_costo = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    precio_sugerido_venta = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    stock = models.IntegerField(default=0)
    marca = models.ForeignKey(Marca, on_delete=models.SET_NULL, null=True, blank=True, related_name='productos')
    proveedor = models.ForeignKey(Proveedor, on_delete=models.CASCADE, related_name='productos')
    categoria = models.ForeignKey(Categoria, on_delete=models.SET_NULL, null=True, related_name='productos')
    # CAMBIO AQUÍ: Ahora es ImageField
    # upload_to='productos/' significa que las imágenes se guardarán en MEDIA_ROOT/productos/
    imagen = models.ImageField(upload_to='productos/', blank=True, null=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    activo = models.BooleanField(default=True)

    def __str__(self):
        return self.nombre

@receiver(pre_save, sender=Producto)
def generar_referencia_producto(sender, instance, **kwargs):
    if instance._state.adding and not instance.referencia_producto:
        with transaction.atomic():
            last_product = Producto.objects.select_for_update().order_by('-id').first()
            next_id = (last_product.id if last_product else 0) + 1
            suffix = f"{next_id:09d}"
            instance.referencia_producto = f"PRODKEEPLIC{suffix}"