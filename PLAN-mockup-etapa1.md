# Plan — Mockup Etapa 1 (Shutdown Molinos 3D)

**Objetivo:** un mockup navegable que DIMARZA pueda usar en la presentación para ver cómo se sigue en vivo el cambio de liners de un molino. Sin backend: datos simulados, guardados en `localStorage` y sincronizados entre pestañas del navegador para simular el tiempo real.

**Criterio de aceptación global**

- `npm run build` en `mockup/` termina sin errores.
- Al cambiar una pieza en una pestaña, la otra pestaña abierta se actualiza sola (2D, 3D y KPIs).
- Con el rol "Minera" no se puede cambiar ninguna pieza ni editar hitos.

## Datos del molino de ejemplo

- Minera: **Sierra Gorda** · Molino: **ML021** · Shutdown: **SD-2026-11 Cambio de revestimientos**.
- Segundo molino en el selector: **ML022**, mismas medidas, todo en `P`.
- Shell (cilindro): 7 anillos `SL R1`…`SL R7` × 28 filas = **196 piezas**.
- Tapa de alimentación: anillos `FIHL` 12, `FMFL` 12, `OHL` 24 = **48 piezas**.
- Tapa de descarga: anillos `DIHL` 12, `OHL` 24 = **36 piezas**.
- Total **280 piezas**. Estado inicial de ML021: anillos `SL R1`…`SL R3` en `RC` (84 piezas), el resto en `P`.
- Plan del shutdown: 72 horas que empiezan hoy a las 07:00, turnos Día (07:00–19:00) y Noche (19:00–07:00).

## Tarea 1 — Dominio, store y estructura

**Archivos:** `src/domain/`, `src/store/`, `src/layout/`, `src/pages/LoginPage.tsx`, `src/pages/AccessMatrixPage.tsx`, `src/App.tsx`, `src/main.tsx`, `index.html`.

1. `src/domain/types.ts`: `PieceState = 'P' | 'R' | 'RC'`; `Section = 'shell' | 'feed' | 'discharge'`; `Piece { id, section, ring, index, state, hasPhoto, updatedBy?, updatedAt? }`; `Mill { code, name, site, shutdown, pieces }`; `Milestone { id, parentId?, name, start, end, progress }`; `Incident { id, shift, time, description, minutes }`; `AuditEntry { at, user, action }`; `Role = 'admin' | 'supervisor' | 'minera'`.
2. `src/domain/seed.ts`: genera los dos molinos, 4 hitos resumen con 3–5 actividades hijas cada uno (Actividades previas: bloqueo de equipo, retiro de protecciones, armado de andamios; Instalación de máquina lainera; Cambio de revestimientos: desmontaje y montaje por sección; Giro N° 0 y entrega), 3 incidencias de ejemplo y la serie del plan de piezas por turno.
3. `src/store/useMillStore.ts` (zustand con `persist` en `localStorage`): molino activo, usuario y rol activos, `cyclePiece(id)` (P→R→RC→P), `togglePhoto(id)`, CRUD de hitos, agregar incidencia, `undo()` de la última acción, `reset()`, y bitácora (`AuditEntry`) de cada cambio.
4. Sincronización entre pestañas con `BroadcastChannel('dimarza-sync')`: cada cambio se emite y las otras pestañas lo aplican. El contador "X usuarios conectados" cuenta pestañas vivas con un latido cada 2 s.
5. `src/layout/AppLayout.tsx`: barra lateral con Inicio (KPIs), Mapeo 2D, Vista 3D, Curvas S y Gantt, Bitácora, Accesos por rol. Cabecera con el texto `Sincronizado · {n} usuarios conectados · Sierra Gorda · ML021`, punto verde animado, selector de molino y el nombre y rol del usuario.
6. `LoginPage`: elegir uno de 3 usuarios de ejemplo (Admin DIMARZA, Supervisor de turno, Cliente Sierra Gorda con rol `minera`). Sin contraseña.
7. `AccessMatrixPage`: tabla de qué puede ver y hacer cada rol (ver, cambiar piezas, subir foto, editar hitos, exportar, ver bitácora).
8. Rutas con `react-router-dom`; el rol `minera` no ve Bitácora ni Accesos.

**Aceptación:** compila; se entra con cada usuario; la cabecera muestra el contador y cambia al abrir otra pestaña.

## Tarea 2 — Inicio (KPIs) y Mapeo 2D

**Archivos:** `src/pages/DashboardPage.tsx`, `src/pages/MappingPage.tsx`, `src/components/kpi/`, `src/components/mapping/`.

1. 5 tarjetas KPI calculadas del store, nunca escritas a mano: Avance total (% RC sobre 280, `x / 280 cambiados`, `y retirados`); Avance vs plan (esperado del turno actual vs real); Shell; Tapa de alimentación; Tapa de descarga (cada una con `R: x · C: y / total`).
2. Barra de estado: "Avance en línea con el plan" en verde si real ≥ esperado, "Atrasado N piezas" en rojo si no.
3. Barra de herramientas: Modo concentrado (oculta la barra lateral), Exportar Excel y Exportar PDF (muestran un aviso "Disponible en la versión final"), Backup JSON (descarga el estado real), Historial, Revertir acción (`undo`), Reset (pide confirmación).
4. Shell desplegado: grilla 7 columnas (anillos) × 28 filas, cada celda con su número y color de estado, ícono de cámara si tiene foto. Clic cambia el estado; botón secundario marca foto. Filtros: Todos, Solo P, Solo R, Solo RC, Pendientes (P+R). Barra de progreso por anillo.
5. Tapas en vista frontal: SVG polar con anillos concéntricos divididos en sectores numerados, mismos colores y mismo clic. En la tapa de alimentación, un semicírculo que representa la carga de bolas al 30%.
6. Con rol `minera`, las piezas no responden al clic y se ve el aviso "Vista de solo lectura".

**Aceptación:** los KPIs cambian al hacer clic en una pieza; los filtros funcionan; la otra pestaña se actualiza.

## Tarea 3 — Vista 3D

**Archivos:** `src/pages/Mill3DPage.tsx`, `src/components/mill3d/`.

1. Escena con `@react-three/fiber`: cilindro horizontal formado por 196 placas (7 anillos × 28 por anillo) y dos tapas cónicas con sus placas (48 y 36), cada placa con el color de su estado en vivo.
2. Vistas de cámara: Isométrica, Lateral, Tapa alim., Tapa desc., Superior, Interior.
3. Controles: Vista realista (sombreado y luces) o plana, Modo explotado (separa anillos y tapas), Transparencia del shell 0–100 %, Auto-rotar, Etiquetas de numeración (N° Shell, N° T.Alim, N° T.Desc), Bolas animadas ON/OFF dentro del molino, Wireframe, X-Ray.
4. Clic en una placa 3D hace lo mismo que en el 2D (respetando el rol).
5. Leyenda de colores P / R / RC y conteo por estado.

**Aceptación:** los colores coinciden con el 2D; los 6 botones de cámara mueven la vista; el modo explotado y la transparencia funcionan.

## Tarea 4 — Curvas S, Gantt, incidencias y bitácora

**Archivos:** `src/pages/PlanPage.tsx`, `src/pages/AuditPage.tsx`, `src/components/plan/`.

1. Curva S de piezas (ECharts): eje X por turnos (Inicio, Día 1, Noche 1, Día 2, …, Actual), eje Y 0–280; series Cambiado (verde), Retirado (naranja), Plan (línea punteada gris).
2. Curva S del shutdown: % avance real vs planeado acumulado, con cabecera de Desviación (%), Real acum., Planeado acum., SPI (real / planeado, con texto "Atrasado" si < 1) y Turnos reportados.
3. Gestor de hitos: tabla agrupada por hito resumen con sus actividades (nombre, inicio, fin, duración calculada, % avance) y acciones agregar, editar y eliminar. Botones Descargar plantilla Excel e Importar Excel muestran el aviso de versión final; Backup hitos descarga JSON.
4. Gantt por horas (ECharts, barras horizontales personalizadas): una barra por actividad con su % de avance relleno y una línea vertical roja en la hora actual.
5. Incidencias del turno: lista y formulario simple (turno, hora, descripción, minutos de demora).
6. `AuditPage`: bitácora con fecha, usuario y acción, la más reciente arriba.

**Aceptación:** el SPI se calcula de los datos; editar el % de una actividad cambia la Curva S del shutdown y el Gantt.

## Fuera del alcance del mockup

Backend, base de datos, login real, subida real de fotos, exportes reales a Excel o PDF, LMS y SafeTrack.
