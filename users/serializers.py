# users/serializers.py

from rest_framework import serializers
from .models import Rol, Permiso, Usuario
from django.contrib.auth.hashers import make_password
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

# Tu RolSerializer existente:
class RolSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rol
        fields = '__all__'

# Tu PermisoSerializer existente:
class PermisoSerializer(serializers.ModelSerializer):
    rol = serializers.PrimaryKeyRelatedField(queryset=Rol.objects.all())

    class Meta:
        model = Permiso
        fields = '__all__'

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        if instance.rol:
            representation['rol'] = RolSerializer(instance.rol).data
        else:
            representation['rol'] = None
        return representation

# --- Serializador para Rol con sus permisos (para el login y CurrentUserView) ---
class RolWithPermisosSerializer(serializers.ModelSerializer):
    # Esto asume que tienes un related_name='permisos' en tu FK de Permiso a Rol
    # o que Django crea un `_set` por defecto (ej. permiso_set)
    permisos = PermisoSerializer(many=True, read_only=True)

    class Meta:
        model = Rol
        fields = ['id', 'nombre', 'permisos']
# --- FIN Serializador de Rol con permisos ---


# Tu UsuarioSerializer existente (CON AJUSTES IMPORTANTES):
class UsuarioSerializer(serializers.ModelSerializer):
    rol = serializers.PrimaryKeyRelatedField(queryset=Rol.objects.all(), allow_null=True)
    rol_nombre = serializers.CharField(source='rol.nombre', read_only=True)
    
    # --- ¡CAMBIO CLAVE AQUÍ: AÑADE ESTE CAMPO PARA INCLUIR EL ROL COMPLETO CON PERMISOS! ---
    # Cuando UsuarioSerializer serialice un Usuario, incluirá `rol_data` con la info completa del rol.
    rol_data = RolWithPermisosSerializer(source='rol', read_only=True)

    class Meta:
        model = Usuario
        # Asegúrate de que 'rol_data' esté en los fields.
        # 'password' es solo para escritura, no lectura.
        fields = ['id', 'username', 'email', 'rol', 'rol_nombre', 'rol_data', 'password']
        extra_kwargs = {
            'password': {'write_only': True, 'required': False} 
        }

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

    # --- ¡ELIMINA O COMENTA EL MÉTODO to_representation DE AQUÍ! ---
    # Ya no es necesario porque el campo `rol_data` añadido arriba maneja la serialización
    # completa del rol, y mantener este método causaría redundancia o conflictos.
    # def to_representation(self, instance):
    #     representation = super().to_representation(instance)
    #     if instance.rol:
    #         representation['rol'] = RolSerializer(instance.rol).data
    #     else:
    #         representation['rol'] = None
    #     return representation


# --- Serializador personalizado para el token de login ---
class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Añade información personalizada al payload del token
        token['username'] = user.username
        token['email'] = user.email
        if user.rol:
            # Serializa el rol completo con sus permisos usando RolWithPermisosSerializer
            token['rol_data'] = RolWithPermisosSerializer(user.rol).data
        else:
            token['rol_data'] = None

        return token

    def validate(self, attrs):
        # Llama al método validate original para obtener los tokens
        data = super().validate(attrs)

        # Añade la información del usuario al JSON de respuesta (fuera del token)
        # Como UsuarioSerializer ahora incluye 'rol_data' con permisos, lo obtenemos directamente.
        data['user'] = UsuarioSerializer(self.user).data 
        
        # Elimina el 'password' del objeto de usuario serializado en la respuesta de login por seguridad
        if 'password' in data['user']:
            del data['user']['password']

        return data