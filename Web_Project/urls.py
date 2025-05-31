# WEB_PROJECT/urls.py (archivo principal del proyecto)

from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    # Incluye las URLs de tus nuevas aplicaciones bajo un prefijo '/api/'
    path('api/', include('uglobals.urls')),
    path('api/', include('users.urls')),
    path('api/', include('products.urls')),
    path('api/', include('sales.urls')),
    # Puedes cambiar 'api/' a 'api/v1/' o lo que prefieras para tus endpoints

]