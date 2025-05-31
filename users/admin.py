# users/admin.py
from django.contrib import admin
from .models import Rol, Permiso, Usuario

admin.site.register(Rol)
admin.site.register(Permiso)
admin.site.register(Usuario)