# users/models.py
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager # <-- IMPORTA ESTOS

# Manager personalizado para tu modelo Usuario
class UsuarioManager(BaseUserManager):
    def create_user(self, username, email, password=None, **extra_fields):
        if not username:
            raise ValueError('El campo de usuario es obligatorio.')
        if not email:
            raise ValueError('El campo de email es obligatorio.')
        email = self.normalize_email(email)
        user = self.model(username=username, email=email, **extra_fields)
        user.set_password(password) # set_password hashea la contraseña
        user.save(using=self._db)
        return user

    def create_superuser(self, username, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(username, email, password, **extra_fields)

# Modelo Rol (sin cambios)
class Rol(models.Model):
    id = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.nombre

# Modelo Permiso (sin cambios)
class Permiso(models.Model):
    id = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=255)
    descripcion = models.TextField(blank=True)
    rol = models.ForeignKey(Rol, on_delete=models.CASCADE, related_name='permisos')

    def __str__(self):
        return self.nombre

# Modelo Usuario (CAMBIADO)
class Usuario(AbstractBaseUser, PermissionsMixin): # <--- HEREDA DE ESTOS DOS
    id = models.AutoField(primary_key=True)
    username = models.CharField(max_length=255, unique=True)
    password = models.CharField(max_length=255) # AbstractBaseUser ya maneja el hasheo internamente con set_password
    email = models.EmailField(unique=True)
    rol = models.ForeignKey(Rol, on_delete=models.SET_NULL, null=True, related_name='usuarios')
    
    # <--- AÑADE ESTOS CAMPOS PARA CUMPLIR CON AbstractBaseUser ---
    is_staff = models.BooleanField(default=False) # Permite acceder al panel de administración de Django
    is_active = models.BooleanField(default=True) # Si la cuenta está activa
    date_joined = models.DateTimeField(auto_now_add=True) # Fecha de creación

    objects = UsuarioManager() # <--- ASIGNA TU MANAGER PERSONALIZADO

    USERNAME_FIELD = 'username' # <--- CAMPO USADO PARA INICIAR SESIÓN
    REQUIRED_FIELDS = ['email'] # <--- CAMPOS OBLIGATORIOS AL CREAR UN SUPERUSUARIO (además del USERNAME_FIELD y password)
    # --- FIN DE CAMPOS NECESARIOS ---

    def __str__(self):
        return self.username

    # Métodos requeridos por PermissionsMixin
    # No los uses para tu lógica de permisos, usa el rol y permisos directamente
    # Pero son necesarios para que Django sepa que este es un modelo de usuario
    def get_full_name(self):
        return self.username

    def get_short_name(self):
        return self.username

    # Si vas a usar el sistema de permisos de Django, estos son necesarios.
    # Para tu caso, donde manejas permisos por Rol, puedes simplificarlos así
    # o directamente no depender de ellos para tu lógica de negocio.
    # Pero son requeridos por PermissionsMixin
    def has_perm(self, perm, obj=None):
        # Simplificado: Un superusuario tiene todos los permisos
        if self.is_active and self.is_superuser:
            return True
        # Si tienes lógica de permisos a nivel de Django para tu Rol,
        # la implementarías aquí buscando en self.rol.permisos
        # Por ahora, simplemente permite que Django Admin funcione.
        return False

    def has_module_perms(self, app_label):
        # Simplificado: Un superusuario tiene permisos para todos los módulos
        if self.is_active and self.is_superuser:
            return True
        return False