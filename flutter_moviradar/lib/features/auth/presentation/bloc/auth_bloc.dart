import 'package:flutter_bloc/flutter_bloc.dart';
import '../../domain/repositories/auth_repository.dart';
import 'auth_event.dart';
import 'auth_state.dart';

class AuthBloc extends Bloc<AuthEvent, AuthState> {
  final AuthRepository authRepository;

  AuthBloc({required this.authRepository}) : super(const AuthState()) {
    on<CheckAuthStatusEvent>(_onCheckAuthStatus);
    on<LoginWithEmailEvent>(_onLoginWithEmail);
    on<RegisterUserEvent>(_onRegisterUser);
    on<RequestPasswordResetEvent>(_onRequestPasswordReset);
    on<ConfirmPasswordResetEvent>(_onConfirmPasswordReset);
    on<LogoutEvent>(_onLogout);
  }

  Future<void> _onCheckAuthStatus(
    CheckAuthStatusEvent event,
    Emitter<AuthState> emit,
  ) async {
    try {
      final user = await authRepository.getCurrentUser();
      if (user != null) {
        emit(state.copyWith(
          status: AuthStatus.authenticated,
          user: user,
        ));
      } else {
        emit(state.copyWith(status: AuthStatus.unauthenticated));
      }
    } catch (e) {
      emit(state.copyWith(
        status: AuthStatus.unauthenticated,
        errorMessage: e.toString(),
      ));
    }
  }

  Future<void> _onLoginWithEmail(
    LoginWithEmailEvent event,
    Emitter<AuthState> emit,
  ) async {
    final email = event.email.trim();
    final password = event.password;

    if (email.isEmpty || !email.contains('@')) {
      emit(state.copyWith(
        status: AuthStatus.error,
        errorMessage: 'Por favor ingresa un correo electrónico válido.',
      ));
      return;
    }

    if (password.length < 6) {
      emit(state.copyWith(
        status: AuthStatus.error,
        errorMessage: 'La contraseña debe tener al menos 6 caracteres.',
      ));
      return;
    }

    emit(state.copyWith(status: AuthStatus.loading, errorMessage: null));

    try {
      final user = await authRepository.signInWithEmailAndPassword(
        email: email,
        password: password,
      );

      emit(state.copyWith(
        status: AuthStatus.authenticated,
        user: user,
        successMessage: '¡Bienvenido a MoviRadar, ${user.displayName}!',
      ));
    } catch (e) {
      emit(state.copyWith(
        status: AuthStatus.error,
        errorMessage: 'Error al iniciar sesión: ${e.toString()}',
      ));
    }
  }

  Future<void> _onRegisterUser(
    RegisterUserEvent event,
    Emitter<AuthState> emit,
  ) async {
    final name = event.name.trim();
    final email = event.email.trim();
    final password = event.password;
    final confirm = event.confirmPassword;

    if (name.isEmpty) {
      emit(state.copyWith(
        status: AuthStatus.error,
        errorMessage: 'Por favor ingresa tu nombre completo.',
      ));
      return;
    }

    if (!email.contains('@')) {
      emit(state.copyWith(
        status: AuthStatus.error,
        errorMessage: 'El correo electrónico no es válido.',
      ));
      return;
    }

    if (password.length < 8) {
      emit(state.copyWith(
        status: AuthStatus.error,
        errorMessage: 'La contraseña debe tener mínimo 8 caracteres.',
      ));
      return;
    }

    if (password != confirm) {
      emit(state.copyWith(
        status: AuthStatus.error,
        errorMessage: 'Las contraseñas no coinciden.',
      ));
      return;
    }

    if (!event.termsAccepted) {
      emit(state.copyWith(
        status: AuthStatus.error,
        errorMessage: 'Debes aceptar los Términos de Servicio y el Código Cívico.',
      ));
      return;
    }

    emit(state.copyWith(status: AuthStatus.loading, errorMessage: null));

    try {
      final user = await authRepository.registerWithEmailAndPassword(
        name: name,
        email: email,
        password: password,
      );

      emit(state.copyWith(
        status: AuthStatus.authenticated,
        user: user,
        successMessage: '¡Cuenta creada con éxito! Bienvenido a MoviRadar.',
      ));
    } catch (e) {
      emit(state.copyWith(
        status: AuthStatus.error,
        errorMessage: 'Error en el registro: ${e.toString()}',
      ));
    }
  }

  Future<void> _onRequestPasswordReset(
    RequestPasswordResetEvent event,
    Emitter<AuthState> emit,
  ) async {
    final email = event.email.trim();
    if (email.isEmpty || !email.contains('@')) {
      emit(state.copyWith(
        status: AuthStatus.error,
        errorMessage: 'Ingresa un correo electrónico válido para enviar el enlace.',
      ));
      return;
    }

    emit(state.copyWith(status: AuthStatus.loading, errorMessage: null));

    try {
      await authRepository.sendPasswordResetEmail(email: email);
      emit(state.copyWith(
        status: AuthStatus.passwordResetSent,
        successMessage:
            'Hemos enviado un correo de recuperación a $email con el código de verificación.',
      ));
    } catch (e) {
      emit(state.copyWith(
        status: AuthStatus.error,
        errorMessage: 'No se pudo enviar el correo: ${e.toString()}',
      ));
    }
  }

  Future<void> _onConfirmPasswordReset(
    ConfirmPasswordResetEvent event,
    Emitter<AuthState> emit,
  ) async {
    if (event.verificationCode.length < 6) {
      emit(state.copyWith(
        status: AuthStatus.error,
        errorMessage: 'El código de verificación debe tener 6 dígitos.',
      ));
      return;
    }

    if (event.newPassword.length < 8) {
      emit(state.copyWith(
        status: AuthStatus.error,
        errorMessage: 'La nueva contraseña debe tener al menos 8 caracteres.',
      ));
      return;
    }

    emit(state.copyWith(status: AuthStatus.loading, errorMessage: null));

    try {
      // Simula verificación con éxito
      await Future.delayed(const Duration(milliseconds: 700));
      emit(state.copyWith(
        status: AuthStatus.passwordResetSuccess,
        successMessage: 'Contraseña actualizada correctamente. Inicia sesión con tus nuevos datos.',
      ));
    } catch (e) {
      emit(state.copyWith(
        status: AuthStatus.error,
        errorMessage: 'Código inválido o expirado.',
      ));
    }
  }

  Future<void> _onLogout(
    LogoutEvent event,
    Emitter<AuthState> emit,
  ) async {
    await authRepository.signOut();
    emit(const AuthState(status: AuthStatus.unauthenticated));
  }
}
