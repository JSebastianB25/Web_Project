# WEB_PROJECT/api_urls.py

from django.urls import path, include
from users.views import MyTokenObtainPairView # Necesario para las vistas de JWT aquí
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    # Incluye las URLs de estas aplicaciones directamente bajo /api/.
    # Esto manejará /api/productos/, /api/uglobals/, y cualquier cosa dentro de /api/sales/
    # (incluyendo clientes, formas_pago, y proveedores si están en uglobals o sales como dices).
    path('', include('uglobals.urls')),
    path('', include('products.urls')),
    path('', include('sales.urls')),

    # --- MANEJO ESPECIAL PARA LA APP 'USERS' (La inconsistencia del frontend) ---
    # Tu frontend llama:
    # 1. /api/usuarios/ y /api/roles/ (directamente bajo /api/)
    # 2. /api/users/me/ (con el prefijo 'users/')

    # Para /api/usuarios/ y /api/roles/:
    # Esto asume que tu `users/urls.py` tiene el router que registra 'usuarios' y 'roles' en su raíz.
    path('', include('users.urls')), 

    # Para /api/users/me/:
    # Definimos esta ruta específica aquí para que coincida con lo que el frontend espera.
    # El `include('users.urls')` hace que Django busque 'me/' dentro del `users/urls.py`
    # después de que el prefijo 'users/' haya sido emparejado.
    path('users/', include('users.urls')), 

    # --- RUTAS JWT (LOGIN / REFRESH) ---
    # Se mantienen directamente bajo /api/
    path('token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]