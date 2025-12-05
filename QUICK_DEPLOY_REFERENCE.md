
# 🚀 Referencia Rápida de Despliegue

## ⚡ Despliegue Rápido (3 Pasos)

```bash
# 1. Build con timestamp único
npm run build:web

# 2. Commit y push
git add .
git commit -m "Deploy: [descripción]"
git push origin main

# 3. Verificar en consola del navegador
# Buscar: "🚀 MXI LIQUIDITY POOL APP - INFORMACIÓN DE VERSIÓN"
```

## 🔍 Verificación Rápida

### En Consola del Navegador
```
═══════════════════════════════════════════════════════════════════
🚀 MXI LIQUIDITY POOL APP - INFORMACIÓN DE VERSIÓN
═══════════════════════════════════════════════════════════════════
📦 Versión: 1.0.3
🆔 Build ID: v1.0.3-[TIMESTAMP]
⏰ Timestamp: [NÚMERO ÚNICO]
═══════════════════════════════════════════════════════════════════
```

### Indicador Visual
- **Ubicación**: Esquina inferior derecha
- **Formato**: `v1.0.3`
- **Con actualización**: Badge rojo con "!"

## 🎯 Comandos Útiles

```bash
# Solo actualizar timestamp (sin build completo)
npm run prebuild

# Build completo para web
npm run build:web

# Build para Android
npm run build:android

# Desarrollo local
npm run web
```

## 🐛 Solución Rápida de Problemas

### App no actualiza
```bash
# 1. Forzar recarga desde indicador de versión
# 2. O limpiar caché manualmente:
Ctrl + Shift + Delete (Chrome)
Cmd + Shift + Delete (Mac)
```

### Verificar timestamp actual
```javascript
// En consola del navegador
localStorage.getItem('app_build_timestamp')
```

### Limpiar todo y empezar de nuevo
```javascript
// En consola del navegador
localStorage.clear();
sessionStorage.clear();
location.reload(true);
```

## 📊 Checklist de Despliegue

- [ ] Código probado localmente
- [ ] `npm run build:web` ejecutado
- [ ] Timestamp actualizado en `AppVersion.ts`
- [ ] Commit con mensaje descriptivo
- [ ] Push a GitHub completado
- [ ] Deploy ejecutado
- [ ] Verificado en consola del navegador
- [ ] Indicador de versión muestra nueva versión
- [ ] Usuarios notificados (si es necesario)

## 🔄 Flujo de Actualización para Usuarios

1. Usuario abre la app
2. Sistema detecta nueva versión (automático)
3. Aparece alerta: "🔄 Nueva Versión Disponible"
4. Usuario click en "Actualizar Ahora"
5. App se recarga con nueva versión
6. ✅ Listo!

## 📝 Notas Importantes

- ✅ El timestamp se genera automáticamente en cada build
- ✅ La sesión de usuario se mantiene durante actualización
- ✅ El sistema verifica actualizaciones cada 5 minutos
- ✅ Los usuarios pueden posponer la actualización
- ✅ Forzar recarga limpia todo el caché

## 🎨 Personalización

### Cambiar intervalo de verificación
```typescript
// En constants/AppVersion.ts
const CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutos
// Cambiar a: 10 * 60 * 1000 para 10 minutos
```

### Cambiar posición del indicador
```typescript
// En app/_layout.tsx
<VersionDisplay position="bottom" /> // o "top"
```

### Mostrar detalles por defecto
```typescript
// En app/_layout.tsx
<VersionDisplay position="bottom" showDetails={true} />
```

## 🚨 Emergencia: Rollback

Si necesitas volver a una versión anterior:

```bash
# 1. Revertir commit
git revert HEAD

# 2. Push
git push origin main

# 3. Redeploy
# El sistema detectará el cambio automáticamente
```

## 📞 Soporte

Si tienes problemas:

1. Revisar logs en consola del navegador
2. Verificar que GitHub tiene el código actualizado
3. Verificar que el deploy se completó
4. Limpiar caché del navegador
5. Probar en ventana de incógnito

---

**Versión**: 1.0.3  
**Última Actualización**: Enero 2025
