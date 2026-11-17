# MoviRadar - Aplicación Móvil de Movilidad Ciudadana (Flutter, BLoC, OpenStreetMap & Firebase Spark)

MoviRadar es una aplicación móvil desarrollada en **Flutter** con arquitectura limpia (**Clean Architecture**) y gestión de estados reactiva con el patrón **BLoC**, diseñada con una política estricta de **cero costos**:
- **Cartografía:** 100% libre y gratuita mediante **OpenStreetMap**, `flutter_map` y `latlong2` (sin requerir Google Maps Platform ni tarjetas de crédito).
- **Autenticación:** **Firebase Authentication** bajo el **Plan Spark** (100% gratuito para hasta 50,000 usuarios activos mensuales).

---

## 🗺️ Mapa OpenStreetMap y Geolocalización GPS
- Visualización fluida de mapas vectoriales con teselas de `tile.openstreetmap.org`.
- Permisos nativos de ubicación GPS en tiempo real (`geolocator`).
- Botón de centrado en la ubicación actual del usuario (`MapController.move`).
- Controles de acercar y alejar (+ / -).
- Cumplimiento estricto con la política de uso de teselas de OpenStreetMap (User-Agent `com.moviradar.app` y atribución requerida).

---

## 🚨 Arquitectura de Reportes Ciudadanos (7 Categorías)
La arquitectura está preparada en `lib/features/reports/` para registrar y visualizar:
1. **Accidentes:** Colisiones y percances viales.
2. **Congestión vehicular:** Tráfico lento o embotellamientos.
3. **Vías cerradas:** Bloqueos por eventos o emergencias.
4. **Obras en la vía:** Mantenimiento de asfalto y pavimentación.
5. **Vehículos varados:** Autos detenidos por averías mecánicas.
6. **Peligros / Baches:** Huecos, baches o irregularidades en la calzada.
7. **Otros acontecimientos:** Cualquier otra novedad cívica relevante.

Cada reporte captura:
- Tipo de novedad
- Coordenadas GPS (`latitude`, `longitude`)
- Fecha y hora
- Descripción y ubicación aproximada
- Contador de confirmaciones ciudadanas para validar la veracidad

---

## 📱 Pantalla Principal (5 Pestañas de Navegación)
1. **Inicio:** Resumen de la red ciudadana y alertas en ruta.
2. **Mapa:** El mapa OpenStreetMap a pantalla completa como protagonista.
3. **Reportar:** Formulario rápido para emitir un aviso en el radar.
4. **Notificaciones / Avisos:** Alertas comunitarias cercanas.
5. **Perfil:** Datos de la sesión de Firebase Auth, reputación y cierre de sesión.

---

## 🛠️ Cómo Ejecutar en Android Studio / VS Code
1. Abre una terminal en esta carpeta:
   ```bash
   cd flutter_moviradar
   flutter pub get
   ```
2. Para conectar Firebase con tu propio proyecto gratuito Spark:
   - Ve a [Firebase Console](https://console.firebase.google.com/) (Plan Spark).
   - Crea un proyecto y habilita el proveedor **Correo electrónico / Contraseña** en Authentication.
   - Agrega una aplicación Android con el paquete `com.moviradar.app`.
   - Descarga el archivo `google-services.json` y colócalo en:
     `flutter_moviradar/android/app/google-services.json`
3. Conecta tu celular Android por USB (con depuración USB activada) o inicia un emulador.
4. Compila y ejecuta la app:
   ```bash
   flutter run
   ```
5. Para generar el instalador APK:
   ```bash
   flutter build apk --release
   ```
   El APK se generará en `build/app/outputs/flutter-apk/app-release.apk`.
