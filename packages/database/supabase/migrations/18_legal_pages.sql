-- Migration 18: Páginas legales en el CMS
--
-- Crea las páginas de Política de Privacidad y Términos y Condiciones
-- como entradas en la tabla `pages`, con su contenido en `page_sections`.
-- Esto reemplaza los campos store_config.privacy_content / terms_content
-- que quedan deprecated (se mantienen en BD para migración gradual).
--
-- Aplica solo si las páginas aún no existen (idempotente).

-- Privacidad
INSERT INTO pages (key, label, slug, page_type, enabled, show_in_footer, order_index)
VALUES ('privacidad', 'Política de privacidad', 'privacidad', 'custom', true, false, 90)
ON CONFLICT (key) DO NOTHING;

INSERT INTO page_sections (page_key, section_type, title, body, enabled, order_index)
SELECT 'privacidad', 'text', 'Política de privacidad',
$$## Política de privacidad

Esta política describe cómo recopilamos, usamos y protegemos tu información personal.

### Información que recopilamos

Recopilamos la información que nos proporcionas al realizar una compra, registrarte en nuestra tienda o suscribirte a nuestro boletín. Esto puede incluir tu nombre, dirección de correo electrónico, dirección de envío y datos de pago.

### Uso de la información

Usamos tu información para:

- Procesar y enviar tus pedidos.
- Comunicarnos contigo sobre el estado de tu pedido.
- Enviarte ofertas y novedades (si te suscribiste al boletín).
- Mejorar nuestra tienda y atención al cliente.

### Compartir información

No vendemos ni cedemos tu información personal a terceros, salvo a los proveedores necesarios para procesar pagos y realizar envíos.

### Seguridad

Tomamos medidas razonables para proteger tu información personal contra accesos no autorizados.

### Contacto

Si tienes preguntas sobre esta política, puedes contactarnos a través de los canales indicados en nuestra tienda.$$,
true, 1
WHERE NOT EXISTS (
  SELECT 1 FROM page_sections WHERE page_key = 'privacidad' AND section_type = 'text'
);

-- Términos y condiciones
INSERT INTO pages (key, label, slug, page_type, enabled, show_in_footer, order_index)
VALUES ('terminos', 'Términos y condiciones', 'terminos', 'custom', true, false, 91)
ON CONFLICT (key) DO NOTHING;

INSERT INTO page_sections (page_key, section_type, title, body, enabled, order_index)
SELECT 'terminos', 'text', 'Términos y condiciones',
$$## Términos y condiciones

Al acceder y usar esta tienda, aceptas los siguientes términos y condiciones.

### Productos y precios

Los precios están expresados en pesos colombianos (COP) e incluyen IVA cuando aplica. Nos reservamos el derecho de modificar precios sin previo aviso.

### Pedidos y pagos

Al realizar un pedido, garantizas que la información proporcionada es verídica y que estás autorizado a usar el método de pago seleccionado. Nos reservamos el derecho de cancelar pedidos en caso de errores de precio o disponibilidad.

### Envíos

Los tiempos de entrega son estimados y pueden variar según la zona de destino y disponibilidad del transportador. No somos responsables por demoras causadas por terceros.

### Devoluciones

Aceptamos devoluciones dentro de los primeros 15 días calendario desde la recepción del producto, siempre que esté en su estado original y sin uso.

### Propiedad intelectual

Todo el contenido de esta tienda (imágenes, textos, logotipos) es propiedad de la empresa y está protegido por las leyes de propiedad intelectual.

### Modificaciones

Podemos actualizar estos términos en cualquier momento. El uso continuado de la tienda implica la aceptación de los términos vigentes.

### Contacto

Para cualquier consulta relacionada con estos términos, contáctanos a través de los canales indicados en nuestra tienda.$$,
true, 1
WHERE NOT EXISTS (
  SELECT 1 FROM page_sections WHERE page_key = 'terminos' AND section_type = 'text'
);
