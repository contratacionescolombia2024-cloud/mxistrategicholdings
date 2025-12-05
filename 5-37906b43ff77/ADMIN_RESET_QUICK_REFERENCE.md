
# 🚀 Referencia Rápida: Reset de Usuarios

## ⚡ Acceso Rápido

```
Panel de Administración → Zona de Peligro → Reiniciar Todos los Usuarios
```

---

## 🔑 Pasos Rápidos

1. **Abrir Panel Admin**
   - Navega a Panel de Administración

2. **Localizar Zona de Peligro**
   - Sección roja en la parte superior

3. **Hacer Clic en Reset**
   - Botón "Reiniciar Todos los Usuarios"

4. **Leer Advertencias**
   - Revisa la lista completa

5. **Escribir Confirmación**
   - Escribe: `RESETEAR` (mayúsculas)

6. **Confirmar**
   - Clic en "Confirmar Reset"

7. **Esperar**
   - Proceso toma 2-5 segundos

8. **Verificar**
   - Revisa mensaje de éxito
   - Verifica estadísticas

---

## ⚠️ Advertencias Críticas

| ⚠️ | **ESTA ACCIÓN ES IRREVERSIBLE** |
|---|---|
| 🗑️ | Elimina TODOS los saldos de usuarios |
| 🗑️ | Elimina TODAS las comisiones |
| 🗑️ | Elimina TODOS los referidos |
| 🗑️ | Elimina TODAS las transacciones |
| 🗑️ | Reinicia métricas a valores iniciales |

---

## ✅ Checklist Pre-Reset

- [ ] Backup de datos creado
- [ ] Equipo notificado
- [ ] Configuraciones documentadas
- [ ] Ventana de mantenimiento establecida
- [ ] Permisos de admin verificados
- [ ] Listo para iniciar preventa

---

## 🔒 Seguridad

### Requisitos
- ✅ Ser administrador en `admin_users`
- ✅ Escribir "RESETEAR" exactamente
- ✅ Confirmar en modal

### Protecciones
- ✅ Tu cuenta NO se resetea
- ✅ Transacción atómica
- ✅ Rollback automático si falla

---

## 📊 Qué Se Resetea

### Usuarios
```
mxi_balance → 0
usdt_contributed → 0
mxi_purchased_directly → 0
mxi_from_unified_commissions → 0
mxi_from_challenges → 0
mxi_vesting_locked → 0
active_referrals → 0
is_active_contributor → false
```

### Métricas
```
total_members → 56527
total_tokens_sold → 0
current_phase → 1
current_price_usdt → 0.30
phase_X_tokens_sold → 0
```

### Tablas Limpiadas
```
✓ commissions
✓ referrals
✓ contributions
✓ withdrawals
✓ challenge_history
✓ lottery_tickets
✓ game_sessions
✓ nowpayments_orders
✓ mxi_withdrawal_schedule
```

---

## 🐛 Errores Comunes

| Error | Solución |
|-------|----------|
| "No tienes permisos" | Verifica ser admin |
| "Debes escribir RESETEAR" | Escribe en MAYÚSCULAS |
| "Error en ejecución" | Revisa logs de Supabase |
| Timeout | Contacta soporte técnico |

---

## 📞 Soporte Rápido

### Logs
```
Supabase Dashboard → Logs → API
Buscar: admin_reset_all_users
```

### Verificar Permisos
```sql
SELECT * FROM admin_users WHERE user_id = 'tu_id';
```

### Verificar Reset
```sql
SELECT COUNT(*), SUM(mxi_balance) FROM users;
SELECT * FROM metrics;
```

---

## ⏱️ Tiempo Estimado

| Acción | Tiempo |
|--------|--------|
| Abrir modal | Instantáneo |
| Leer advertencias | 30 segundos |
| Escribir confirmación | 5 segundos |
| Ejecutar reset | 2-5 segundos |
| Verificar resultado | 10 segundos |
| **TOTAL** | **~1 minuto** |

---

## 🎯 Después del Reset

### Verificar Inmediatamente
1. ✅ Todos los saldos en 0
2. ✅ Métricas reiniciadas
3. ✅ No hay comisiones
4. ✅ No hay referidos
5. ✅ Tu cuenta intacta

### Acciones Siguientes
1. 📢 Notificar al equipo
2. 🔧 Configurar sistema de pagos
3. 🚀 Iniciar preventa
4. 📊 Monitorear primeras transacciones

---

## 💡 Tips Importantes

- 🔴 **NUNCA** ejecutes en producción sin backup
- 🔴 **SIEMPRE** notifica al equipo antes
- 🔴 **VERIFICA** dos veces antes de confirmar
- 🟢 **DOCUMENTA** cuándo y por qué reseteas
- 🟢 **MONITOREA** el sistema después del reset

---

## 📱 Atajos de Teclado

| Acción | Atajo |
|--------|-------|
| Abrir modal | Clic en botón |
| Cerrar modal | ESC (si aplica) |
| Confirmar | Enter (después de escribir) |

---

## 🔄 Frecuencia Recomendada

| Situación | Frecuencia |
|-----------|------------|
| Pruebas de desarrollo | Según necesidad |
| Staging | Antes de cada test importante |
| Producción | **UNA VEZ** antes de preventa |
| Post-lanzamiento | **NUNCA** (datos reales) |

---

## 📋 Plantilla de Comunicación

```
ASUNTO: Mantenimiento Programado - Reset de Sistema

Equipo,

Se realizará un reset completo del sistema el [FECHA] a las [HORA].

Duración estimada: 5 minutos
Impacto: Todos los datos de prueba serán eliminados
Acción requerida: Ninguna

Después del reset:
- Todos los contadores en 0
- Sistema listo para preventa
- Métricas reiniciadas

Preguntas: [TU EMAIL]

Gracias,
[TU NOMBRE]
```

---

## 🎓 Recursos Adicionales

- 📖 **Guía Completa:** ADMIN_RESET_SYSTEM_GUIDE.md
- 📋 **Resumen Técnico:** ADMIN_RESET_IMPLEMENTATION_SUMMARY.md
- 🔧 **Función SQL:** Migración `admin_reset_all_users_function`
- 💻 **Código UI:** `app/(tabs)/(admin)/index.tsx`

---

## ✨ Última Actualización

**Fecha:** 2025
**Versión:** 1.0.0
**Mantenedor:** Sistema MXI Strategic

---

**¿Listo para resetear? Sigue los pasos y ten confianza. El sistema está diseñado para ser seguro y confiable. 🚀**
