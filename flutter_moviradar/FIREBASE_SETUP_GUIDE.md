# Guía de Configuración de Firebase para MoviRadar (Plan Gratuito Spark)

Esta guía detalla paso a paso cómo obtener y colocar tu archivo `google-services.json` desde la consola de Firebase para habilitar la autenticación real en MoviRadar sin costo alguno ($0, sin tarjeta de crédito).

---

## 📋 Resumen de Datos Clave de MoviRadar
- **Nombre de la Aplicación:** MoviRadar
- **ID de Paquete Android (Package Name / ApplicationId):** `com.moviradar.app`
- **Ubicación exacta del archivo:** `flutter_moviradar/android/app/google-services.json`
- **Servicios requeridos:** Firebase Authentication (Método: Correo electrónico / Contraseña)
- **Plan de Firebase:** **Spark** (100% Gratuito)

---

## 🚀 Paso a Paso

### Paso 1: Crear o Seleccionar tu Proyecto en Firebase Console
1. Entra a la consola oficial de Firebase: [https://console.firebase.google.com/](https://console.firebase.google.com/).
2. Inicia sesión con tu cuenta de Google.
3. Haz clic en **"Agregar proyecto"** (o *"Crear un proyecto"*).
4. Asigna un nombre al proyecto, por ejemplo: `MoviRadar` o `moviradar-app`.
5. Google Analytics es opcional (puedes desactivarlo o activarlo según tu preferencia).
6. Haz clic en **"Crear proyecto"** y espera unos segundos hasta que esté listo.
7. Verifica que tu plan en la esquina inferior izquierda diga **"Plan Spark"** (Gratis). **No actives el plan Blaze ni agregues tarjetas de crédito.**

---

### Paso 2: Habilitar la Autenticación con Correo y Contraseña
1. En el menú lateral izquierdo de Firebase Console, ve a **Compilación (Build)** > **Authentication**.
2. Haz clic en **"Comenzar"** (Get Started).
3. En la pestaña **"Método de acceso"** (Sign-in method):
   - Selecciona **"Correo electrónico/contraseña"** (Email/Password).
   - Activa el primer interruptor: **"Habilitar"**.
   - (Opcional: el enlace sin contraseña puede dejarse desactivado).
   - Haz clic en **"Guardar"**.

---

### Paso 3: Registrar la Aplicación Android
1. En el panel principal de tu proyecto en Firebase (*Descripción general del proyecto* / ⚙️ *Configuración del proyecto*):
2. Haz clic en el ícono de **Android** para agregar una aplicación.
3. Completa los campos del formulario:
   - **Nombre del paquete de Android:** Escribe exactamente:
     ```
     com.moviradar.app
     ```
     *(Es fundamental que coincida exactamente con el `applicationId` definido en `android/app/build.gradle`).*
   - **Sobrenombre de la app (opcional):** `MoviRadar Android`.
   - **Certificado de firma SHA-1 (opcional para email/password):** Puedes dejarlo en blanco por ahora. Solo se necesita si utilizas inicio de sesión con Google Sign-In.
4. Haz clic en **"Registrar app"**.

---

### Paso 4: Descargar `google-services.json`
1. En el siguiente paso del asistente, haz clic en el botón azul **"Descargar google-services.json"**.
2. Guarda el archivo descargado en tu computadora.
3. Mueve o copia el archivo `google-services.json` dentro de la carpeta:
   ```
   flutter_moviradar/android/app/google-services.json
   ```
   *(Debe quedar al mismo nivel que `build.gradle` dentro de `android/app/`).*

> 💡 **Nota de Seguridad:** En este repositorio se incluye un archivo de muestra llamado `google-services.json.example`. Tu archivo descargado de Firebase debe llamarse exactamente `google-services.json`.

---

### Paso 5: Habilitar los Plugins de Google Services en Gradle
Para que Gradle lea automáticamente el archivo `google-services.json`, abre los siguientes dos archivos en tu proyecto y descomenta las líneas señaladas:

#### A) En `flutter_moviradar/android/build.gradle` (nivel raíz del proyecto):
Busca el bloque `dependencies` y asegúrate de que la línea de `google-services` esté activa:

```groovy
dependencies {
    classpath 'com.android.tools.build:gradle:8.1.2'
    classpath "org.jetbrains.kotlin:kotlin-gradle-plugin:$kotlin_version"
    // Descomenta esta línea:
    classpath 'com.google.gms:google-services:4.4.1'
}
```

#### B) En `flutter_moviradar/android/app/build.gradle` (nivel aplicación):
Busca la línea cerca de la parte superior y descoméntala:

```groovy
apply plugin: 'com.android.application'
apply plugin: 'kotlin-android'
apply from: "$flutterRoot/packages/flutter_tools/gradle/flutter.gradle"
// Descomenta esta línea:
apply plugin: 'com.google.gms.google-services'
```

---

### Paso 6: Compilar y Probar en tu Dispositivo o Emulador
Con el archivo `google-services.json` en su lugar y las dos líneas de Gradle activadas:

1. Limpia y actualiza las dependencias de Flutter:
   ```bash
   flutter clean
   flutter pub get
   ```

2. Ejecuta la aplicación en tu celular Android o emulador:
   ```bash
   flutter run
   ```

3. Ve a la pantalla de **Registro** en MoviRadar:
   - Crea un usuario de prueba con tu correo (ej. `conductor@moviradar.com`) y una contraseña de al menos 6 caracteres.
   - Revisa la consola de Firebase en **Authentication > Users** y verás a tu usuario registrado en tiempo real.
   - Prueba cerrar sesión y volver a ingresar desde la pantalla de **Inicio de Sesión**.
   - Prueba la **Recuperación de Contraseña** ingresando el correo; Firebase enviará automáticamente el enlace de restablecimiento a tu bandeja de entrada.

---

### 🌟 Método Alternativo Oficial: FlutterFire CLI
Si prefieres que las herramientas oficiales de Flutter configuren todo automáticamente:
1. Instala Firebase CLI en tu terminal:
   ```bash
   npm install -g firebase-tools
   ```
2. Inicia sesión:
   ```bash
   firebase login
   ```
3. Activa FlutterFire CLI:
   ```bash
   dart pub global activate flutterfire_cli
   ```
4. Dentro de la carpeta `flutter_moviradar/`, ejecuta:
   ```bash
   flutterfire configure
   ```
   El asistente te permitirá seleccionar tu proyecto de Firebase y generará automáticamente tanto el `google-services.json` como el archivo `lib/firebase_options.dart` para Android e iOS.
