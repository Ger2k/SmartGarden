# Smart Garden

Aplicacion web para gestionar huertos y jardines de forma inteligente: seguimiento de plantas, tareas de cuidado, salud, clima y planificacion semanal.

## Que puede hacer el usuario hoy

### 1) Acceso y sesion
- Iniciar sesion con Google (Firebase Auth).
- Navegar entre secciones protegidas (panel, plantas, tareas, calendario).

### 2) Panel principal
- Ver resumen general del estado del jardin.
- Consultar informacion meteorologica contextual (temperatura, lluvia estimada, condiciones).
- Visualizar indicadores utiles para decisiones de cuidado.

### 3) Gestion de plantas
- Registrar plantas con tipo, nombre y fecha de plantacion.
- Listar y editar plantas existentes.
- Eliminar plantas.
- Mantener estado de salud y puntaje de salud por planta.

### 4) Tareas de cuidado
- Generar y guardar tareas de cuidado.
- Marcar tareas como completadas o saltadas.
- Ver tareas del dia.
- Revisar historial de tareas.

### 5) Plan de cuidado inteligente
- Generar recomendaciones por planta segun reglas de negocio.
- Ajustar frecuencia de riego con base en pronostico de lluvia y tendencia de calor.
- Incluir insights explicativos y registro de decisiones.

### 6) Calendario
- Vista mensual y semanal.
- Seleccion de dia para ver detalle de tareas.
- Navegacion por fechas para planificacion operativa.

### 7) Resiliencia operativa
- Validacion de sesion en rutas protegidas con token de Firebase.
- Mensajes de error visibles para incidencias de configuracion o permisos.

## Funcionalidades implementadas (tecnico)

- Frontend con Astro + React + Tailwind.
- Rutas de aplicacion: inicio, login, dashboard, plantas, tareas y calendario.
- Integracion de Firebase Auth + Firestore.
- Integracion de clima via Open-Meteo.
- Reglas de seguridad de Firestore incluidas en el repo.
- Tests unitarios para el generador de planes de cuidado.
- Configuracion para despliegue SSR en Netlify.

## Estado real del proyecto (auditado)

Leyenda:
- Completado: usable hoy en flujo principal.
- Parcial: existe base tecnica pero faltan piezas para considerarlo cerrado.
- Pendiente: aun no implementado.

### Estado funcional por area

1. Base del producto y arquitectura: Completado.
- Astro + React + Tailwind en SSR.
- Rutas principales y estructura por features.

2. Autenticacion y sesion: Parcial.
- Login Google funcionando.
- Middleware de rutas protegidas activo.
- Validacion server-side de sesion Firebase implementada en middleware.
- Pendiente mover validacion a flujo con Admin SDK/session cookies para entorno productivo estricto.

3. Base de datos por usuario: Parcial.
- Firestore por usuario en `users/{uid}/plants|tasks|carePlans`.
- Reglas de seguridad incluidas.
- Tests de reglas con emulador ejecutados y pasando.
- Validaciones de payload reforzadas en servicios (plantas y tareas).

4. Clima (Open-Meteo): Parcial.
- Endpoint `/api/weather/forecast` con normalizacion y fallback.
- Integrado en dashboard y generador de plan.
- Observabilidad basica implementada (logs de fallback + señal visual en UI).
- Pendiente control de cuota/rate-limit y estrategia de cache mas robusta.

5. Operacion diaria (plantas, tareas, calendario): Parcial.
- Alta/baja de plantas, tareas del dia, historial y calendario mes/semana.
- Falta edicion completa de plantas en UI y mejoras de UX en errores/carga.

6. Plan inteligente y analitica basica: Parcial.
- Generador de plan con lluvia/tendencia de calor + insights.
- Analitica por planta (salud, tendencia, cumplimiento, atrasos).
- Faltan tests de integracion end-to-end y refinamiento de algoritmo con datos historicos reales.

7. Alertas y notificaciones: Pendiente.

8. Colaboracion, exportaciones y multimedia: Pendiente.

## Plan de desarrollo paso a paso (fase por fase)

Objetivo: avanzar por incrementos pequenos, verificables y con puntos de ajuste antes de pasar a la siguiente fase.

### Fase 0 - Baseline de calidad (1-2 dias)
Objetivo:
- Estabilizar entorno de desarrollo para evitar falsos errores.

Tareas:
- Documentar y automatizar limpieza de cache Vite cuando aparezca conflicto local.
- Agregar script de chequeo rapido (`test:run + build`) como puerta de salida de cada fase.

Verificacion:
- `npm run test:run` en verde.
- `npm run build` en verde.
- Sin errores bloqueantes al abrir login, dashboard y calendario.

### Fase 1 - Seguridad de autenticacion y sesion (2-3 dias)
Objetivo:
- Pasar de proteccion por cookie simple a validacion robusta de sesion.

Tareas:
- Validar sesion en servidor usando token real de Firebase cuando exista.
- Unificar manejo de expiracion de sesion y logout seguro.

Verificacion:
- Rutas protegidas no accesibles sin sesion valida.
- No se puede forzar acceso solo escribiendo cookie manual.
- Login/logout consistentes en refresh y navegacion directa.

### Fase 2 - Cierre de datos por usuario (2-3 dias)
Objetivo:
- Endurecer persistencia y reglas para operaciones reales.

Tareas:
- Agregar tests de reglas Firestore (lectura/escritura por usuario).
- Revisar constraints de campos opcionales (por ejemplo `completedAt` y estados).

Verificacion:
- Usuario A no puede leer/escribir datos de usuario B.
- Operaciones CRUD validas pasan; payloads invalidos fallan con error controlado.
- Sin corrupcion de tipos fecha/estado en lectura y escritura.

### Fase 3 - Clima confiable y observable (2-3 dias)
Objetivo:
- Hacer que integracion de clima sea predecible en produccion.

Tareas:
- Mejorar cache de pronostico (TTL y claves por coordenada).
- Registrar fallos de API y fallback usados.
- Ajustar manejo de errores de UI para diferenciar datos reales vs fallback.

Verificacion:
- El panel sigue operativo aun con API de clima caida.
- Se identifica visualmente cuando el dato es fallback.
- Tiempo de respuesta estable en dashboard.

### Fase 4 - UX operativa (plantas/tareas/calendario) (3-4 dias)
Objetivo:
- Completar funcionalidades base de uso diario sin huecos.

Tareas:
- Implementar edicion de plantas en UI.
- Mejorar filtros de tareas (hoy, vencidas, completadas).
- Pulir calendario (acciones directas desde detalle del dia).

Verificacion:
- CRUD completo de plantas desde UI.
- Flujo diario se realiza sin salir de dashboard/calendario.
- Errores visibles y recuperables por usuario.

### Fase 5 - Inteligencia y analitica v2 (3-5 dias)
Objetivo:
- Convertir analitica actual en herramienta de decision.

Tareas:
- Analitica por periodo (7/30 dias).
- Mini series de salud por planta.
- Alertas de riesgo: tendencia a la baja + tareas atrasadas.

Verificacion:
- El usuario puede detectar que planta requiere accion en menos de 10 segundos.
- Las alertas disparan solo con reglas explicables.

### Fase 6 - Notificaciones y recordatorios (3-4 dias)
Objetivo:
- Cerrar el ciclo de accion fuera de la pantalla principal.

Tareas:
- Sistema inicial in-app de recordatorios.
- Preferencias por usuario (horario/frecuencia).
- Base para email/push posterior.

Verificacion:
- Recordatorios visibles y no duplicados.
- Se pueden activar/desactivar por usuario.

### Fase 7 - Hardening final y release (2-3 dias)
Objetivo:
- Preparar una release estable y medible.

Tareas:
- QA de regresion en flujos criticos.
- Checklist de despliegue y variables de entorno.
- Actualizar documentacion final y roadmap siguiente.

Verificacion:
- Smoke test completo en entorno de despliegue.
- Sin errores criticos abiertos.

## Mecanica de trabajo por fase

- Implementar solo alcance de la fase actual.
- Ejecutar verificacion tecnica (`test:run`, `build`) y verificacion funcional manual.
- Registrar hallazgos (errores, riesgos, ajustes).
- Ajustar la fase antes de abrir la siguiente.

## Requisitos

- Node.js 22.12.0 o superior.
- npm 10 o superior (recomendado).

## Variables de entorno

Crear un archivo `.env` basado en `.env.example`.

Variables disponibles:
- `PUBLIC_FIREBASE_API_KEY`
- `PUBLIC_FIREBASE_AUTH_DOMAIN`
- `PUBLIC_FIREBASE_PROJECT_ID`
- `PUBLIC_FIREBASE_STORAGE_BUCKET`
- `PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `PUBLIC_FIREBASE_APP_ID`
- `PERENUAL_API_KEY` (opcional, para obtener frecuencia de riego desde Perenual)

Notas:
- Si faltan variables de Firebase, la app no podra autenticarse ni acceder a Firestore.
- Si falta `PERENUAL_API_KEY`, el plan de cuidado usa la frecuencia de riego local definida en `plants.json`.

## Scripts

Todos los comandos se ejecutan en la raiz del proyecto:

- `npm install`: instala dependencias.
- `npm run dev`: inicia entorno de desarrollo.
- `npm run build`: genera build de produccion.
- `npm run preview`: previsualiza build local.
- `npm run test`: ejecuta tests en modo watch.
- `npm run test:run`: ejecuta tests una vez.
- `npm run test:rules:run`: ejecuta tests de reglas (requiere emulador ya activo).
- `npm run test:rules`: levanta emulador Firestore y ejecuta tests de reglas.
- `npm run clean:vite`: limpia cache local de Vite (`node_modules/.vite`).
- `npm run verify`: ejecuta validacion rapida (`test:run` + `build`).
- `npm run verify:full`: ejecuta validacion completa (`verify` + `test:rules`).

Requisito para pruebas de reglas:
- JDK 21 o superior (firebase-tools ya no soporta versiones anteriores de Java).

## Protocolo Fase 0 (baseline de calidad)

Ejecutar siempre antes de iniciar una fase nueva o despues de fixes grandes.

1. Limpiar estado local de bundler si hubo recargas inestables:
- `npm run clean:vite`

2. Verificar salud tecnica minima:
- `npm run verify`

3. Smoke test manual corto:
- Abrir `/login` y comprobar que renderiza correctamente.
- Iniciar sesion con Google y abrir `/dashboard`.
- Abrir `/calendar` y confirmar que carga sin error.

Criterio de salida de Fase 0:
- Verificacion tecnica en verde.
- Sin errores bloqueantes visibles en login/dashboard/calendar.
- Solo entonces iniciar la siguiente fase del plan.

## Estructura principal

```text
src/
	components/
	features/
	hooks/
	pages/
	services/
	types/
tests/
firestore.rules
firestore.indexes.json
```

## Estado del proyecto

MVP funcional en curso con foco en experiencia en espanol, flujo operativo diario y base tecnica segura para evolucionar a analitica y automatizacion avanzada.
