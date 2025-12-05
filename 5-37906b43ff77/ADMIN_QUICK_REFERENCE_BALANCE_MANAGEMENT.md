
# 🚀 Guía Rápida - Gestión de Saldos Admin

## 📋 Acciones Disponibles

### 💰 Balance General

| Acción | Función | Cuándo Usar |
|--------|---------|-------------|
| **Sumar Sin Comisión** | Añade MXI sin generar comisiones | Correcciones, bonos especiales |
| **Aumentar Con Comisión** | Añade MXI y genera comisiones (5%, 2%, 1%) | Simular compra real |
| **Restar Balance** | Resta MXI del balance general | Correcciones, penalizaciones |

### 🔒 Vesting

| Acción | Función | Cuándo Usar |
|--------|---------|-------------|
| **Aumentar Vesting** | Añade MXI al balance bloqueado | Bonos de vesting adicionales |
| **Restar Vesting** | Resta MXI del balance bloqueado | Correcciones de rendimiento |

### 🏆 Torneos

| Acción | Función | Cuándo Usar |
|--------|---------|-------------|
| **Aumentar Torneo** | Añade MXI al balance de torneos | Premios especiales, bonos |
| **Restar Torneo** | Resta MXI del balance de torneos | Correcciones de premios |

### 🔗 Referidos

| Acción | Función | Cuándo Usar |
|--------|---------|-------------|
| **Vincular Correo** | Asigna referidor a usuario | Usuario sin código de referido |

---

## 🎯 Casos de Uso Rápidos

### ❓ Usuario no recibió MXI de compra
**Solución:** Sumar Sin Comisión
```
1. Buscar usuario
2. Click en "Sumar Sin Comisión"
3. Ingresar monto
4. Confirmar
```

### ❓ Dar bono que genere comisiones
**Solución:** Aumentar Con Comisión
```
1. Buscar usuario
2. Click en "Aumentar Con Comisión"
3. Ingresar monto
4. Confirmar
✅ Se generan comisiones automáticamente
```

### ❓ Usuario se registró sin código
**Solución:** Vincular Correo
```
1. Click en "Vincular Correo con Código"
2. Ingresar correo del usuario
3. Ingresar código del referidor
4. Confirmar
```

### ❓ Dar premio de torneo
**Solución:** Aumentar Torneo
```
1. Buscar usuario
2. Click en "Aumentar Torneo"
3. Ingresar monto del premio
4. Confirmar
```

### ❓ Corregir error de vesting
**Solución:** Restar + Aumentar Vesting
```
1. Buscar usuario
2. Click en "Restar Vesting"
3. Restar monto incorrecto
4. Click en "Aumentar Vesting"
5. Añadir monto correcto
```

---

## 🔐 Validaciones Automáticas

### ✅ Todas las Acciones
- Verifica permisos de admin
- Valida que el monto sea > 0
- Registra quién hizo la acción

### ✅ Acciones de Resta
- Verifica balance suficiente
- Requiere confirmación adicional
- Muestra balance actual

### ✅ Vincular Referido
- Usuario debe existir
- Código debe ser válido
- Usuario no debe tener referidor
- No permite auto-referidos

---

## 💡 Tips Importantes

### Balance General vs Otros
- **General:** Puede usarse para todo ✅
- **Vesting:** Bloqueado hasta lanzamiento 🔒
- **Torneos:** Requiere 5 referidos activos para retirar 🏆
- **Comisiones:** Puede retirarse directamente 💰

### Comisiones
- Solo con "Aumentar Con Comisión"
- Nivel 1: 5% del monto
- Nivel 2: 2% del monto
- Nivel 3: 1% del monto
- Se añaden a `mxi_from_unified_commissions`

### Mejores Prácticas
1. ✅ Verifica el balance actual antes de restar
2. ✅ Usa "Sin Comisión" para correcciones
3. ✅ Usa "Con Comisión" para simular compras
4. ✅ Documenta por qué haces ajustes
5. ✅ Comunica cambios al usuario

---

## 🚨 Errores Comunes

### "Balance insuficiente"
**Causa:** Intentas restar más de lo que tiene el usuario
**Solución:** Verifica el balance actual primero

### "Usuario no encontrado"
**Causa:** El correo no existe en el sistema
**Solución:** Verifica que el correo sea correcto

### "Código de referido no encontrado"
**Causa:** El código no existe
**Solución:** Verifica que el código sea correcto

### "Usuario ya tiene referidor"
**Causa:** El usuario ya está vinculado a otro referidor
**Solución:** No se puede cambiar el referidor una vez asignado

### "No tienes permisos"
**Causa:** Tu cuenta no está en admin_users
**Solución:** Contacta a un super admin

---

## 📊 Ejemplo de Comisiones

### Escenario: Añadir 100 MXI con comisión

```
Usuario A recibe: 100 MXI
↓
Referidor B (Nivel 1): +5 MXI (5%)
↓
Referidor C (Nivel 2): +2 MXI (2%)
↓
Referidor D (Nivel 3): +1 MXI (1%)

Total distribuido: 108 MXI
```

---

## 🔄 Flujo de Trabajo

```
1. Abrir Panel Admin
   ↓
2. Ir a Gestión de Usuarios
   ↓
3. Buscar/Seleccionar Usuario
   ↓
4. Scroll a "Gestión Completa de Saldos"
   ↓
5. Seleccionar Categoría y Acción
   ↓
6. Completar Formulario
   ↓
7. Confirmar Acción
   ↓
8. Verificar Mensaje de Éxito
```

---

## 📱 Acceso Rápido

### Desde el Panel
```
App → Admin → Gestión de Usuarios → Usuario → Gestión de Saldos
```

### Pantallas Disponibles
- `user-management-enhanced.tsx` ✅
- `user-management-advanced.tsx` ✅

---

## ⚡ Atajos Mentales

| Necesito... | Uso... |
|-------------|--------|
| Corregir error | Sumar Sin Comisión |
| Simular compra | Aumentar Con Comisión |
| Dar premio | Aumentar Torneo |
| Bono de vesting | Aumentar Vesting |
| Asignar referidor | Vincular Correo |
| Quitar MXI | Restar (con confirmación) |

---

## 🎯 Checklist Pre-Acción

Antes de hacer cualquier ajuste:

- [ ] ¿Verifiqué el balance actual del usuario?
- [ ] ¿Elegí la función correcta?
- [ ] ¿Documenté por qué hago este ajuste?
- [ ] ¿Consideré el impacto en referidores?
- [ ] ¿Voy a comunicar esto al usuario?

---

**Última Actualización:** 2025
**Versión:** 1.0
