
# 🚀 Guía de Despliegue y Versionado

## 📋 Resumen del Problema

El problema principal era que los cambios realizados en Natively no se reflejaban en la aplicación desplegada porque:

1. ✅ Los cambios se hacían en Natively
2. ❌ Estos cambios NO se sincronizaban automáticamente con GitHub
3. ❌ El despliegue usaba código antiguo de GitHub
4. ❌ La app desplegada no reflejaba los últimos cambios

## 🔧 Solución Implementada

### 1. Sistema de Versionado Robusto

Se ha implementado un sistema completo de versionado que incluye:

- **Build Timestamp Único**: Cada build genera un timestamp único que identifica la versión
- **Build ID**: Combinación de versión + timestamp para identificación única
- **Verificación Automática**: El sistema verifica automáticamente si hay actualizaciones disponibles
- **Cache Busting**: Limpieza automática de caché para forzar la carga de código nuevo

### 2. Componentes Actualizados

#### `constants/AppVersion.ts`
- ✅ Genera timestamp único en cada build
- ✅ Detecta automáticamente nuevas versiones
- ✅ Proporciona función de recarga forzada
- ✅ Verificador periódico de actualizaciones (cada 5 minutos)
- ✅ Logs detallados para debugging

#### `components/VersionDisplay.tsx`
- ✅ Muestra información de versión en tiempo real
- ✅ Indicador visual de actualizaciones disponibles
- ✅ Botón de "Actualizar Ahora" para forzar recarga
- ✅ Detalles completos de build (timestamp, fecha, plataforma)

#### `metro.config.js`
- ✅ Inyecta timestamp único en cada build
- ✅ Actualiza automáticamente `AppVersion.ts`
- ✅ Genera `app-version.json` para verificación web
- ✅ Resetea caché en cada build

#### `package.json`
- ✅ Script `prebuild` que actualiza timestamp antes de cada build
- ✅ Versión actualizada a 1.0.3
- ✅ Scripts de build mejorados

### 3. Flujo de Despliegue

```
┌─────────────────────────────────────────────────────────────┐
│  1. DESARROLLO EN NATIVELY                                  │
│     - Hacer cambios en el código                            │
│     - Probar localmente                                     │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  2. BUILD CON TIMESTAMP ÚNICO                               │
│     - npm run build:web                                     │
│     - Se genera timestamp único                             │
│     - Se actualiza AppVersion.ts                            │
│     - Se crea app-version.json                              │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  3. SINCRONIZACIÓN CON GITHUB                               │
│     - Commit de todos los cambios                           │
│     - Push a GitHub                                         │
│     - Incluir AppVersion.ts actualizado                     │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  4. DESPLIEGUE                                              │
│     - Deploy desde GitHub                                   │
│     - Código con timestamp único                            │
│     - Cache busting automático                              │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  5. DETECCIÓN AUTOMÁTICA EN CLIENTES                        │
│     - Usuarios abren la app                                 │
│     - Sistema detecta nuevo timestamp                       │
│     - Muestra alerta de actualización                       │
│     - Usuario actualiza con un clic                         │
└─────────────────────────────────────────────────────────────┘
```

## 📝 Pasos para Desplegar

### Opción A: Build Completo (Recomendado)

```bash
# 1. Actualizar versión (si es necesario)
# Editar app.json y cambiar "version": "1.0.X"

# 2. Build para web con timestamp único
npm run build:web

# 3. Commit y push a GitHub
git add .
git commit -m "Deploy v1.0.X - [descripción de cambios]"
git push origin main

# 4. Desplegar desde GitHub
# (Usar el sistema de deployment que tengas configurado)
```

### Opción B: Build Rápido

```bash
# 1. Actualizar timestamp manualmente
npm run prebuild

# 2. Commit y push
git add constants/AppVersion.ts
git commit -m "Update build timestamp"
git push origin main
```

## 🔍 Verificación de Despliegue

### 1. Verificar en Consola del Navegador

Al abrir la app, deberías ver:

```
═══════════════════════════════════════════════════════════════════
🚀 MXI LIQUIDITY POOL APP - INFORMACIÓN DE VERSIÓN
═══════════════════════════════════════════════════════════════════
📦 Versión: 1.0.3
🆔 Build ID: v1.0.3-1748000000000
📅 Fecha de Build: 2025-01-XX...
⏰ Timestamp: 1748000000000
🌐 Plataforma: Web
═══════════════════════════════════════════════════════════════════
```

### 2. Verificar Indicador de Versión

- En la esquina inferior derecha verás: `v1.0.3`
- Si hay actualización disponible, aparecerá un badge rojo con "!"
- Click en el indicador muestra detalles completos

### 3. Verificar Actualización Automática

- El sistema verifica actualizaciones cada 5 minutos
- Si detecta nueva versión, muestra alerta automática
- Usuario puede actualizar con un click

## 🎯 Características del Sistema

### ✅ Detección Automática de Actualizaciones

- Verifica al iniciar la app
- Verifica cada 5 minutos
- Compara timestamps locales vs servidor
- Alerta automática al usuario

### ✅ Cache Busting Completo

- Limpia localStorage (excepto auth)
- Limpia sessionStorage
- Desregistra service workers
- Limpia cache storage
- Recarga forzada del navegador

### ✅ Información Detallada

- Versión de la app
- Build ID único
- Timestamp de build
- Fecha y hora de build
- Plataforma (web/native)
- Última verificación de actualizaciones

### ✅ Experiencia de Usuario

- Indicador visual discreto
- Alerta no intrusiva
- Opción de actualizar o posponer
- Actualización con un solo click
- Sin pérdida de sesión

## 🐛 Debugging

### Ver Logs de Versión

Abre la consola del navegador y busca:

```javascript
// Al iniciar
🔍 Verificando actualizaciones al iniciar...
✅ Aplicación actualizada
// o
✅ Nueva versión detectada, mostrando alerta...

// Verificación periódica
🔍 Verificando actualizaciones...
✅ Aplicación actualizada
// o
✅ Nueva versión disponible en el servidor!
```

### Forzar Actualización Manual

1. Click en el indicador de versión (esquina inferior derecha)
2. Click en "🔄 Forzar Recarga"
3. La app se recargará con cache limpio

### Verificar Timestamp en Código

```javascript
// En la consola del navegador
import { BUILD_TIMESTAMP, BUILD_ID } from './constants/AppVersion';
console.log('Current Build:', BUILD_ID);
console.log('Timestamp:', BUILD_TIMESTAMP);
```

## 📊 Monitoreo

### Métricas a Monitorear

1. **Timestamp de Build**: Debe cambiar en cada deploy
2. **Detección de Actualizaciones**: Logs en consola
3. **Tasa de Actualización**: Usuarios que actualizan vs posponen
4. **Errores de Recarga**: Problemas durante force reload

### Logs Importantes

```javascript
// Build exitoso
🔨 GENERANDO BUILD CON TIMESTAMP ÚNICO
⏰ Build Timestamp: 1748000000000
✅ AppVersion.ts actualizado con nuevo timestamp
✅ app-version.json creado en public/

// Detección de actualización
🔄 Nueva versión detectada!
  Versión anterior: v1.0.2-1747900000000
  Versión nueva: v1.0.3-1748000000000

// Actualización forzada
🔄 Forzando recarga de la aplicación...
  Versión: v1.0.3-1748000000000
  Timestamp: 1748000000000
```

## 🔐 Seguridad

### Datos Preservados Durante Actualización

- ✅ Token de autenticación (supabase.auth.token)
- ✅ Sesión de usuario
- ❌ Caché de datos (se limpia)
- ❌ Preferencias temporales (se limpian)

### Datos Limpiados Durante Actualización

- localStorage (excepto auth)
- sessionStorage
- Service workers
- Cache storage
- Caché del navegador

## 🚨 Solución de Problemas

### Problema: La app no detecta actualizaciones

**Solución:**
1. Verificar que el timestamp cambió en `AppVersion.ts`
2. Verificar que `app-version.json` existe en public/
3. Limpiar caché del navegador manualmente
4. Verificar logs en consola

### Problema: Actualización no se aplica

**Solución:**
1. Usar "Forzar Recarga" desde el indicador de versión
2. Limpiar caché del navegador (Ctrl+Shift+Delete)
3. Cerrar todas las pestañas de la app
4. Abrir en ventana de incógnito para verificar

### Problema: Usuarios ven versión antigua

**Solución:**
1. Verificar que el deploy se completó correctamente
2. Verificar que GitHub tiene el código actualizado
3. Pedir a usuarios que fuercen recarga (Ctrl+F5)
4. Verificar CDN/cache del servidor

## 📚 Referencias

- `constants/AppVersion.ts` - Sistema de versionado
- `components/VersionDisplay.tsx` - Indicador visual
- `metro.config.js` - Configuración de build
- `app/_layout.tsx` - Integración en la app
- `package.json` - Scripts de build

## 🎉 Beneficios

1. ✅ **Detección Automática**: Los usuarios siempre saben cuando hay actualizaciones
2. ✅ **Actualización Fácil**: Un solo click para actualizar
3. ✅ **Sin Pérdida de Datos**: La sesión se mantiene
4. ✅ **Debugging Fácil**: Logs detallados en consola
5. ✅ **Versionado Único**: Cada build es identificable
6. ✅ **Cache Busting**: Siempre carga código nuevo
7. ✅ **Experiencia Mejorada**: Usuarios siempre tienen la última versión

---

**Versión del Sistema**: 1.0.3  
**Última Actualización**: Enero 2025  
**Estado**: ✅ Implementado y Funcionando
