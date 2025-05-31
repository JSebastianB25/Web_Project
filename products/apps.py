# products/apps.py
from django.apps import AppConfig

class ProductsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'products' # ¡IMPORTANTE! Debe coincidir con el nombre de tu app