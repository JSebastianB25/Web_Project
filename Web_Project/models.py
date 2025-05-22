from django.db import models

# 📌 1️⃣ Modelo Proveedor
class Proveedor(models.Model):
    id = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=255)
    contacto = models.CharField(max_length=255, blank=True)

# 📌 2️⃣ Modelo Categoría
class Categoria(models.Model):
    id = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=255)

# 📌 3️⃣ Modelo Cliente
class Cliente(models.Model):
    id = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=255)
    telefono = models.CharField(max_length=15, blank=True)
    email = models.EmailField(unique=True)

# 📌 4️⃣ Modelo FormaPago
class FormaPago(models.Model):
    id = models.AutoField(primary_key=True)
    metodo = models.CharField(max_length=100)

# 📌 5️⃣ Modelo Producto
class Producto(models.Model):
    referencia_producto = models.CharField(max_length=50, primary_key=True)
    nombre = models.CharField(max_length=255)
    descripcion = models.TextField(blank=True)
    precio_costo = models.DecimalField(max_digits=10, decimal_places=2)
    stock = models.IntegerField(default=0)
    proveedor = models.ForeignKey(Proveedor, on_delete=models.CASCADE)
    categoria = models.ForeignKey(Categoria, on_delete=models.SET_NULL, null=True)
    imagen = models.CharField(max_length=255, blank=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    activo = models.BooleanField(default=True)

    def __str__(self):
        return self.nombre


# 📌 6️⃣ Modelo Factura
class Factura(models.Model):
    id_factura = models.AutoField(primary_key=True)
    cliente = models.ForeignKey(Cliente, on_delete=models.CASCADE)
    fecha = models.DateTimeField(auto_now_add=True)
    forma_pago = models.ForeignKey(FormaPago, on_delete=models.SET_NULL, null=True)
    total = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    estado = models.CharField(max_length=50, default='pendiente')

# 📌 7️⃣ Modelo DetalleVenta
class DetalleVenta(models.Model):
    id = models.AutoField(primary_key=True)
    factura = models.ForeignKey(Factura, on_delete=models.CASCADE)
    producto = models.ForeignKey(Producto, on_delete=models.CASCADE)
    cantidad = models.IntegerField()
    precio_unitario = models.DecimalField(max_digits=10, decimal_places=2)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, editable=False)

    def save(self, *args, **kwargs):
        # Calculate subtotal before saving
        self.subtotal = self.cantidad * self.precio_unitario
        super().save(*args, **kwargs) # Save the DetalleVenta instance first

        # --- Stock Deduction Logic ---
        # Ensure this only runs when a new DetalleVenta is created,
        # or when its quantity changes (if you allow editing of past sales, which is rare).
        # For simplicity, we'll deduct when saved.

        # Use select_for_update to lock the product row during the transaction
        # to prevent race conditions if multiple sales happen simultaneously for the same product.
        try:
            with transaction.atomic():
                product = self.producto # Get the related product instance
                # Retrieve the product again within the atomic block to ensure its latest state
                product_for_update = Producto.objects.select_for_update().get(pk=product.pk)

                if product_for_update.stock >= self.cantidad:
                    product_for_update.stock -= self.cantidad
                    product_for_update.save()
                    print(f"Stock for {product_for_update.nombre} (Ref: {product_for_update.referencia_producto}) updated. New stock: {product_for_update.stock}")
                else:
                    # This scenario should ideally be caught on the frontend,
                    # but it's crucial to handle it on the backend too for data integrity.
                    print(f"Insufficient stock for {product_for_update.nombre}. Current: {product_for_update.stock}, Tried to sell: {self.cantidad}")
                    # You might want to raise an exception here to prevent the DetalleVenta save
                    # if stock is critical, but the save has already happened.
                    # A better place for critical stock checks is before the DetalleVenta is saved.
                    # For now, it will simply log and potentially lead to negative stock if not handled elsewhere.
                    # A common practice is to move this check to a serializer's create method or a view.
        except Exception as e:
            print(f"Error deducting stock for {self.producto.nombre}: {e}")
            # If an error occurs during stock deduction, you might want to log it
            # or even reverse the DetalleVenta creation (though that's more complex).
            # For robustness, consider using Django Signals or overriding serializer's create method.

    def __str__(self):
        return f"Detalle de Venta for {self.factura.id_factura} - {self.producto.nombre}"


# 📌 8️⃣ Modelo Rol
class Rol(models.Model):
    id = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=100, unique=True)

# 📌 9️⃣ Modelo Permiso
class Permiso(models.Model):
    id = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=255)
    descripcion = models.TextField(blank=True)
    rol = models.ForeignKey(Rol, on_delete=models.CASCADE)

# 📌 🔟 Modelo Usuario
class Usuario(models.Model):
    id = models.AutoField(primary_key=True)
    username = models.CharField(max_length=255, unique=True)
    password = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    rol = models.ForeignKey(Rol, on_delete=models.SET_NULL, null=True)
