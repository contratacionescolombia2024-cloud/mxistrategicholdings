
# ⚡ CHECKLIST RÁPIDO DE SINCRONIZACIÓN

## 🎯 Usa esto CADA VEZ que hagas cambios en Natively

### ✅ ANTES de hacer cambios

- [ ] Anota la hora de inicio
- [ ] Anota qué archivos vas a modificar
- [ ] Verifica última sincronización en GitHub

### ✅ DURANTE el desarrollo

- [ ] Prueba cada cambio en Natively
- [ ] Documenta cambios importantes
- [ ] Toma screenshots si es necesario

### ✅ DESPUÉS de hacer cambios

- [ ] Prueba que todo funciona
- [ ] Anota todos los archivos modificados
- [ ] Contacta soporte de Natively para exportar
- [ ] Descarga el proyecto completo

### ✅ SINCRONIZACIÓN con GitHub

```bash
# 1. Navega al proyecto
cd /ruta/a/tu/proyecto

# 2. Pull últimos cambios
git pull origin main

# 3. Copia archivos de Natively
# (Reemplaza con los archivos exportados)

# 4. Verifica cambios
git status
git diff

# 5. Commit
git add .
git commit -m "Sync Natively: [DESCRIPCIÓN] - $(date +%Y-%m-%d)"

# 6. Push
git push origin main

# 7. Verifica en GitHub
# Abre GitHub y confirma que el commit aparece
```

### ✅ VERIFICACIÓN final

- [ ] Commit aparece en GitHub
- [ ] Fecha del commit es correcta
- [ ] Archivos modificados son los correctos
- [ ] No hay archivos faltantes

## 🚨 SI ALGO SALE MAL

### No puedo hacer push

```bash
# Verifica credenciales
git config user.name
git config user.email

# Intenta de nuevo
git push origin main
```

### Hay conflictos

```bash
# Pull primero
git pull origin main

# Resuelve conflictos manualmente
# Busca: <<<<<<<, =======, >>>>>>>

# Marca como resuelto
git add .
git commit -m "Resolve conflicts"
git push origin main
```

### Olvidé qué cambié

```bash
# Ver todos los cambios
git diff

# Ver archivos modificados
git status

# Ver cambios por archivo
git diff [nombre-archivo]
```

## 📊 FRECUENCIA RECOMENDADA

- 🔴 **CRÍTICO**: Después de cada cambio importante
- 🟡 **IMPORTANTE**: Al final de cada sesión de trabajo
- 🟢 **MÍNIMO**: Una vez al día

## 💾 BACKUP RÁPIDO

Antes de sincronizar:

```bash
# Crea branch de backup
git branch backup-$(date +%Y%m%d-%H%M)
git push origin backup-$(date +%Y%m%d-%H%M)
```

## 📝 TEMPLATE DE COMMIT

```bash
git commit -m "Sync Natively: [TÍTULO]

Cambios:
- [Cambio 1]
- [Cambio 2]
- [Cambio 3]

Archivos modificados:
- [archivo1.tsx]
- [archivo2.tsx]

Fecha: $(date +%Y-%m-%d\ %H:%M:%S)
Sincronizado desde: Natively"
```

## 🎯 OBJETIVO

**Mantener GitHub actualizado SIEMPRE**

GitHub = Fuente de verdad ✅  
Natively = Herramienta de desarrollo ⚙️

---

**Imprime esto y tenlo a mano** 📄  
**Úsalo CADA VEZ** 🔄  
**No esperes días sin sincronizar** ⏰
