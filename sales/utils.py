# sales/utils.py
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from django.core.mail import EmailMessage
from django.conf import settings
import os
from decimal import Decimal

# Importar modelos de las aplicaciones correspondientes
from sales.models import Factura, DetalleVenta
from products.models import Producto

# --- CONFIGURACIÓN DE LA EMPRESA (AJUSTA ESTO A TUS DATOS) ---
COMPANY_NAME = "Keeplic Prueba Online"
COMPANY_WEBSITE = "https://keeplicpo.com"
COMPANY_ADDRESS = "Avenida Las Palmas #9-22,Centro comercial S.A, Fusagasugá, Cundinamarca, Colombia"
COMPANY_PHONE = "+57 3203157857"
COMPANY_EMAIL = "comercial@keeplicpo.com, ventas@keeplicpo.com, soporte@keeplicpo.com"
COMPANY_POLICY = "El comprador ha de examinar inmediatamente el producto para comprobar si presenta algún defecto, dentro de un plazo máximo de 8 días desde la entrega, debiendo notificar los posibles defectos, no se hace devolución de dinero. / En caso de reclamación, el comprador debe devolver el producto a la dirección correspondiente, inmediatamente después de haber descubierto el defecto y dentro de un plazo máximo de 8 días naturales, adjuntando una descripción del defecto e indicando el número de referencia se examinará el producto y, se validará la garantía de acuerdo a la ley del consumidor artículo I capitulo VII."

# --- RUTA DE TU LOGO (AJUSTA SI ES NECESARIO) ---
COMPANY_LOGO_PATH = os.path.join(settings.MEDIA_ROOT, 'logo', 'logo.png')


def generate_invoice_pdf(invoice_id):
    """
    Genera un PDF de la factura con un diseño profesional, incluyendo logo,
    colores corporativos y políticas de garantía.
    Retorna la ruta del PDF generado o None y un mensaje de error.
    """
    try:
        invoice = Factura.objects.select_related('cliente', 'forma_pago', 'usuario').get(id=invoice_id)
    except Factura.DoesNotExist:
        return None, "Factura no encontrada para generar PDF."

    pdf_dir = os.path.join(settings.MEDIA_ROOT, 'invoices_temp')
    os.makedirs(pdf_dir, exist_ok=True)
    pdf_filename = f"factura_{invoice.id_factura}.pdf"
    pdf_path = os.path.join(pdf_dir, pdf_filename)

    doc = SimpleDocTemplate(pdf_path, pagesize=letter,
                            rightMargin=50, leftMargin=50,
                            topMargin=50, bottomMargin=50)
    styles = getSampleStyleSheet()
    story = []

    # --- Definir Estilos Personalizados con Colores Corporativos ---
    styles.add(ParagraphStyle(name='InvoiceTitle', parent=styles['h1'],
                              fontSize=28, leading=32, alignment=1, # Centrado
                              spaceAfter=18, textColor=colors.HexColor('#00b45c')))

    styles.add(ParagraphStyle(name='SectionHeader', parent=styles['h2'],
                              fontSize=14, leading=16, spaceAfter=8,
                              textColor=colors.HexColor('#000000'),
                              fontName='Helvetica-Bold'))

    styles.add(ParagraphStyle(name='BodyTextCustom', parent=styles['Normal'],
                              fontSize=10, leading=14, spaceAfter=4,
                              textColor=colors.HexColor('#000000')))

    styles.add(ParagraphStyle(name='FooterText', parent=styles['Normal'],
                              fontSize=9, leading=12, alignment=1,
                              textColor=colors.HexColor('#000000')))

    styles.add(ParagraphStyle(name='PolicyText', parent=styles['Normal'],
                              fontSize=8, leading=10, alignment=4, # Justificado
                              spaceBefore=10, spaceAfter=10,
                              textColor=colors.HexColor('#000000')))

    # NUEVO ESTILO: Para el total alineado a la derecha
    from reportlab.lib.enums import TA_RIGHT
    styles.add(ParagraphStyle(name='TotalAmountStyle', parent=styles['h2'],
                              alignment=TA_RIGHT, # Alineación a la derecha
                              textColor=colors.HexColor('#00b45c'), # Verde corporativo
                              fontName='Helvetica-Bold'))


    # --- Encabezado de la Empresa (Logo a la izquierda, Info a la derecha) ---
    header_data = []

    logo_cell = []
    if os.path.exists(COMPANY_LOGO_PATH):
        try:
            logo = Image(COMPANY_LOGO_PATH, width=150, height=50)
            logo_cell.append(logo)
        except Exception as e:
            print(f"Error al cargar la imagen del logo desde {COMPANY_LOGO_PATH}: {e}")
            logo_cell.append(Paragraph(f"<font size=18 color='#00b45c'><b>{COMPANY_NAME}</b></font>", styles['Normal']))
    else:
        print(f"Advertencia: El archivo de logo no se encontró en {COMPANY_LOGO_PATH}. Usando nombre de empresa como fallback.")
        logo_cell.append(Paragraph(f"<font size=18 color='#00b45c'><b>{COMPANY_NAME}</b></font>", styles['Normal']))

    company_info_cell = [
        Paragraph(f"<b>{COMPANY_NAME}</b>", styles['SectionHeader']),
        Paragraph(COMPANY_ADDRESS, styles['BodyTextCustom']),
        Paragraph(f"Teléfono: {COMPANY_PHONE}", styles['BodyTextCustom']),
        Paragraph(f"Email: {COMPANY_EMAIL}", styles['BodyTextCustom']),
        Paragraph(f"Web: {COMPANY_WEBSITE}", styles['BodyTextCustom']),
    ]

    header_data.append([logo_cell, company_info_cell])

    header_table = Table(header_data, colWidths=[2.5*inch, 3.5*inch])
    header_table.setStyle(TableStyle([
        ('ALIGN', (0,0), (0,-1), 'LEFT'),
        ('ALIGN', (1,0), (1,-1), 'RIGHT'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,0), 10),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 0.2 * inch))

    # --- Línea Separadora ---
    story.append(Paragraph("<hr/>", styles['Normal']))
    story.append(Spacer(1, 0.1 * inch))

    # --- Título de la Factura ---
    story.append(Paragraph(f"<b>FACTURA DE VENTA</b>", styles['InvoiceTitle']))
    story.append(Spacer(1, 0.2 * inch))

    # --- Información de la Factura y Cliente (en dos columnas) ---
    invoice_client_data = []
    invoice_info = [
        Paragraph(f"<b>No. Factura:</b> {invoice.id_factura}", styles['BodyTextCustom']),
        Paragraph(f"<b>Fecha de Emisión:</b> {invoice.fecha.strftime('%d/%m/%Y %H:%M:%S')}", styles['BodyTextCustom']),
        Paragraph(f"<b>Estado:</b> {invoice.estado}", styles['BodyTextCustom']),
    ]
    client_info = [
        Paragraph("<b>Detalles del Cliente:</b>", styles['SectionHeader']),
        Paragraph(f"<b>Nombre:</b> {invoice.cliente.nombre if invoice.cliente else 'N/A'}", styles['BodyTextCustom']),
        Paragraph(f"<b>Teléfono:</b> {invoice.cliente.telefono if invoice.cliente else 'N/A'}", styles['BodyTextCustom']),
        Paragraph(f"<b>Email:</b> {invoice.cliente.email if invoice.cliente else 'N/A'}", styles['BodyTextCustom']),
    ]
    invoice_client_data.append([invoice_info, client_info])

    invoice_client_table = Table(invoice_client_data, colWidths=[3*inch, 3*inch])
    invoice_client_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,0), 10),
    ]))
    story.append(invoice_client_table)
    story.append(Spacer(1, 0.2 * inch))

    # --- Detalles de la Venta (Forma de Pago, Atendido por) ---
    story.append(Paragraph("<b>Detalles de la Venta:</b>", styles['SectionHeader']))
    story.append(Paragraph(f"<b>Forma de Pago:</b> {invoice.forma_pago.metodo if invoice.forma_pago else 'N/A'}", styles['BodyTextCustom']))
    story.append(Paragraph(f"<b>Atendido por:</b> {invoice.usuario.username if invoice.usuario else 'N/A'}", styles['BodyTextCustom']))
    story.append(Spacer(1, 0.2 * inch))

    # --- Tabla de Ítems ---
    story.append(Paragraph("<b>Productos Adquiridos:</b>", styles['SectionHeader']))

    data = [['Referencia', 'Producto', 'Cantidad', 'Precio Unitario', 'Subtotal']]
    
    for item in invoice.detalle_ventas.all():
        product_ref = item.producto.referencia_producto if item.producto else 'N/A'
        product_name = item.producto.nombre if item.producto else 'Producto Eliminado'
        data.append([
            product_ref,
            product_name,
            str(item.cantidad),
            f"${item.precio_unitario:,.2f}",
            f"${item.subtotal:,.2f}"
        ])

    table_style = TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#00b45c')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('ALIGN', (2, 0), (-1, -1), 'RIGHT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#ffffff')),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#000000')),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#000000')),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ])

    table = Table(data, colWidths=[1.2*inch, 2.5*inch, 0.8*inch, 1.2*inch, 1.2*inch])
    table.setStyle(table_style)
    story.append(table)
    story.append(Spacer(1, 0.2 * inch))

    # --- Resumen de Totales ---
    # Usar el nuevo estilo TotalAmountStyle para el párrafo del total
    total_data = [
        [Paragraph(f"<b>Total Factura:</b> <font color='#00b45c'><b>${invoice.total:,.2f}</b></font>", styles['TotalAmountStyle'])]
    ]
    total_table = Table(total_data, colWidths=[6*inch])
    total_table.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'RIGHT'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 10),
        ('BOTTOMPADDING', (0,0), (-1,-1), 10),
        ('LINEBELOW', (0,0), (-1,-1), 1, colors.HexColor('#000000')),
    ]))
    story.append(total_table)
    story.append(Spacer(1, 0.4 * inch))

    # --- Políticas de Garantía ---
    story.append(Paragraph("<b>POLÍTICAS DE GARANTÍA Y DEVOLUCIÓN:</b>", styles['SectionHeader']))
    story.append(Paragraph(COMPANY_POLICY, styles['PolicyText']))
    story.append(Spacer(1, 0.4 * inch))

    # --- Pie de Página ---
    story.append(Paragraph("¡Gracias por tu compra!", styles['FooterText']))
    story.append(Paragraph(f"{COMPANY_NAME} | {COMPANY_PHONE} | {COMPANY_EMAIL}", styles['FooterText']))
    story.append(Paragraph("Este es un documento generado automáticamente y es válido sin firma.", styles['FooterText']))


    try:
        doc.build(story)
        return pdf_path, None
    except Exception as e:
        return None, f"Error al construir el PDF: {e}"

def send_invoice_email(invoice_id, recipient_email, pdf_path):
    """
    Envía el PDF de la factura por email al destinatario especificado.
    Retorna True si el envío fue exitoso, False y un mensaje de error si falló.
    """
    if not recipient_email:
        return False, "No se proporcionó un email de destinatario."

    try:
        invoice = Factura.objects.get(id=invoice_id)
    except Factura.DoesNotExist:
        return False, "Factura no encontrada para enviar email."

    subject = f"Tu Factura de Compra - No. {invoice.id_factura} de {COMPANY_NAME}"
    email_body = f"""
Hola {invoice.cliente.nombre if invoice.cliente else 'Cliente'},

Adjunto encontrarás tu factura de compra No. {invoice.id_factura}.

Detalles de la factura:
Fecha: {invoice.fecha.strftime('%d/%m/%Y %H:%M')}
Total: ${invoice.total:,.2f}

Gracias por tu compra. ¡Esperamos verte de nuevo!

Saludos,
El equipo de {COMPANY_NAME}
{COMPANY_PHONE}
{COMPANY_EMAIL}
"""

    email = EmailMessage(
        subject,
        email_body,
        settings.DEFAULT_FROM_EMAIL,
        [recipient_email],
    )
    if pdf_path and os.path.exists(pdf_path):
        email.attach_file(pdf_path)
    else:
        return False, "PDF de factura no encontrado para adjuntar."

    try:
        email.send()
        return True, "Email enviado exitosamente."
    except Exception as e:
        return False, f"Error al enviar el email: {e}"
