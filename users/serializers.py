# users/serializers.py
from rest_framework import serializers
from .models import Rol, Permiso, Usuario # Importa desde su propio models.py
from django.contrib.auth.hashers import make_password

class RolSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rol
        fields = '__all__'

class PermisoSerializer(serializers.ModelSerializer):
    # Esto le dice a DRF que para WRITING (POST/PUT), espere un ID de Rol.
    rol = serializers.PrimaryKeyRelatedField(queryset=Rol.objects.all())

    class Meta:
        model = Permiso
        fields = '__all__'
        # NO poner 'depth=1' aquí cuando usas PrimaryKeyRelatedField para la escritura.
        # El depth es para READING, y lo manejamos con to_representation.

    # ESTO ES CLAVE para que el frontend vea el nombre del rol en las respuestas GET.
    def to_representation(self, instance):
        # Obtiene la representación por defecto del serializador (con 'rol' como ID)
        representation = super().to_representation(instance)
        # Si el permiso tiene un rol asignado, reemplaza el ID del rol
        # con la representación completa del objeto Rol.
        if instance.rol: # Verifica si hay un rol
            representation['rol'] = RolSerializer(instance.rol).data
        else:
            representation['rol'] = None # O puedes poner un string como 'Sin Rol'
        return representation

class UsuarioSerializer(serializers.ModelSerializer):
    # Esto le dice a DRF que para WRITING (POST/PUT), espere un ID de Rol.
    # allow_null=True es importante porque tu FK en el modelo es null=True.
    rol = serializers.PrimaryKeyRelatedField(queryset=Rol.objects.all(), allow_null=True)

    class Meta:
        model = Usuario
        fields = '__all__'
        extra_kwargs = {
            'password': {'write_only': True, 'required': False}
        }
        # NO poner 'depth=1' aquí.

    # Sobreescribe create y update para el hasheo de contraseña
    def create(self, validated_data):
        password = validated_data.pop('password', None)
        usuario = Usuario.objects.create(**validated_data)
        if password:
            usuario.password = make_password(password)
        usuario.save()
        return usuario

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.password = make_password(password)
        instance.save()
        return instance

    # ESTO ES CLAVE para que el frontend vea el nombre del rol en las respuestas GET.
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        if instance.rol: # Verifica si hay un rol
            representation['rol'] = RolSerializer(instance.rol).data
        else:
            representation['rol'] = None # O puedes poner 'Sin Rol'
        return representation