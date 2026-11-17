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
