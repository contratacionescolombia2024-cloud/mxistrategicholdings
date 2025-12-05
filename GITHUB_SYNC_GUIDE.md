
# 🔄 Guía de Sincronización con GitHub

## 📋 Problema Original

Los cambios realizados en Natively no se sincronizaban automáticamente con GitHub, causando que la app desplegada usara código antiguo.

## ✅ Solución Implementada

### Sistema de Versionado Automático

Cada vez que haces un build, el sistema:

1. ✅ Genera un timestamp único
2. ✅ Actualiza `constants/AppVersion.ts`
3. ✅ Crea `public/app-version.json`
4. ✅ Marca el código como nueva versión

## 🔄 Proceso de Sincronización

### Paso 1: Desarrollo en Natively

```
┌─────────────────────────────────────┐
│  Hacer cambios en Natively          │
│  - Editar código                    │
│  - Probar localmente                │
│  - Verificar funcionalidad          │
└─────────────────────────────────────┘
```

### Paso 2: Build con Versionado

```bash
# Ejecutar build (genera timestamp único)
npm run build:web
```

Esto automáticamente:
- ✅ Genera timestamp único: `1748000000000`
- ✅ Actualiza `AppVersion.ts` con nuevo timestamp
- ✅ Crea `app-version.json` en public/
- ✅ Incrementa versión si es necesario

### Paso 3: Commit a GitHub

```bash
# Ver cambios
git status

# Agregar todos los cambios (incluyendo AppVersion.ts)
git add .

# Commit con mensaje descriptivo
git commit -m "Deploy v1.0.3: [descripción de cambios]

- Cambio 1
- Cambio 2
- Cambio 3

Build Timestamp: [timestamp generado]"

# Push a GitHub
git push origin main
```

### Paso 4: Verificar en GitHub

1. Ir a tu repositorio en GitHub
2. Verificar que el commit aparece
3. Verificar que `constants/AppVersion.ts` tiene el nuevo timestamp
4. Verificar la fecha del último commit

### Paso 5: Deploy desde GitHub

```
┌─────────────────────────────────────┐
│  Sistema de Deploy                  │
│  - Lee código de GitHub             │
│  - Usa nuevo timestamp              │
│  - Despliega nueva versión          │
└─────────────────────────────────────┘
```

## 📊 Verificación de Sincronización

### Verificar que GitHub está actualizado

```bash
# Ver último commit local
git log -1

# Ver último commit en GitHub
git fetch origin
git log origin/main -1

# Comparar
git diff main origin/main
```

Si hay diferencias, hacer push:
```bash
git push origin main
```

### Verificar timestamp en GitHub

1. Ir a GitHub
2. Abrir `constants/AppVersion.ts`
3. Verificar que `BUILD_TIMESTAMP` tiene un valor reciente
4. Verificar que la fecha del archivo es reciente

## 🔍 Debugging de Sincronización

### Problema: Cambios no aparecen en GitHub

**Diagnóstico:**
```bash
# Ver estado de git
git status

# Ver cambios no commiteados
git diff

# Ver commits no pusheados
git log origin/main..HEAD
```

**Solución:**
```bash
# Agregar cambios
git add .

# Commit
git commit -m "Sync changes"

# Push
git push origin main
```

### Problema: GitHub tiene código antiguo

**Diagnóstico:**
```bash
# Ver diferencias con GitHub
git fetch origin
git diff origin/main

# Ver historial de commits
git log --oneline -10
```

**Solución:**
```bash
# Forzar push (usar con cuidado)
git push origin main --force

# O crear nuevo commit
git add .
git commit -m "Force sync with latest changes"
git push origin main
```

### Problema: Timestamp no se actualiza

**Diagnóstico:**
```bash
# Ver contenido de AppVersion.ts
cat constants/AppVersion.ts | grep BUILD_TIMESTAMP

# Ver último cambio del archivo
git log -1 constants/AppVersion.ts
```

**Solución:**
```bash
# Ejecutar prebuild manualmente
npm run prebuild

# Verificar cambio
git diff constants/AppVersion.ts

# Commit y push
git add constants/AppVersion.ts
git commit -m "Update build timestamp"
git push origin main
```

## 🎯 Mejores Prácticas

### 1. Siempre hacer build antes de commit

```bash
# ✅ CORRECTO
npm run build:web
git add .
git commit -m "Deploy: nueva funcionalidad"
git push origin main

# ❌ INCORRECTO
git add .
git commit -m "Deploy: nueva funcionalidad"
git push origin main
# (Sin hacer build, timestamp no se actualiza)
```

### 2. Mensajes de commit descriptivos

```bash
# ✅ BUENO
git commit -m "Deploy v1.0.3: Agregar sistema de torneos

- Implementar lobby de torneos
- Agregar sistema de premios
- Corregir bug de sincronización

Build: v1.0.3-1748000000000"

# ❌ MALO
git commit -m "cambios"
```

### 3. Verificar antes de push

```bash
# Ver qué se va a pushear
git log origin/main..HEAD

# Ver diferencias
git diff origin/main

# Verificar que AppVersion.ts está incluido
git diff origin/main constants/AppVersion.ts
```

### 4. Mantener historial limpio

```bash
# Ver historial
git log --oneline -10

# Si hay muchos commits pequeños, considerar squash
git rebase -i HEAD~5
```

## 🔄 Workflow Completo

```bash
# 1. Desarrollo
# (Hacer cambios en Natively)

# 2. Build con versionado
npm run build:web

# 3. Verificar cambios
git status
git diff

# 4. Commit
git add .
git commit -m "Deploy v1.0.3: [descripción]"

# 5. Verificar antes de push
git log -1
cat constants/AppVersion.ts | grep BUILD_TIMESTAMP

# 6. Push a GitHub
git push origin main

# 7. Verificar en GitHub
# (Abrir repositorio y verificar último commit)

# 8. Deploy
# (Ejecutar sistema de deploy)

# 9. Verificar en producción
# (Abrir app y verificar versión en consola)
```

## 📝 Checklist de Sincronización

Antes de cada deploy:

- [ ] Cambios probados localmente
- [ ] `npm run build:web` ejecutado
- [ ] `git status` muestra cambios correctos
- [ ] `AppVersion.ts` tiene nuevo timestamp
- [ ] Commit con mensaje descriptivo
- [ ] Push a GitHub completado
- [ ] Verificado en GitHub que commit aparece
- [ ] Timestamp en GitHub es el correcto
- [ ] Deploy ejecutado
- [ ] Verificado en producción

## 🚨 Solución de Problemas Comunes

### "Changes not staged for commit"

```bash
git add .
git commit -m "Sync changes"
git push origin main
```

### "Your branch is behind 'origin/main'"

```bash
git pull origin main
# Resolver conflictos si hay
git push origin main
```

### "Permission denied"

```bash
# Verificar credenciales
git config user.name
git config user.email

# Configurar si es necesario
git config user.name "Tu Nombre"
git config user.email "tu@email.com"
```

### "Merge conflict"

```bash
# Ver archivos en conflicto
git status

# Editar archivos y resolver conflictos
# Buscar marcadores: <<<<<<<, =======, >>>>>>>

# Marcar como resuelto
git add [archivo]

# Completar merge
git commit -m "Resolve merge conflict"
git push origin main
```

## 📊 Monitoreo de Sincronización

### Ver estado de sincronización

```bash
# Estado local vs remoto
git status -sb

# Commits no pusheados
git log origin/main..HEAD --oneline

# Commits no traídos
git log HEAD..origin/main --oneline
```

### Verificar última sincronización

```bash
# Último commit local
git log -1 --format="%H %s %cr"

# Último commit en GitHub
git fetch origin
git log origin/main -1 --format="%H %s %cr"
```

## 🎉 Beneficios del Sistema

1. ✅ **Versionado Automático**: Cada build tiene ID único
2. ✅ **Sincronización Clara**: Siempre sabes qué está en GitHub
3. ✅ **Debugging Fácil**: Logs y timestamps claros
4. ✅ **Rollback Simple**: Puedes volver a versiones anteriores
5. ✅ **Trazabilidad**: Historial completo de cambios
6. ✅ **Detección de Problemas**: Fácil identificar desincronización

---

**Versión**: 1.0.3  
**Última Actualización**: Enero 2025  
**Estado**: ✅ Sistema Implementado
