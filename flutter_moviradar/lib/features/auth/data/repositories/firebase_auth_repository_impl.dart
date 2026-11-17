import 'dart:async';
import 'package:firebase_auth/firebase_auth.dart';
import '../../domain/models/user_model.dart';
import '../../domain/repositories/auth_repository.dart';

/// Implementación real de [AuthRepository] utilizando Firebase Authentication (Plan Spark - 100% Gratuito).
class FirebaseAuthRepositoryImpl implements AuthRepository {
  final FirebaseAuth _firebaseAuth;

  FirebaseAuthRepositoryImpl({FirebaseAuth? firebaseAuth})
      : _firebaseAuth = firebaseAuth ?? FirebaseAuth.instance;

  @override
  Stream<UserModel?> get authStateChanges {
    return _firebaseAuth.authStateChanges().map((User? firebaseUser) {
      if (firebaseUser == null) return null;
      return _mapFirebaseUserToModel(firebaseUser);
    });
  }

  @override
  Future<UserModel?> getCurrentUser() async {
    try {
      final user = _firebaseAuth.currentUser;
      if (user != null) {
        return _mapFirebaseUserToModel(user);
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  @override
  Future<UserModel> signInWithEmailAndPassword({
    required String email,
    required String password,
  }) async {
    try {
      final userCredential = await _firebaseAuth.signInWithEmailAndPassword(
        email: email.trim().toLowerCase(),
        password: password,
      );

      final user = userCredential.user;
      if (user == null) {
        throw Exception('No se pudo obtener la sesión del usuario autenticado.');
      }

      return _mapFirebaseUserToModel(user);
    } on FirebaseAuthException catch (e) {
      throw _mapFirebaseAuthException(e);
    } catch (e) {
      throw Exception('Error al iniciar sesión: ${e.toString()}');
    }
  }

  @override
  Future<UserModel> registerWithEmailAndPassword({
    required String name,
    required String email,
    required String password,
  }) async {
    try {
      final userCredential = await _firebaseAuth.createUserWithEmailAndPassword(
        email: email.trim().toLowerCase(),
        password: password,
      );

      final user = userCredential.user;
      if (user == null) {
        throw Exception('No se pudo crear la cuenta de usuario.');
      }

      // Actualizar el nombre para mostrar en Firebase Auth
      await user.updateDisplayName(name.trim());
      await user.reload();
      final updatedUser = _firebaseAuth.currentUser ?? user;

      return _mapFirebaseUserToModel(updatedUser);
    } on FirebaseAuthException catch (e) {
      throw _mapFirebaseAuthException(e);
    } catch (e) {
      throw Exception('Error en el registro: ${e.toString()}');
    }
  }

  @override
  Future<void> sendPasswordResetEmail({required String email}) async {
    try {
      await _firebaseAuth.sendPasswordResetEmail(
        email: email.trim().toLowerCase(),
      );
    } on FirebaseAuthException catch (e) {
      throw _mapFirebaseAuthException(e);
    } catch (e) {
      throw Exception('Error al enviar el correo de recuperación: ${e.toString()}');
    }
  }

  @override
  Future<void> signOut() async {
    try {
      await _firebaseAuth.signOut();
    } catch (e) {
      throw Exception('Error al cerrar sesión: ${e.toString()}');
    }
  }

  UserModel _mapFirebaseUserToModel(User user) {
    return UserModel(
      id: user.uid,
      email: user.email ?? '',
      displayName: user.displayName ?? (user.email?.split('@').first ?? 'Ciudadano'),
      photoUrl: user.photoURL,
      reputationScore: 100, // Puntuación inicial del plan ciudadano
      isVerifiedCitizen: user.emailVerified,
      subscriptionTier: 'free',
      createdAt: user.metadata.creationTime ?? DateTime.now(),
    );
  }

  Exception _mapFirebaseAuthException(FirebaseAuthException e) {
    switch (e.code) {
      case 'user-not-found':
        return Exception('No existe ninguna cuenta registrada con este correo electrónico.');
      case 'wrong-password':
      case 'invalid-credential':
        return Exception('Contraseña incorrecta o credenciales no válidas.');
      case 'email-already-in-use':
        return Exception('Este correo electrónico ya está registrado. Inicia sesión en su lugar.');
      case 'invalid-email':
        return Exception('El formato del correo electrónico ingresado no es válido.');
      case 'weak-password':
        return Exception('La contraseña es muy débil. Debe contener al menos 8 caracteres.');
      case 'user-disabled':
        return Exception('Esta cuenta ha sido inhabilitada temporalmente.');
      case 'too-many-requests':
        return Exception('Demasiados intentos fallidos. Por seguridad, espera unos minutos e inténtalo de nuevo.');
      case 'network-request-failed':
        return Exception('Error de conexión a internet. Verifica tu red móvil o Wi-Fi.');
      case 'operation-not-allowed':
        return Exception('El método de correo y contraseña debe ser habilitado en la consola de Firebase.');
      default:
        return Exception(e.message ?? 'Error de autenticación (${e.code}).');
    }
  }
}
