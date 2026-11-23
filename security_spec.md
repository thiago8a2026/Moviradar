# MoviRadar Firestore Security Spec (Phase 0)

## 1. Data Invariants
1. Every document in `/reportes/{reportId}` must have a valid `reportId` matching `^[a-zA-Z0-9_\-]+$` (<= 128 chars).
2. `authorId` on create must equal `request.auth.uid` and is immutable on update.
3. `timestamp` on create must equal `request.time` (server timestamp) and is immutable on update.
4. `lat` (`-90..90`) and `lng` (`-180..180`) are numeric coordinates and immutable on update.
5. `isFixed: true` can only be set on create or modified by an authenticated verified admin (`isAdmin()`).
6. Community voting (`confirmations` or `denials`) can only increment the counter by `1` per update without modifying `authorId`, `lat`, `lng`, `tipo`, `descripcion`, or `isFixed`.
7. Deletion of `/reportes/{reportId}` is restricted strictly to the original `authorId` or an admin (`isAdmin()`).
8. No PII (`email`, `phone`, `address`) is stored in `/reportes`.

## 2. Dirty Dozen Attack Payloads (Must Return PERMISSION_DENIED)
1. Unauthenticated write to `/reportes/rep1` (`request.auth == null`).
2. Unverified email user creating `/reportes/rep1` (`email_verified == false`).
3. Spoofed `authorId` (`authorId != request.auth.uid`).
4. Forged client `timestamp` (`timestamp != request.time`).
5. Shadow field injection on create (`extraAdminFlag: true`).
6. Non-admin setting `isFixed: true` on create.
7. Oversized `reportId` (> 128 chars) or invalid characters (`../etc`).
8. Oversized `descripcion` (> 400 chars) or non-string `tipo`.
9. Out-of-bounds GPS coordinates (`lat: 999, lng: -500`).
10. Modifying `authorId` or `lat`/`lng` during an update.
11. Vote manipulation (`confirmations` jumped by `+100` instead of `+1`).
12. Unauthorized deletion of another user's report by a non-admin.

## 3. Módulo de Emergencia Gremial M34 Invariants (`/emergencias_m34` y `/apoyos`)
1. Access to `/emergencias_m34` and `/apoyos` (`get`, `list`, `create`, `update`, `delete`) is strictly restricted to verified Admins (`isAdmin()`) and active `vip_m34` users (`isVipM34OrAdmin()`).
2. Every document in `/emergencias_m34/{eventoId}` must have a valid `eventoId` (`isValidId`) and zero PII (only `apodo` indicativo, never email/phone).
3. On create: `estado == 'ACTIVA'`, `authorId == request.auth.uid`, `fotoCierre == null`, `finalizadoPorUid == null`, `finalizadoAt == null`, `createdAt == request.time`, `updatedAt == request.time`.
4. Live GPS updates (`lat`, `lng`, `sector`, `updatedAt`) while `estado == 'ACTIVA'` are strictly restricted to `existing().authorId == request.auth.uid`.
5. Terminal state locking: once `estado == 'FINALIZADA'`, further non-admin mutations are denied. Finalization (`estado: 'FINALIZADA'`) is allowed only for the event creator, a responder who linked via `/apoyos/{uid}`, or an authorized admin, with compressed `fotoCierre` bounded `<= 450000` chars.
6. Responder tracking `/emergencias_m34/{eventoId}/apoyos/{userId}` enforces Master Gate (`parent.estado == 'ACTIVA'`), self-only `request.auth.uid == userId`, bounded `list <= 100`, and valid `estadoApoyo` (`EN_CAMINO` | `EN_SITIO`).

