
# 🔗 Integración Natively ↔️ GitHub

## 🎯 Objetivo

Establecer un flujo de trabajo para mantener sincronizado el código entre Natively y GitHub.

## 🚨 LIMITACIÓN ACTUAL

**Natively NO sincroniza automáticamente con GitHub**

Esto significa:
- ❌ Los cambios en Natively NO se pushean automáticamente
- ❌ No hay integración nativa Git
- ❌ Debes sincronizar manualmente

## 💡 SOLUCIONES DISPONIBLES

### Solución A: Sincronización Manual Periódica

**Frecuencia recomendada**: Cada 24 horas o después de cambios importantes

**Proceso**:

1. **En Natively**:
   - Realiza tus cambios
   - Prueba que todo funciona
   - Anota qué archivos modificaste

2. **Exportar de Natively**:
   - Contacta soporte de Natively
   - Solicita exportación del proyecto
   - Descarga el ZIP/archivo del proyecto

3. **En tu computadora**:
   ```bash
   # Clona el repo si no lo tienes
   git clone https://github.com/TU_USUARIO/TU_REPO.git
   cd TU_REPO
   
   # Copia los archivos exportados de Natively
   # (Reemplaza los archivos existentes)
   
   # Verifica cambios
   git status
   git diff
   
   # Commit
   git add .
   git commit -m "Sync desde Natively - $(date +%Y-%m-%d)"
   
   # Push
   git push origin main
   ```

### Solución B: Desarrollo Híbrido

**Usa Natively para**: Prototipado rápido, pruebas visuales
**Usa Git local para**: Cambios finales, sincronización

**Workflow**:

1. **Prototipo en Natively** → Prueba visual rápida
2. **Exporta código** → Descarga de Natively
3. **Replica en local** → Copia cambios a tu repo local
4. **Commit y push** → Sincroniza con GitHub
5. **Deploy desde GitHub** → Usa GitHub como fuente de verdad

### Solución C: GitHub como Fuente de Verdad

**Principio**: GitHub siempre tiene la versión correcta

**Setup**:

1. **Desarrolla localmente**:
   ```bash
   # Clona el repo
   git clone https://github.com/TU_USUARIO/TU_REPO.git
   cd TU_REPO
   
   # Instala dependencias
   npm install
   
   # Desarrolla
   npm run dev
   ```

2. **Usa Natively solo para preview**:
   - Importa el proyecto desde GitHub
   - Usa para ver cómo se ve en dispositivos
   - NO hagas cambios permanentes en Natively

3. **Todos los cambios en local**:
   ```bash
   # Haz cambios
   # ...
   
   # Commit
   git add .
   git commit -m "Descripción del cambio"
   
   # Push
   git push origin main
   ```

4. **Actualiza Natively desde GitHub**:
   - Re-importa el proyecto en Natively
   - O usa el botón de "Sync with GitHub" si existe

## 🛠️ HERRAMIENTAS ÚTILES

### Script de Sincronización

Crea este archivo en tu computadora:

```bash
#!/bin/bash
# sync-natively.sh

echo "🔄 Sincronizando con GitHub..."

# Navega al directorio del proyecto
cd /ruta/a/tu/proyecto

# Pull últimos cambios
git pull origin main

# Copia archivos de Natively (ajusta la ruta)
cp -r /ruta/a/exportacion/natively/* .

# Verifica cambios
echo "📊 Cambios detectados:"
git status

# Pregunta si continuar
read -p "¿Continuar con commit? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
    # Commit
    git add .
    git commit -m "Sync desde Natively - $(date +%Y-%m-%d\ %H:%M:%S)"
    
    # Push
    git push origin main
    
    echo "✅ Sincronización completada"
else
    echo "❌ Sincronización cancelada"
fi
```

Uso:
```bash
chmod +x sync-natively.sh
./sync-natively.sh
```

### GitHub Actions para Deploy

Crea `.github/workflows/deploy.yml`:

```yaml
name: Deploy desde GitHub

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    
    - name: Install dependencies
      run: npm install
    
    - name: Build
      run: npm run build:web
    
    - name: Deploy
      run: |
        echo "Desplegando a producción..."
        # Agrega aquí tu comando de deploy
```

## 📋 WORKFLOW RECOMENDADO

### Para Cambios Pequeños (< 1 hora)

```
Natively → Prueba → Exporta → Git Local → Push → Deploy
```

### Para Cambios Grandes (> 1 hora)

```
Git Local → Desarrolla → Commit frecuente → Push → Importa a Natively para preview
```

### Para Emergencias

```
Natively → Fix rápido → Exporta INMEDIATAMENTE → Push → Documenta
```

## 🔍 VERIFICACIÓN DE SINCRONIZACIÓN

### Checklist Diario

- [ ] ¿Hice cambios en Natively hoy?
- [ ] ¿Exporté el código?
- [ ] ¿Hice commit a GitHub?
- [ ] ¿Verifiqué que el commit aparece en GitHub?
- [ ] ¿El timestamp en GitHub es correcto?

### Comando de Verificación

```bash
# Ver último commit en GitHub
git fetch origin
git log origin/main -1 --format="%H %s %cr"

# Comparar con local
git log -1 --format="%H %s %cr"

# Ver diferencias
git diff origin/main
```

## 🚀 MEJORES PRÁCTICAS

### 1. Sincroniza Frecuentemente

- ✅ Después de cada sesión de trabajo
- ✅ Antes de terminar el día
- ✅ Después de cambios importantes
- ❌ NO esperes días sin sincronizar

### 2. Usa Mensajes de Commit Claros

```bash
# ✅ BUENO
git commit -m "Sync Natively: Agregar sistema de pagos NOWPayments"

# ❌ MALO
git commit -m "cambios"
```

### 3. Documenta Cambios No Sincronizados

Si no puedes sincronizar inmediatamente, documenta:

```markdown
## Cambios Pendientes de Sincronización

**Fecha**: 2025-01-23
**Archivos modificados**:
- app/(tabs)/(home)/pagar-usdt.tsx
- components/NowPaymentsModal.tsx

**Descripción**:
- Agregado soporte para múltiples criptomonedas
- Corregido bug de verificación de pagos
```

### 4. Mantén Backup

```bash
# Antes de sincronizar, crea backup
git branch backup-$(date +%Y%m%d)
git push origin backup-$(date +%Y%m%d)
```

## 🆘 SOLUCIÓN DE PROBLEMAS

### "No puedo exportar de Natively"

**Solución**: Contacta soporte de Natively y solicita:
1. Exportación manual del proyecto
2. Acceso a API de exportación (si existe)
3. Integración directa con GitHub (si existe)

### "Los archivos exportados están incompletos"

**Solución**:
1. Verifica que la exportación incluya:
   - Todos los archivos .tsx/.ts
   - package.json
   - Configuraciones (babel, metro, etc.)
2. Compara con el último commit en GitHub
3. Identifica archivos faltantes
4. Solicita exportación completa

### "Conflictos al hacer merge"

**Solución**:
```bash
# Ver archivos en conflicto
git status

# Para cada archivo en conflicto:
# 1. Abre el archivo
# 2. Busca marcadores: <<<<<<<, =======, >>>>>>>
# 3. Decide qué versión mantener
# 4. Elimina los marcadores

# Marca como resuelto
git add [archivo]

# Completa el merge
git commit -m "Resolve merge conflicts"
```

## 📞 CONTACTOS ÚTILES

### Soporte Natively
- **Email**: [email de soporte]
- **Preguntar sobre**:
  - Exportación de proyectos
  - Integración con GitHub
  - API de sincronización
  - Webhooks disponibles

### Recursos
- [Documentación de Natively]
- [GitHub Docs](https://docs.github.com)
- [Git Cheat Sheet](https://education.github.com/git-cheat-sheet-education.pdf)

---

**Versión**: 1.0  
**Última actualización**: Enero 2025  
**Estado**: 📝 Guía Activa
