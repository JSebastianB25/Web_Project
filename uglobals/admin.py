# zglobals/admin.py
from django.contrib import admin
from .models import Proveedor, Marca, Categoria, FormaPago

admin.site.register(Proveedor)
admin.site.register(Marca)
admin.site.register(Categoria)
admin.site.register(FormaPago)