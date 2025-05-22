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
        self.subtotal = self.cantidad * self.precio_unitario
        super().save(*args, **kwargs)

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
