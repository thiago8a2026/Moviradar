import 'package:equatable/equatable.dart';

abstract class AuthEvent extends Equatable {
  const AuthEvent();

  @override
  List<Object?> get props => [];
}

class CheckAuthStatusEvent extends AuthEvent {}

class LoginWithEmailEvent extends AuthEvent {
  final String email;
  final String password;
  final bool rememberMe;

  const LoginWithEmailEvent({
    required this.email,
    required this.password,
    this.rememberMe = false,
  });

  @override
  List<Object?> get props => [email, password, rememberMe];
}

class RegisterUserEvent extends AuthEvent {
  final String name;
  final String email;
  final String password;
  final String confirmPassword;
  final bool termsAccepted;

  const RegisterUserEvent({
    required this.name,
    required this.email,
    required this.password,
    required this.confirmPassword,
    required this.termsAccepted,
  });

  @override
  List<Object?> get props => [
        name,
        email,
        password,
        confirmPassword,
        termsAccepted,
      ];
}

class RequestPasswordResetEvent extends AuthEvent {
  final String email;

  const RequestPasswordResetEvent({required this.email});

  @override
  List<Object?> get props => [email];
}

class ConfirmPasswordResetEvent extends AuthEvent {
  final String email;
  final String verificationCode;
  final String newPassword;

  const ConfirmPasswordResetEvent({
    required this.email,
    required this.verificationCode,
    required this.newPassword,
  });

  @override
  List<Object?> get props => [email, verificationCode, newPassword];
}

class LogoutEvent extends AuthEvent {}
