# FORDTECH

Prototipo administrativo de un taller mecánico. Un único proyecto React + JSX con Vite, Tailwind CSS, Lucide React, React Router y almacenamiento local. No necesita backend ni servicios externos.

## Ejecutar

Requiere Node.js 20.19+ o 22.12+ (verificado con Node.js 24).

```sh
npm install
npm run dev
```

Para una instalación reproducible con el archivo de bloqueo: `npm ci`.

```sh
npm test
npm run build
npm run preview
```

`npm run build` genera `dist`. `npm test` ejecuta las pruebas de relaciones, cálculos, inventario, notas de entrega y protección de historiales.

## Accesos de demostración

| Rol | Correo | Contraseña |
| --- | --- | --- |
| Administrador | admin@fordtech.com | admin123 |
| Empleado | empleado@fordtech.com | empleado123 |

La autenticación, usuarios y persistencia están simulados con localStorage. No es autenticación segura para producción. No introduzcas información sensible ni contraseñas reales. Los datos pertenecen a cada navegador; no hay sincronización entre equipos. El administrador puede restaurar todos los datos de demostración desde el menú lateral, con confirmación.

## Funciones

- Dashboard con cifras y presupuestos recientes.
- Clientes y vehículos: alta, edición, eliminación sin relaciones, desactivación, búsqueda y fichas con historial y filtros por fecha/vehículo.
- Servicios y repuestos: catálogo, precios, estados y existencias. El empleado puede consultarlos; la administración del catálogo y usuarios está reservada al administrador.
- Presupuestos: líneas desde los catálogos, cantidades y precios independientes, descuento en USD, impuesto porcentual, estados, duplicación, impresión/PDF y enlace WhatsApp con mensaje. El PDF se adjunta manualmente.
- El inventario se descuenta de forma atómica una sola vez al completar un presupuesto. Se verifica el stock combinado por repuesto; un documento completado queda protegido. Los trabajos aprobados y completados alimentan el historial sin registros duplicados.
- Notas de entrega: una por presupuesto aprobado/completado, autocompletado de cliente, vehículo y detalle; kilometraje, observaciones, recomendaciones, condiciones, responsable, receptor y fechas. Se pueden editar mientras estén pendientes. Marcar como entregada protege el documento. No modifica el presupuesto, no descuenta inventario y no genera ventas.
- Impresión profesional de presupuestos y entregas: logo, identificación, detalle y firmas, sin navegación administrativa. Para PDF, seleccionar «Guardar como PDF» en el diálogo de impresión del navegador.
- Datos ficticios: 8 clientes, 12 vehículos, 10 servicios, 15 repuestos, 8 presupuestos, 2 usuarios y 2 notas de entrega.

El recurso estático `public/logo.svg` es una recreación vectorial de la referencia visual proporcionada; conserva la marca y los colores azul, blanco y rojo. Se utiliza en acceso, menú y documentos.

## Netlify

Conecta este repositorio a Netlify. El archivo `netlify.toml` en la raíz define automáticamente:

- Comando: `npm run build`.
- Directorio publicado: `dist`.
- Reescritura de todas las rutas a `index.html` (HTTP 200), necesaria para abrir o recargar rutas de React Router directamente.

No requiere variables de entorno, servidor Node.js permanente ni dominio personalizado. No es necesario publicar el servidor de desarrollo. Netlify sirve únicamente los archivos estáticos de `dist`.

### Despliegue manual y diagnóstico de 404

Para subir archivos manualmente a Netlify, ejecuta `npm run build` y sube la carpeta `dist` completa (no `src`, `public` ni la raíz del proyecto). Debe contener `index.html`, `assets`, `logo.svg` y `_redirects`. Vite copia automáticamente `public/_redirects` a `dist`, de modo que las rutas directas también funcionan en despliegues manuales.

Para desplegar desde GitHub, asegúrate de que los archivos nuevos del proyecto estén guardados en un commit y enviados a la rama conectada a Netlify. La raíz del proyecto debe ser el directorio base y `dist` el directorio publicado. `netlify.toml` establece el comando y directorio automáticamente. Un 404 en la página principal puede indicar que se publicó una carpeta incorrecta o una versión que aún no contiene la aplicación; un 404 solo al recargar una ruta puede indicar que falta la regla SPA.
