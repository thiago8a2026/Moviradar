import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'core/theme/app_theme.dart';
import 'core/routes/app_routes.dart';
import 'features/auth/domain/repositories/auth_repository.dart';
import 'features/auth/data/repositories/firebase_auth_repository_impl.dart';
import 'features/auth/presentation/bloc/auth_bloc.dart';
import 'features/auth/presentation/bloc/auth_event.dart';
import 'features/auth/presentation/screens/welcome_screen.dart';
import 'features/maps/presentation/bloc/map_bloc.dart';
import 'features/maps/presentation/bloc/map_event.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Bloquea orientación vertical para experiencia de conducción y uso óptimo con una sola mano
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);

  // Barra de estado translúcida moderna de Android
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.light,
      systemNavigationBarColor: AppColors.backgroundDark,
      systemNavigationBarIconBrightness: Brightness.light,
    ),
  );

  // Inicialización de Repositorios (Preparado para Firebase)
  final AuthRepository authRepository = FirebaseAuthRepositoryImpl();

  runApp(MoviRadarApp(authRepository: authRepository));
}

class MoviRadarApp extends StatelessWidget {
  final AuthRepository authRepository;

  const MoviRadarApp({super.key, required this.authRepository});

  @override
  Widget build(BuildContext context) {
    return MultiBlocProvider(
      providers: [
        BlocProvider<AuthBloc>(
          create: (context) => AuthBloc(authRepository: authRepository)
            ..add(CheckAuthStatusEvent()),
        ),
        BlocProvider<MapBloc>(
          create: (context) => MapBloc()..add(InitializeMapLocationEvent()),
        ),
      ],
      child: MaterialApp(
        title: 'MoviRadar',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.darkTheme,
        initialRoute: AppRoutes.welcome,
        routes: AppRoutes.routes,
      ),
    );
  }
}
