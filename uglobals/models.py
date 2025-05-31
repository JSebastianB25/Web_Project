# zglobals/models.py
from django.db import models

# Modelo Proveedor
class Proveedor(models.Model):
    id = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=255)
    contacto = models.CharField(max_length=255, blank=True)
    def __str__(self):
        return self.nombre

# Modelo Marca
class Marca(models.Model):
    nombre = models.CharField(max_length=100, unique=True)
    imagen = models.URLField(max_length=255, blank=True, null=True) # Campo para la URL de la imagen de la marca

    def __str__(self):
        return self.nombre
    
# Modelo Categoría
class Categoria(models.Model):
    id = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=255)
    def __str__(self):
        return self.nombre

# Modelo FormaPago
class FormaPago(models.Model):
    id = models.AutoField(primary_key=True)
    metodo = models.CharField(max_length=100)
    def __str__(self):
        return self.metodo
    
# Modelo Cliente
class Cliente(models.Model):
        id = models.AutoField(primary_key=True)
        nombre = models.CharField(max_length=100)
        cedula = models.CharField(max_length=20, unique=True, blank=True, null=True) # Cedula, opcional y única
        correo = models.CharField(max_length=255, blank=True, null=True) # Usamos correo en lugar de direccion
        telefono = models.CharField(max_length=20, blank=True, null=True)
        email = models.EmailField(unique=True, blank=True, null=True) # Sigue siendo email y opcional
        def __str__(self):
            return self.nombre 