# sales/apps.py
from django.apps import AppConfig

class SalesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'sales' # ¡IMPORTANTE! Debe coincidir con el nombre de tu app