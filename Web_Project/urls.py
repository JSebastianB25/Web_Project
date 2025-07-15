# WEB_PROJECT/urls.py (archivo principal del proyecto)

from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
from users.views import MyTokenObtainPairView # Make sure this import is correct
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('Web_Project.api_urls')),
]
# NO USAR EN PRODUCCIÓN, para producción se usa un servidor web (Nginx, Apache)
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)