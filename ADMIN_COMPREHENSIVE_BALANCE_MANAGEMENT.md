
# 🎯 Gestión Completa de Saldos - Panel de Administrador

## 📋 Resumen

Se ha implementado un sistema completo de gestión de saldos para el panel de administrador, permitiendo control total sobre los diferentes tipos de balance de cada usuario.

## ✨ Funcionalidades Implementadas

### 💰 Balance General (mxi_purchased_directly)

#### 1. **Sumar Saldo Sin Generar Comisión**
- **Función:** `admin_add_balance_general_no_commission`
- **Descripción:** Añade MXI al balance general del usuario sin generar comisiones para referidores
- **Uso:** Ideal para correcciones, bonificaciones especiales o ajustes administrativos
- **Parámetros:**
  - `p_user_id`: ID del usuario
  - `p_admin_id`: ID del administrador
  - `p_amount`: Cantidad de MXI a añadir

#### 2. **Aumentar Saldo Generando Comisión**
- **Función:** `admin_add_balance_general_with_commission`
- **Descripción:** Añade MXI al balance general Y genera comisiones automáticas para la cadena de referidos
- **Comisiones Generadas:**
  - Nivel 1: 5% del monto
  - Nivel 2: 2% del monto
  - Nivel 3: 1% del monto
- **Uso:** Simular una compra real con todas sus implicaciones de comisiones
- **Parámetros:**
  - `p_user_id`: ID del usuario
  - `p_admin_id`: ID del administrador
  - `p_amount`: Cantidad de MXI a añadir

#### 3. **Restar Saldo Balance General**
- **Función:** `admin_subtract_balance_general`
- **Descripción:** Resta MXI del balance general del usuario
- **Validaciones:** Verifica que el usuario tenga suficiente balance antes de restar
- **Uso:** Correcciones, penalizaciones o ajustes administrativos
- **Parámetros:**
  - `p_user_id`: ID del usuario
  - `p_admin_id`: ID del administrador
  - `p_amount`: Cantidad de MXI a restar

---

### 🔒 Vesting (mxi_vesting_locked)

#### 4. **Aumentar Saldo Vesting**
- **Función:** `admin_add_balance_vesting`
- **Descripción:** Añade MXI al balance de vesting bloqueado
- **Características:** Este saldo permanece bloqueado hasta la fecha de lanzamiento oficial
- **Uso:** Añadir rendimientos adicionales o bonificaciones de vesting
- **Parámetros:**
  - `p_user_id`: ID del usuario
  - `p_admin_id`: ID del administrador
  - `p_amount`: Cantidad de MXI a añadir

#### 5. **Restar Saldo Vesting**
- **Función:** `admin_subtract_balance_vesting`
- **Descripción:** Resta MXI del balance de vesting bloqueado
- **Validaciones:** Verifica que el usuario tenga suficiente balance vesting antes de restar
- **Uso:** Correcciones de rendimientos o ajustes administrativos
- **Parámetros:**
  - `p_user_id`: ID del usuario
  - `p_admin_id`: ID del administrador
  - `p_amount`: Cantidad de MXI a restar

---

### 🏆 Torneos (mxi_from_challenges)

#### 6. **Aumentar Saldo Torneo**
- **Función:** `admin_add_balance_tournament`
- **Descripción:** Añade MXI al balance de torneos/retos
- **Características:** Este saldo puede usarse para participar en torneos
- **Uso:** Premios especiales, bonificaciones de torneos o ajustes
- **Parámetros:**
  - `p_user_id`: ID del usuario
  - `p_admin_id`: ID del administrador
  - `p_amount`: Cantidad de MXI a añadir

#### 7. **Restar Saldo Torneo**
- **Función:** `admin_subtract_balance_tournament`
- **Descripción:** Resta MXI del balance de torneos/retos
- **Validaciones:** Verifica que el usuario tenga suficiente balance de torneos antes de restar
- **Uso:** Correcciones de premios o ajustes administrativos
- **Parámetros:**
  - `p_user_id`: ID del usuario
  - `p_admin_id`: ID del administrador
  - `p_amount`: Cantidad de MXI a restar

---

### 🔗 Gestión de Referidos

#### 8. **Vincular Correo con Código de Referidor**
- **Función:** `admin_link_referral_by_code`
- **Descripción:** Vincula un usuario existente con un código de referidor
- **Validaciones:**
  - El usuario debe existir en el sistema
  - El código de referidor debe ser válido
  - El usuario no debe tener ya un referidor asignado
  - Un usuario no puede referirse a sí mismo
- **Uso:** Asignar referidores a usuarios que se registraron sin código
- **Parámetros:**
  - `p_admin_id`: ID del administrador
  - `p_user_email`: Correo del usuario a vincular
  - `p_referrer_code`: Código del referidor

---

## 🎨 Interfaz de Usuario

### Organización por Categorías

La interfaz está organizada en 4 categorías principales:

1. **💰 Balance General**
   - Sumar Sin Comisión
   - Aumentar Con Comisión
   - Restar Balance

2. **🔒 Vesting**
   - Aumentar Vesting
   - Restar Vesting

3. **🏆 Torneos**
   - Aumentar Torneo
   - Restar Torneo

4. **🔗 Referidos**
   - Vincular Correo con Código

### Características de la UI

- **Modales Informativos:** Cada acción abre un modal con información clara sobre lo que se va a realizar
- **Validaciones en Tiempo Real:** Verifica que los montos sean válidos antes de enviar
- **Confirmaciones de Seguridad:** Acciones destructivas (restar) requieren confirmación adicional
- **Feedback Visual:** Indicadores de carga y mensajes de éxito/error claros
- **Diseño Intuitivo:** Botones codificados por colores según la acción

---

## 🔐 Seguridad

### Verificaciones Implementadas

1. **Autenticación de Admin:** Todas las funciones verifican que el usuario sea administrador
2. **Validación de Montos:** Los montos deben ser mayores a 0
3. **Verificación de Balance:** Las restas verifican que haya suficiente balance
4. **Prevención de Auto-Referidos:** No se permite que un usuario se refiera a sí mismo
5. **Verificación de Referidor Único:** Un usuario solo puede tener un referidor

### Permisos Requeridos

- El usuario debe estar registrado en la tabla `admin_users`
- Las funciones usan `SECURITY DEFINER` para ejecutarse con privilegios elevados
- Todas las acciones quedan registradas con el ID del administrador que las realizó

---

## 📊 Casos de Uso

### Escenario 1: Corrección de Balance
**Problema:** Un usuario reporta que no recibió sus MXI de una compra
**Solución:** Usar "Sumar Saldo Sin Generar Comisión" para añadir el monto faltante

### Escenario 2: Bonificación Especial
**Problema:** Quieres dar un bono a usuarios activos
**Solución:** Usar "Aumentar Saldo Torneo" para dar MXI que puedan usar en juegos

### Escenario 3: Usuario Sin Referidor
**Problema:** Un usuario se registró sin código de referido pero debería tener uno
**Solución:** Usar "Vincular Correo con Código" para asignar el referidor correcto

### Escenario 4: Simular Compra con Comisiones
**Problema:** Necesitas probar el sistema de comisiones
**Solución:** Usar "Aumentar Saldo Generando Comisión" para simular una compra real

### Escenario 5: Corrección de Vesting
**Problema:** El cálculo de vesting generó un monto incorrecto
**Solución:** Usar "Restar Saldo Vesting" y luego "Aumentar Saldo Vesting" con el monto correcto

---

## 🚀 Acceso a las Funciones

### Desde el Panel de Administrador

1. Navegar a **Gestión de Usuarios** (Enhanced o Advanced)
2. Seleccionar un usuario de la lista
3. Scroll hasta la sección **"⚙️ Gestión Completa de Saldos"**
4. Seleccionar la acción deseada
5. Completar el formulario en el modal
6. Confirmar la acción

### Ubicación en el Código

- **Componente:** `components/AdminUserManagement.tsx`
- **Funciones DB:** Migración `admin_comprehensive_balance_management`
- **Pantallas Admin:**
  - `app/(tabs)/(admin)/user-management-enhanced.tsx`
  - `app/(tabs)/(admin)/user-management-advanced.tsx`

---

## 📝 Notas Importantes

### Balance General vs Otros Balances

- **Balance General (mxi_purchased_directly):** Puede usarse para todo (torneos, retiros, etc.)
- **Balance Vesting (mxi_vesting_locked):** Bloqueado hasta lanzamiento, genera rendimiento
- **Balance Torneos (mxi_from_challenges):** Ganado en torneos, requiere 5 referidos activos para retirar
- **Balance Comisiones (mxi_from_unified_commissions):** Ganado por referidos, puede retirarse

### Comisiones de Referidos

Cuando usas "Aumentar Saldo Generando Comisión":
- Se añade el monto completo al usuario
- Se calculan y añaden comisiones a los referidores automáticamente
- Las comisiones se añaden a `mxi_from_unified_commissions`
- La cadena de comisiones se detiene si no hay más referidores

### Mejores Prácticas

1. **Documenta las Acciones:** Mantén un registro de por qué se hicieron ajustes manuales
2. **Verifica Antes de Restar:** Siempre verifica el balance actual antes de restar
3. **Usa la Función Correcta:** Elige entre "con comisión" y "sin comisión" según el caso
4. **Comunica con el Usuario:** Informa al usuario sobre ajustes en su balance
5. **Revisa el Impacto:** Considera cómo los cambios afectan a otros usuarios (referidores)

---

## 🔄 Actualizaciones Futuras

### Posibles Mejoras

- [ ] Historial de ajustes administrativos
- [ ] Razones obligatorias para ajustes
- [ ] Límites de monto por ajuste
- [ ] Aprobación de múltiples administradores para montos grandes
- [ ] Exportación de reportes de ajustes
- [ ] Notificaciones automáticas a usuarios sobre ajustes

---

## 📞 Soporte

Si encuentras algún problema o necesitas ayuda con las funciones de gestión de saldos:

1. Verifica que tienes permisos de administrador
2. Revisa los logs de la consola para errores específicos
3. Verifica que el usuario existe y tiene los balances necesarios
4. Consulta este documento para casos de uso específicos

---

## ✅ Checklist de Implementación

- [x] Funciones de base de datos creadas
- [x] Componente AdminUserManagement actualizado
- [x] Interfaz de usuario implementada
- [x] Validaciones de seguridad añadidas
- [x] Confirmaciones para acciones destructivas
- [x] Mensajes de error y éxito claros
- [x] Documentación completa
- [x] Integración con pantallas de admin existentes

---

**Fecha de Implementación:** 2025
**Versión:** 1.0
**Estado:** ✅ Completado
