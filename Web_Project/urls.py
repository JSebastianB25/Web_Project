# WEB_PROJECT/urls.py (archivo principal del proyecto)

from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
from users.views import MyTokenObtainPairView # Make sure this import is correct

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('Web_Project.api_urls')),
]