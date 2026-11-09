# AGENTS.md — DIMARZA

Reglas para cualquier agente que escriba código en este repositorio.

## Qué es

Mockup navegable de la **Etapa 1** de la plataforma DIMARZA: reportabilidad del cambio de liners de un molino durante un shutdown, con visor 3D, Curva S y Gantt. Sirve para presentar al cliente. **No hay backend**: todo funciona con datos simulados en el navegador.

El plan completo está en `PLAN-mockup-etapa1.md`. Cada tarea indica qué archivos toca.

## Stack (ya instalado, no agregues dependencias)

- `mockup/`: Vite 6 + React 19 + TypeScript estricto.
- Tailwind CSS 4 (`@import "tailwindcss"` en `src/index.css`; sin `tailwind.config`).
- Three.js con `@react-three/fiber` y `@react-three/drei` para el 3D.
- ECharts con `echarts-for-react` para Curvas S y Gantt.
- `zustand` para el estado, `react-router-dom` para rutas, `lucide-react` para íconos.

## Reglas de código

1. Todo el código va dentro de `mockup/src/`. No toques `package.json`, `package-lock.json`, `vite.config.ts` ni los `tsconfig`.
2. TypeScript sin `any`. Tipos del dominio en `src/domain/types.ts`.
3. Componentes de función, un componente por archivo, nombre del archivo = nombre del componente (`PascalCase.tsx`).
4. Textos visibles en español. Identificadores de código en inglés.
5. Estilos solo con clases de Tailwind. Sin CSS adicional salvo `src/index.css`.
6. Colores de estado de pieza, siempre los mismos en 2D y 3D:
   - `P` Pendiente: gris `#9ca3af`
   - `R` Retirado: amarillo `#facc15`
   - `RC` Retirado y cambiado: verde `#22c55e`
7. Toda lectura y escritura de datos pasa por el store (`src/store/`). Los componentes no guardan datos del dominio en estado local.
8. Sin comentarios obvios, sin código muerto, sin `console.log`.
9. El proyecto debe compilar con `npm run build` dentro de `mockup/` sin errores ni advertencias de TypeScript.
