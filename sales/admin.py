# sales/admin.py
from django.contrib import admin
from .models import Cliente, Factura, DetalleVenta

admin.site.register(Cliente)
admin.site.register(Factura)
admin.site.register(DetalleVenta)

# Opcional: Para una mejor visualización de DetalleVenta en el admin de Factura
# class DetalleVentaInline(admin.TabularInline):
#     model = DetalleVenta
#     extra = 1 # Número de formularios extra en blanco para añadir
#
# class FacturaAdmin(admin.ModelAdmin):
#     inlines = [DetalleVentaInline]
#     list_display = ('id_factura', 'fecha', 'cliente', 'total', 'estado')
#     list_filter = ('estado', 'fecha', 'forma_pago')
#     search_fields = ('id_factura', 'cliente__nombre')
#
# admin.site.unregister(Factura) # Desregistra si ya está registrado
# admin.site.register(Factura, FacturaAdmin)