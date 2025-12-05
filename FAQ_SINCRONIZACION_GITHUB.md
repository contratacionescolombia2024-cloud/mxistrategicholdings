
# ❓ FAQ - Sincronización Natively ↔️ GitHub

## Preguntas Frecuentes

### 1. ¿Natively sincroniza automáticamente con GitHub?

**❌ NO**

Natively NO tiene sincronización automática con GitHub. Debes sincronizar manualmente.

### 2. ¿Cómo sé si mi código está desactualizado en GitHub?

**Verifica**:
1. Ve a tu repositorio en GitHub
2. Mira la fecha del último commit
3. Si es de hace más de 1 día y has trabajado en Natively → Está desactualizado

### 3. ¿Con qué frecuencia debo sincronizar?

**Recomendado**:
- 🔴 **Crítico**: Después de cada cambio importante
- 🟡 **Importante**: Al final de cada día de trabajo
- 🟢 **Mínimo**: Una vez cada 24 horas

### 4. ¿Puedo perder mi código si no sincronizo?

**⚠️ SÍ**

Si Natively tiene problemas o pierdes acceso:
- ❌ Sin sincronización → Pierdes cambios recientes
- ✅ Con sincronización → GitHub tiene backup

### 5. ¿Cómo exporto mi proyecto de Natively?

**Opciones**:
1. Contacta al soporte de Natively
2. Busca botón "Export" o "Download" en Natively
3. Copia archivos manualmente (última opción)

### 6. ¿Necesito saber Git para sincronizar?

**Comandos básicos suficientes**:
```bash
git clone URL        # Clonar repositorio
git status          # Ver cambios
git add .           # Agregar cambios
git commit -m "..."  # Guardar cambios
git push            # Subir a GitHub
```

**Recursos**:
- Tutorial: https://git-scm.com/book/es/v2
- Cheat sheet: https://education.github.com/git-cheat-sheet-education.pdf

### 7. ¿Qué hago si no tengo computadora?

**Alternativas**:
1. **GitHub Codespaces** (gratis, en navegador)
2. **Replit** (gratis, en navegador)
3. **Termux** (Android, app de terminal)
4. **iSH** (iOS, app de terminal)
5. Pide ayuda a alguien con computadora

### 8. ¿Puedo automatizar la sincronización?

**Opciones**:

**Opción A**: Script de sincronización
```bash
#!/bin/bash
# sync.sh
cd /ruta/proyecto
git add .
git commit -m "Auto-sync $(date)"
git push origin main
```

**Opción B**: GitHub Actions (si Natively tiene API)
```yaml
# .github/workflows/sync.yml
name: Sync desde Natively
on:
  schedule:
    - cron: '0 0 * * *'  # Diario a medianoche
```

**Opción C**: Webhook (si Natively lo soporta)

### 9. ¿Qué pasa si hay conflictos al sincronizar?

**Solución**:
```bash
# 1. Pull primero
git pull origin main

# 2. Git te mostrará archivos en conflicto
# Busca en esos archivos:
# <<<<<<< HEAD
# tu código local
# =======
# código de GitHub
# >>>>>>> origin/main

# 3. Edita manualmente y decide qué mantener

# 4. Marca como resuelto
git add archivo-resuelto.tsx
git commit -m "Resolve conflict"
git push origin main
```

### 10. ¿Debo hacer backup antes de sincronizar?

**✅ SÍ, SIEMPRE**

```bash
# Crear branch de backup
git branch backup-$(date +%Y%m%d)
git push origin backup-$(date +%Y%m%d)

# Ahora puedes sincronizar tranquilo
```

### 11. ¿Cómo verifico que la sincronización funcionó?

**Checklist**:
- [ ] Commit aparece en GitHub
- [ ] Fecha del commit es correcta
- [ ] Archivos modificados son los correctos
- [ ] Puedes ver el contenido actualizado en GitHub
- [ ] No hay errores en el push

### 12. ¿Qué archivos debo sincronizar?

**Incluir**:
- ✅ Todos los archivos `.tsx`, `.ts`, `.js`
- ✅ `package.json`
- ✅ Archivos de configuración (`babel.config.js`, `metro.config.js`, etc.)
- ✅ Archivos `.md` de documentación
- ✅ Assets (imágenes, fuentes, etc.)

**Excluir** (ya están en `.gitignore`):
- ❌ `node_modules/`
- ❌ `.expo/`
- ❌ `dist/`
- ❌ Archivos temporales

### 13. ¿Puedo sincronizar solo algunos archivos?

**Sí**:
```bash
# Agregar archivos específicos
git add archivo1.tsx archivo2.tsx
git commit -m "Update specific files"
git push origin main
```

**Pero recomendado**: Sincroniza todo para evitar inconsistencias

### 14. ¿Qué hago si olvidé qué cambié?

**Soluciones**:

1. **Compara con GitHub**:
   ```bash
   git diff origin/main
   ```

2. **Revisa historial de chat**: Busca en conversaciones con el asistente

3. **Revisa documentación**: Archivos `.md` tienen historial de cambios

4. **Exporta todo**: Deja que Git identifique los cambios

### 15. ¿Cómo evito este problema en el futuro?

**Sistema de prevención**:

1. **Recordatorio diario**: Alarma para sincronizar
2. **Checklist**: Usa `QUICK_SYNC_CHECKLIST.md`
3. **Documentación**: Anota cambios en `CAMBIOS_PENDIENTES.md`
4. **Desarrollo local**: Considera trabajar localmente y usar Natively solo para preview

### 16. ¿Puedo duplicar el proyecto en Natively?

**Depende de Natively**:
- Busca opción "Duplicate" o "Clone" en Natively
- Contacta soporte para confirmar
- Si es posible, duplica ANTES de hacer cambios grandes

### 17. ¿Debo eliminar el repositorio y crear uno nuevo?

**❌ NO recomendado**

Solo como última opción si:
- No puedes exportar de Natively
- El repositorio está muy desactualizado
- Hay problemas irresolubles

**Mejor**: Sincroniza el repositorio existente

### 18. ¿Qué hago si el soporte de Natively no responde?

**Alternativas**:

1. **Busca en documentación**: Puede haber opción de exportación
2. **Foros de Natively**: Pregunta a la comunidad
3. **Copia manual**: Copia archivos uno por uno (tedioso pero funciona)
4. **Espera y reintenta**: A veces el soporte tarda

### 19. ¿Puedo usar GitHub Desktop en lugar de comandos?

**✅ SÍ**

GitHub Desktop es más fácil para principiantes:
1. Descarga: https://desktop.github.com/
2. Clona tu repositorio
3. Copia archivos de Natively
4. GitHub Desktop detecta cambios automáticamente
5. Escribe mensaje de commit
6. Click en "Commit" y luego "Push"

### 20. ¿Dónde puedo obtener más ayuda?

**Recursos**:
- 📚 Documentación Git: https://git-scm.com/doc
- 🎥 YouTube: "Git tutorial español"
- 💬 Stack Overflow: https://stackoverflow.com/questions/tagged/git
- 📧 Soporte de Natively: [busca en su sitio web]
- 👥 Comunidad de desarrolladores: Reddit r/reactnative

---

## 🆘 AYUDA RÁPIDA

**Si estás perdido**:

1. Lee `SOLUCION_RAPIDA_SYNC.md` para pasos simples
2. Sigue `VERIFICACION_GITHUB_SYNC.md` para diagnóstico completo
3. Usa `QUICK_SYNC_CHECKLIST.md` como guía paso a paso

**Si tienes prisa**:

```bash
# Comandos mínimos necesarios
git clone URL_REPO
cd REPO
# (copia archivos de Natively)
git add .
git commit -m "Sync desde Natively"
git push origin main
```

---

**¿Más preguntas?** Agrega tus preguntas a este documento para futuras referencias.
