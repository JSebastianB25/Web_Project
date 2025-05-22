from django.contrib import admin
from .models import (
    Proveedor, Categoria, Cliente, FormaPago, Producto, Factura,
    DetalleVenta, Rol, Permiso, Usuario
)

admin.site.register(Proveedor)
admin.site.register(Categoria)
admin.site.register(Cliente)
admin.site.register(FormaPago)
admin.site.register(Producto)
admin.site.register(Factura)
admin.site.register(DetalleVenta)
admin.site.register(Rol)
admin.site.register(Permiso)
admin.site.register(Usuario)