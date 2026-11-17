import '../models/user_model.dart';

/// Abstract contract for authentication in MoviRadar.
/// Prepared for direct plug-and-play with Firebase Authentication & Cloud Firestore.
abstract class AuthRepository {
  /// Stream to listen to real-time auth state changes
  Stream<UserModel?> get authStateChanges;

  /// Get currently signed in user
  Future<UserModel?> getCurrentUser();

  /// Sign in with email and password
  Future<UserModel> signInWithEmailAndPassword({
    required String email,
    required String password,
  });

  /// Register a new citizen account
  Future<UserModel> registerWithEmailAndPassword({
    required String name,
    required String email,
    required String password,
  });

  /// Send password reset link to user's email
  Future<void> sendPasswordResetEmail({
    required String email,
  });

  /// Sign out current user
  Future<void> signOut();
}
