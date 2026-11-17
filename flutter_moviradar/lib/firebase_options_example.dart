// Archivo de referencia para inicializar Firebase con FlutterFire CLI.
// Generado automáticamente al ejecutar: flutterfire configure
// 
// Para usar este archivo, reemplaza los valores de ejemplo con tus credenciales
// del proyecto Firebase (Plan Spark) o ejecuta flutterfire configure.

import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;
import 'package:flutter/foundation.dart'
    show defaultTargetPlatform, kIsWeb, TargetPlatform;

class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    if (kIsWeb) {
      return web;
    }
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return android;
      case TargetPlatform.iOS:
        return ios;
      default:
        throw UnsupportedError(
          'DefaultFirebaseOptions no está configurado para esta plataforma.',
        );
    }
  }

  // Configuración Android (debe coincidir con tu google-services.json)
  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'AIzaSyEjemploReemplazarConTuClaveDeFirebaseSpark12345',
    appId: '1:123456789012:android:abcdef0123456789abcdef',
    messagingSenderId: '123456789012',
    projectId: 'moviradar-app',
    storageBucket: 'moviradar-app.appspot.com',
  );

  // Configuración Web (opcional para pruebas en navegador)
  static const FirebaseOptions web = FirebaseOptions(
    apiKey: 'AIzaSyEjemploReemplazarConTuClaveDeFirebaseSpark12345',
    appId: '1:123456789012:web:abcdef0123456789abcdef',
    messagingSenderId: '123456789012',
    projectId: 'moviradar-app',
    authDomain: 'moviradar-app.firebaseapp.com',
    storageBucket: 'moviradar-app.appspot.com',
  );

  // Configuración iOS (opcional para futura versión en Apple App Store)
  static const FirebaseOptions ios = FirebaseOptions(
    apiKey: 'AIzaSyEjemploReemplazarConTuClaveDeFirebaseSpark12345',
    appId: '1:123456789012:ios:abcdef0123456789abcdef',
    messagingSenderId: '123456789012',
    projectId: 'moviradar-app',
    storageBucket: 'moviradar-app.appspot.com',
    iosBundleId: 'com.moviradar.app',
  );
}
