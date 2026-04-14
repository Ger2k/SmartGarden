# Smart Garden

Aplicacion web para gestionar huertos y jardines de forma inteligente: seguimiento de plantas, tareas de cuidado, salud, clima y planificacion semanal.

## Que puede hacer el usuario hoy

### 1) Acceso y sesion
- Iniciar sesion con Google (Firebase Auth).
- Entrar en modo demo aunque Firebase no este configurado.
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

### 7) Resiliencia en modo demo
- Si Firestore/Auth no estan disponibles, la app sigue funcionando en modo local.
- Se guarda informacion de demo en localStorage (plantas, tareas y planes).

## Funcionalidades implementadas (tecnico)

- Frontend con Astro + React + Tailwind.
- Rutas de aplicacion: inicio, login, dashboard, plantas, tareas y calendario.
- Integracion de Firebase Auth + Firestore (con fallback local para demo).
- Integracion de clima via OpenWeather.
- Reglas de seguridad de Firestore incluidas en el repo.
- Tests unitarios para el generador de planes de cuidado.
- Configuracion para despliegue SSR en Netlify.

## Roadmap (proximas implementaciones)

### Prioridad alta
- Notificaciones y recordatorios (in-app y/o email/push).
- Alertas proactivas de riesgo (plagas, estres hidrico, tareas criticas vencidas).
- Mejoras de UX del dashboard con mas contexto accionable.

### Prioridad media
- Estadisticas historicas y tendencias por planta (productividad/salud).
- Configuracion avanzada de reglas por especie y temporada.
- Exportacion de tareas e historial (CSV/PDF).

### Prioridad baja
- Modo colaborativo para varios usuarios por jardin.
- Adjuntos multimedia por planta (fotos de seguimiento).
- Internacionalizacion completa (ES/EN) con selector de idioma.

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
- `OPENWEATHER_API_KEY`

Nota: si faltan variables de Firebase, la app permite uso en modo demo con almacenamiento local.

## Scripts

Todos los comandos se ejecutan en la raiz del proyecto:

- `npm install`: instala dependencias.
- `npm run dev`: inicia entorno de desarrollo.
- `npm run build`: genera build de produccion.
- `npm run preview`: previsualiza build local.
- `npm run test`: ejecuta tests en modo watch.
- `npm run test:run`: ejecuta tests una vez.

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
