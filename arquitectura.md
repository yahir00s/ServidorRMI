## Arquitectura Distribuida (Simulada)

### Mapeo Conceptual → Implementación

| Concepto Distribuido | Implementación en el Proyecto |
|----------------------|-------------------------------|
| Objetos en nodos diferentes | Routers separados con identificadores de nodo |
| Invocación remota (RMI) | Peticiones HTTP REST |
| Replicación de datos | Array `replicas` en modelo Archivo |
| Service discovery | Balanceador con registro de nodos |
| Tolerancia a fallos | Control de status + lógica de failover |

### Escenarios Implementados vs Simulados

**Implementado funcionalmente:**
- Control de concurrencia optimista
- Autenticación/Autorización JWT
- Balanceo de carga round-robin
- Sistema de auditoría

**Simulado conceptualmente:**
- Distribución física de nodos (todo en localhost)
- Health checks automáticos (endpoints listos, no hay polling)
- Re-replicación automática (lógica documentada, no ejecutada)