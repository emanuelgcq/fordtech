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

| Rol           | Correo                | Contraseña  |
| ------------- | --------------------- | ----------- |
| Administrador | admin@fordtech.com    | admin123    |
| Empleado      | empleado@fordtech.com | empleado123 |

La autenticación, usuarios y persistencia están simulados con localStorage. No es autenticación segura para producción. No introduzcas información sensible ni contraseñas reales. Los datos pertenecen a cada navegador; no hay sincronización entre equipos. El administrador puede restaurar todos los datos de demostración desde el menú lateral, con confirmación.

## Funciones

- Dashboard con cifras y presupuestos recientes.
- Clientes y vehículos: alta, edición, eliminación sin relaciones, desactivación, búsqueda y fichas con historial y filtros por fecha/vehículo.
- Servicios y repuestos: catálogo, precios, estados y existencias. El empleado puede consultarlos; la administración del catálogo y usuarios está reservada al administrador.
- Presupuestos: líneas desde los catálogos, cantidades y precios independientes, descuento en USD, impuesto porcentual, estados, duplicación, impresión/PDF y enlace WhatsApp con mensaje. El PDF se adjunta manualmente.
- El inventario se descuenta de forma atómica una sola vez al completar un presupuesto. Se verifica el stock combinado por repuesto; un documento completado queda protegido. Los trabajos aprobados y completados alimentan el historial sin registros duplicados.
- Notas de entrega: una por presupuesto aprobado/completado, autocompletado de cliente, vehículo y detalle; kilometraje, observaciones, recomendaciones, condiciones, responsable, receptor y fechas. Se pueden editar mientras estén pendientes. Emitir la nota completa los trabajos pendientes, marca el vehículo como entregado y lo retira del taller. El inventario se descuenta desde la finalización de cada presupuesto una sola vez, sin generar otra venta. Las notas pendientes antiguas son borradores sin emitir.
- Impresión profesional de presupuestos y entregas: logo, identificación, detalle y firmas, sin navegación administrativa. Para PDF, seleccionar «Guardar como PDF» en el diálogo de impresión del navegador.
- Datos ficticios: 8 clientes, 12 vehículos, 44 servicios, 15 repuestos, 26 presupuestos, 22 ingresos al taller, 2 usuarios y 20 notas de entrega. Incluye 18 visitas históricas entregadas de 6 clientes y 8 vehículos, además de 4 ingresos activos.

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

## Taller y expedientes integrales

La sección **Taller** reemplaza la lista general de vehículos del menú. Muestra exclusivamente las estancias con estado **En el taller**, con los servicios y repuestos asociados a cada ingreso. Los vehículos registrados que estén fuera del taller se consultan desde la ficha de su propietario.

1. Abre un cliente para consultar sus vehículos, datos de contacto y expediente completo. Puedes registrar otro vehículo desde esa ficha.
2. En **Taller → Ingresar vehículo**, selecciona el cliente registrado y uno de sus vehículos. Registra fecha, kilometraje, motivo/síntomas y condiciones de recepción. Puedes vincular un presupuesto disponible o crear automáticamente uno nuevo para este ingreso.
3. En **Gestionar ingreso**, consulta los accesos a las fichas completas del cliente y del vehículo. Registra diagnóstico, evolución, recomendaciones y agrega servicios y repuestos del catálogo, con cantidades y precios particulares. Guarda el seguimiento y los trabajos.
4. Pulsa **Finalizar estancia / nota de entrega** para registrar receptor, responsable, kilometraje, fecha y condiciones finales. La operación completa el presupuesto, descuenta existencias una sola vez, genera o entrega la nota existente y cambia el ingreso a **Entregado**. Si una validación falla, la operación completa no se guarda.
5. El vehículo deja la lista activa y su estancia queda en el expediente. Puede ingresar nuevamente con otro registro y presupuesto; sus antecedentes permanecen disponibles.

La ficha del cliente mantiene su expediente y filtros. La ficha del vehículo usa una vista sencilla: propietario y datos principales arriba, seguidos de una lista de visitas con fecha, kilometraje, servicios, productos y total. Cada estancia reúne sus presupuestos adicionales sin repetirla en el historial. El buscador permite encontrar trabajos, productos, fechas y documentos; las observaciones y presupuestos se consultan en «Más detalles». Los recibos y el trabajo actual tienen accesos directos.

### Catálogo suministrado por FORDTECH

Se reemplazaron los 10 servicios ficticios por **44 trabajos** distribuidos en motores, entonaciones, escáner, empacaduras, tren delantero, resellados, aire acondicionado, electricidad, kits de tiempo, croché y diagnóstico. Escáner HP Tuners parte de USD 80; el kit de cadena de 4 cilindros tiene rango USD 150–200. El precio final se puede ajustar en el detalle del trabajo sin alterar el catálogo. «Entonación mayor cilindros» se interpreta como 8 cilindros por su posición en la lista.

Los 15 productos de demostración siguen separados: la tarifa suministrada corresponde a trabajos, no a precios de repuestos. El administrador puede actualizar sus precios y existencias desde Productos.

La actualización migra automáticamente el catálogo en localStorage, manteniendo clientes, vehículos, productos, presupuestos históricos, notas y servicios propios añadidos con identificadores diferentes a los iniciales. Los nombres y precios de documentos anteriores se conservan. No se atribuyen ingresos activos a vehículos antiguos automáticamente: para iniciar su seguimiento, regístralos en Taller. Una instalación nueva incluye 4 ingresos ficticios activos para mostrar el flujo.

### Vista sencilla del taller y recibo de entrega

Desde la tarjeta de un vehículo con trabajo editable, pulsa **Añadir servicio** o **Añadir producto**. También encontrarás ambos botones al abrir el vehículo: aparece un buscador, seleccionas el artículo y ajustas cantidad/precio en su lista. Las observaciones y datos de recepción están en una sección desplegable. Guarda los cambios y pulsa **Entregar vehículo y generar recibo**.

La nota de entrega muestra todos los trabajos y productos, cantidades, precios unitarios, subtotales, descuento, impuesto y total USD. Conserva los importes al entregar el vehículo; mientras la nota esté pendiente, se sincronizan con el presupuesto. Los documentos anteriores reciben sus importes desde el presupuesto vinculado al actualizarse. La impresión y PDF incluyen el recibo sin menú administrativo. Los trabajos ya completados o entregados mantienen protegido su detalle histórico. Una nota pendiente no bloquea la edición: sus líneas y total se actualizan con el presupuesto hasta finalizar la entrega.

### Emitir una nota cierra la estancia

**Emitir nota y entregar vehículo** finaliza el ingreso en la misma operación, tanto desde Taller como desde Notas de Entrega. No queda un vehículo «En el taller» con una nota emitida. Los documentos pendientes antiguos se muestran como **Borrador · sin emitir** y permiten seguir trabajando hasta su emisión.

Un presupuesto completado conserva sus líneas y el inventario ya descontado. Mientras el vehículo continúe en el taller, **Añadir servicio/producto** registra los trabajos adicionales en un presupuesto nuevo vinculado a la misma estancia. El recibo final reúne todos los trabajos y sus importes; únicamente se descuentan los repuestos de los trabajos nuevos. No se altera el documento histórico ni se duplica el descuento de existencias.

### Historial de demostración

María González, Carlos Mendoza y Luisa Pérez tienen varias visitas finalizadas con servicios, repuestos, totales y recibos. Ana Rodríguez incluye una compra de batería sin servicios; también hay visitas con solo servicios. Los trabajos entregados aparecen en las fichas del cliente y del vehículo, fuera de la lista del taller activo.

Si el navegador ya tiene datos guardados, el administrador puede cargar este nuevo caso desde «Restaurar demostración». La confirmación reemplaza los registros locales por los datos de ejemplo.
