export interface FlutterFile {
  path: string;
  name: string;
  category: 'core' | 'auth' | 'maps' | 'reports' | 'home' | 'config' | 'android';
  description: string;
  code: string;
}

export const FLUTTER_PROJECT_FILES: FlutterFile[] = [
  {
    path: 'pubspec.yaml',
    name: 'pubspec.yaml',
    category: 'config',
    description: 'Dependencias actualizadas con flutter_map, latlong2, geolocator y BLoC.',
    code: `name: moviradar
description: "MoviRadar - Aplicación móvil de movilidad ciudadana con OpenStreetMap, GPS en vivo, arquitectura limpia y BLoC."
publish_to: 'none'
version: 1.0.0+1

environment:
  sdk: '>=3.2.0 <4.0.0'

dependencies:
  flutter:
    sdk: flutter

  # State Management (BLoC Pattern)
  flutter_bloc: ^8.1.3
  bloc: ^8.1.2
  equatable: ^2.0.5

  # Design & Icons
  cupertino_icons: ^1.0.6
  google_fonts: ^6.1.0

  # Mapas y Geolocalización (100% Gratuitos / OpenStreetMap)
  flutter_map: ^6.1.0
  latlong2: ^0.9.0
  geolocator: ^11.0.0

  # Autenticación Real (Firebase Spark - 100% Gratuito)
  firebase_core: ^2.27.0
  firebase_auth: ^4.17.8

  # Base de Datos en Tiempo Real (Cloud Firestore Spark - Plan Gratuito)
  cloud_firestore: ^4.15.8

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^3.0.0

flutter:
  uses-material-design: true
  assets:
    - assets/images/
    - assets/icons/
`
  },
  {
    path: 'lib/main.dart',
    name: 'main.dart',
    category: 'core',
    description: 'Punto de entrada de Flutter con MultiBlocProvider (AuthBloc y MapBloc) y rutas.',
    code: `import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:firebase_core/firebase_core.dart';
import 'core/theme/app_theme.dart';
import 'core/routes/app_routes.dart';
import 'features/auth/domain/repositories/auth_repository.dart';
import 'features/auth/data/repositories/firebase_auth_repository_impl.dart';
import 'features/auth/presentation/bloc/auth_bloc.dart';
import 'features/auth/presentation/bloc/auth_event.dart';
import 'features/maps/presentation/bloc/map_bloc.dart';
import 'features/maps/presentation/bloc/map_event.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);

  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.light,
      systemNavigationBarColor: AppColors.backgroundDark,
      systemNavigationBarIconBrightness: Brightness.light,
    ),
  );

  try {
    await Firebase.initializeApp();
  } catch (e) {
    debugPrint('Firebase pendiente de configuración (requiere google-services.json): \$e');
  }

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
`
  },
  {
    path: 'lib/features/maps/presentation/bloc/map_bloc.dart',
    name: 'map_bloc.dart',
    category: 'maps',
    description: 'BLoC de la pantalla principal para ubicación GPS, permisos y cámara del mapa.',
    code: `import 'dart:async';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:geolocator/geolocator.dart';
import 'package:latlong2/latlong.dart';
import 'map_event.dart';
import 'map_state.dart';

class MapBloc extends Bloc<MapEvent, MapState> {
  StreamSubscription<Position>? _positionSubscription;

  MapBloc() : super(const MapState()) {
    on<InitializeMapLocationEvent>(_onInitializeMapLocation);
    on<RequestGpsPermissionEvent>(_onRequestGpsPermission);
    on<UserLocationUpdatedEvent>(_onUserLocationUpdated);
    on<CenterMapOnUserEvent>(_onCenterMapOnUser);
    on<ChangeMapZoomEvent>(_onChangeMapZoom);
    on<SetMapZoomEvent>(_onSetMapZoom);
    on<MoveMapCameraEvent>(_onMoveMapCamera);
    on<SelectReportMarkerEvent>(_onSelectReportMarker);
    on<ClearSelectedReportMarkerEvent>(_onClearSelectedReportMarker);
  }

  Future<void> _onInitializeMapLocation(
    InitializeMapLocationEvent event,
    Emitter<MapState> emit,
  ) async {
    emit(state.copyWith(status: MapStatus.loadingGps));

    try {
      final serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        emit(state.copyWith(
          status: MapStatus.gpsServiceDisabled,
          errorMessage: 'El GPS está desactivado. Actívalo para ubicarte en el mapa.',
        ));
        return;
      }

      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          emit(state.copyWith(
            status: MapStatus.permissionDenied,
            errorMessage: 'Permisos de ubicación denegados. No podemos mostrar tu posición exacta.',
          ));
          return;
        }
      }

      if (permission == LocationPermission.deniedForever) {
        emit(state.copyWith(
          status: MapStatus.permissionDeniedForever,
          errorMessage: 'Permisos de ubicación denegados permanentemente en los ajustes.',
        ));
        return;
      }

      final position = await Geolocator.getCurrentPosition(desiredAccuracy: LocationAccuracy.high);
      final userLatLng = LatLng(position.latitude, position.longitude);

      emit(state.copyWith(
        status: MapStatus.gpsReady,
        userLocation: userLatLng,
        cameraCenter: userLatLng,
        zoomLevel: 15.5,
        isTrackingUser: true,
        shouldAnimateCamera: true,
      ));

      _startLocationTracking();
    } catch (e) {
      emit(state.copyWith(
        status: MapStatus.error,
        errorMessage: 'Error al obtener la posición GPS: \${e.toString()}',
      ));
    }
  }

  Future<void> _onRequestGpsPermission(
    RequestGpsPermissionEvent event,
    Emitter<MapState> emit,
  ) async {
    add(InitializeMapLocationEvent());
  }

  void _startLocationTracking() {
    _positionSubscription?.cancel();
    _positionSubscription = Geolocator.getPositionStream(
      locationSettings: const LocationSettings(accuracy: LocationAccuracy.high, distanceFilter: 5),
    ).listen((Position position) {
      add(UserLocationUpdatedEvent(
        location: LatLng(position.latitude, position.longitude),
        accuracy: position.accuracy,
        heading: position.heading,
      ));
    });
  }

  void _onUserLocationUpdated(UserLocationUpdatedEvent event, Emitter<MapState> emit) {
    if (state.isTrackingUser) {
      emit(state.copyWith(userLocation: event.location, cameraCenter: event.location, status: MapStatus.gpsReady));
    } else {
      emit(state.copyWith(userLocation: event.location, status: MapStatus.gpsReady));
    }
  }

  void _onCenterMapOnUser(CenterMapOnUserEvent event, Emitter<MapState> emit) {
    emit(state.copyWith(cameraCenter: state.userLocation, zoomLevel: 16.0, isTrackingUser: true, shouldAnimateCamera: true));
  }

  void _onChangeMapZoom(ChangeMapZoomEvent event, Emitter<MapState> emit) {
    final newZoom = (state.zoomLevel + event.zoomDelta).clamp(3.0, 18.0);
    emit(state.copyWith(zoomLevel: newZoom, shouldAnimateCamera: true));
  }

  void _onSetMapZoom(SetMapZoomEvent event, Emitter<MapState> emit) {
    emit(state.copyWith(zoomLevel: event.zoom.clamp(3.0, 18.0)));
  }

  void _onMoveMapCamera(MoveMapCameraEvent event, Emitter<MapState> emit) {
    emit(state.copyWith(cameraCenter: event.newCenter, isTrackingUser: false, shouldAnimateCamera: false));
  }

  void _onSelectReportMarker(SelectReportMarkerEvent event, Emitter<MapState> emit) {
    emit(state.copyWith(selectedReport: event.report));
  }

  void _onClearSelectedReportMarker(ClearSelectedReportMarkerEvent event, Emitter<MapState> emit) {
    emit(state.copyWith(clearSelectedReport: true));
  }

  @override
  Future<void> close() {
    _positionSubscription?.cancel();
    return super.close();
  }
}
`
  },
  {
    path: 'lib/features/maps/presentation/bloc/map_event.dart',
    name: 'map_event.dart',
    category: 'maps',
    description: 'Eventos del MapBloc: inicializar GPS, permisos, centrar cámara, zoom y selección.',
    code: `import 'package:equatable/equatable.dart';
import 'package:latlong2/latlong.dart';
import '../../../reports/domain/models/mobility_report_model.dart';

abstract class MapEvent extends Equatable {
  const MapEvent();
  @override
  List<Object?> get props => [];
}

class InitializeMapLocationEvent extends MapEvent {}
class RequestGpsPermissionEvent extends MapEvent {}
class UserLocationUpdatedEvent extends MapEvent {
  final LatLng location;
  final double? accuracy;
  final double? heading;
  const UserLocationUpdatedEvent({required this.location, this.accuracy, this.heading});
  @override
  List<Object?> get props => [location, accuracy, heading];
}
class CenterMapOnUserEvent extends MapEvent {}
class ChangeMapZoomEvent extends MapEvent {
  final double zoomDelta;
  const ChangeMapZoomEvent(this.zoomDelta);
  @override
  List<Object?> get props => [zoomDelta];
}
class SetMapZoomEvent extends MapEvent {
  final double zoom;
  const SetMapZoomEvent(this.zoom);
  @override
  List<Object?> get props => [zoom];
}
class MoveMapCameraEvent extends MapEvent {
  final LatLng newCenter;
  const MoveMapCameraEvent(this.newCenter);
  @override
  List<Object?> get props => [newCenter];
}
class SelectReportMarkerEvent extends MapEvent {
  final MobilityReportModel report;
  const SelectReportMarkerEvent(this.report);
  @override
  List<Object?> get props => [report];
}
class ClearSelectedReportMarkerEvent extends MapEvent {}
`
  },
  {
    path: 'lib/features/maps/presentation/bloc/map_state.dart',
    name: 'map_state.dart',
    category: 'maps',
    description: 'Estados del MapBloc con posición de usuario, centro de cámara, zoom y errores.',
    code: `import 'package:equatable/equatable.dart';
import 'package:latlong2/latlong.dart';
import '../../../reports/domain/models/mobility_report_model.dart';

enum MapStatus { initial, loadingGps, gpsReady, gpsServiceDisabled, permissionDenied, permissionDeniedForever, error }

class MapState extends Equatable {
  final MapStatus status;
  final LatLng userLocation;
  final LatLng cameraCenter;
  final double zoomLevel;
  final bool isTrackingUser;
  final String? errorMessage;
  final MobilityReportModel? selectedReport;
  final bool shouldAnimateCamera;

  const MapState({
    this.status = MapStatus.initial,
    this.userLocation = const LatLng(19.432608, -99.133209),
    this.cameraCenter = const LatLng(19.432608, -99.133209),
    this.zoomLevel = 15.0,
    this.isTrackingUser = true,
    this.errorMessage,
    this.selectedReport,
    this.shouldAnimateCamera = false,
  });

  bool get isGpsDisabledOrDenied =>
      status == MapStatus.gpsServiceDisabled ||
      status == MapStatus.permissionDenied ||
      status == MapStatus.permissionDeniedForever;

  MapState copyWith({
    MapStatus? status,
    LatLng? userLocation,
    LatLng? cameraCenter,
    double? zoomLevel,
    bool? isTrackingUser,
    String? errorMessage,
    MobilityReportModel? selectedReport,
    bool clearSelectedReport = false,
    bool? shouldAnimateCamera,
  }) {
    return MapState(
      status: status ?? this.status,
      userLocation: userLocation ?? this.userLocation,
      cameraCenter: cameraCenter ?? this.cameraCenter,
      zoomLevel: zoomLevel ?? this.zoomLevel,
      isTrackingUser: isTrackingUser ?? this.isTrackingUser,
      errorMessage: errorMessage,
      selectedReport: clearSelectedReport ? null : (selectedReport ?? this.selectedReport),
      shouldAnimateCamera: shouldAnimateCamera ?? false,
    );
  }

  @override
  List<Object?> get props => [status, userLocation, cameraCenter, zoomLevel, isTrackingUser, errorMessage, selectedReport, shouldAnimateCamera];
}
`
  },
  {
    path: 'lib/features/maps/presentation/screens/osm_map_view.dart',
    name: 'osm_map_view.dart',
    category: 'maps',
    description: 'Implementación de flutter_map para mostrar el mapa base OpenStreetMap con controles BLoC.',
    code: `import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../reports/domain/models/mobility_report_model.dart';
import '../bloc/map_bloc.dart';
import '../bloc/map_event.dart';
import '../bloc/map_state.dart';

class OsmMapView extends StatefulWidget {
  final List<MobilityReportModel> reports;
  final Function(MobilityReportModel)? onReportTap;
  final VoidCallback? onNewReportTap;

  const OsmMapView({
    super.key,
    this.reports = const [],
    this.onReportTap,
    this.onNewReportTap,
  });

  @override
  State<OsmMapView> createState() => _OsmMapViewState();
}

class _OsmMapViewState extends State<OsmMapView> {
  final MapController _mapController = MapController();

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<MapBloc, MapState>(
      listener: (context, state) {
        if (state.shouldAnimateCamera) {
          _mapController.move(state.cameraCenter, state.zoomLevel);
        }
      },
      builder: (context, state) {
        return Stack(
          children: [
            FlutterMap(
              mapController: _mapController,
              options: MapOptions(
                initialCenter: state.cameraCenter,
                initialZoom: state.zoomLevel,
                minZoom: 3.0,
                maxZoom: 18.0,
                onPositionChanged: (pos, hasGesture) {
                  if (hasGesture && pos.center != null) {
                    context.read<MapBloc>().add(MoveMapCameraEvent(pos.center!));
                  }
                },
              ),
              children: [
                TileLayer(
                  urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                  userAgentPackageName: 'com.moviradar.app',
                  maxZoom: 19,
                ),
                MarkerLayer(
                  markers: [
                    Marker(
                      point: state.userLocation,
                      width: 50,
                      height: 50,
                      child: Container(
                        decoration: BoxDecoration(
                          color: AppColors.primary,
                          shape: BoxShape.circle,
                          border: Border.all(color: Colors.white, width: 2.5),
                        ),
                        child: const Icon(Icons.navigation, size: 14, color: Colors.black),
                      ),
                    ),
                  ],
                ),
                const RichAttributionWidget(
                  alignment: AttributionAlignment.bottomLeft,
                  attributions: [
                    TextSourceAttribution('© OpenStreetMap contributors', prependCopyright: false),
                  ],
                ),
              ],
            ),
            Positioned(
              right: 16,
              bottom: 24,
              child: FloatingActionButton(
                backgroundColor: AppColors.surfaceDark,
                foregroundColor: AppColors.primary,
                onPressed: () => context.read<MapBloc>().add(CenterMapOnUserEvent()),
                child: const Icon(Icons.my_location),
              ),
            ),
          ],
        );
      },
    );
  }
}
`
  },
  {
    path: 'lib/features/reports/domain/models/mobility_report_model.dart',
    name: 'mobility_report_model.dart',
    category: 'reports',
    description: 'Modelo de reporte ciudadano con los 7 tipos de novedades y georreferenciación.',
    code: `import 'package:equatable/equatable.dart';

enum ReportType { accident, congestion, roadClosed, construction, stalledVehicle, hazard, other }

extension ReportTypeExtension on ReportType {
  String get displayName {
    switch (this) {
      case ReportType.accident: return 'Accidente';
      case ReportType.congestion: return 'Congestión vehicular';
      case ReportType.roadClosed: return 'Vía cerrada';
      case ReportType.construction: return 'Obras en la vía';
      case ReportType.stalledVehicle: return 'Vehículo varado';
      case ReportType.hazard: return 'Peligro / Bache';
      case ReportType.other: return 'Otro acontecimiento';
    }
  }
}

class MobilityReportModel extends Equatable {
  final String id;
  final ReportType type;
  final String title;
  final String description;
  final String locationName;
  final double latitude;
  final double longitude;
  final DateTime timestamp;
  final String authorId;
  final String authorName;
  final int confirmationsCount;

  const MobilityReportModel({
    required this.id,
    required this.type,
    required this.title,
    required this.description,
    required this.locationName,
    required this.latitude,
    required this.longitude,
    required this.timestamp,
    required this.authorId,
    required this.authorName,
    this.confirmationsCount = 1,
  });

  @override
  List<Object?> get props => [id, type, title, locationName, latitude, longitude];
}
`
  },
  {
    path: 'lib/features/home/presentation/screens/home_dashboard_screen.dart',
    name: 'home_dashboard_screen.dart',
    category: 'home',
    description: 'Pantalla principal con OpenStreetMap como protagonista y MapBloc integrado.',
    code: `import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/theme/app_theme.dart';
import '../../auth/presentation/bloc/auth_bloc.dart';
import '../../auth/presentation/bloc/auth_event.dart';
import '../../auth/presentation/screens/welcome_screen.dart';
import '../../maps/presentation/screens/osm_map_view.dart';
import '../../reports/domain/models/mobility_report_model.dart';
import '../../reports/presentation/widgets/new_report_sheet.dart';
import '../../maps/presentation/bloc/map_bloc.dart';

class HomeDashboardScreen extends StatefulWidget {
  const HomeDashboardScreen({super.key});

  @override
  State<HomeDashboardScreen> createState() => _HomeDashboardScreenState();
}

class _HomeDashboardScreenState extends State<HomeDashboardScreen> {
  int _currentTab = 1; // Mapa por defecto

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.backgroundDark,
      body: _buildCurrentTab(),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentTab,
        onDestinationSelected: (idx) => setState(() => _currentTab = idx),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.home_outlined), label: 'Inicio'),
          NavigationDestination(icon: Icon(Icons.map_outlined), label: 'Mapa'),
          NavigationDestination(icon: Icon(Icons.add_circle_outline), label: 'Reportar'),
          NavigationDestination(icon: Icon(Icons.notifications_none), label: 'Avisos'),
          NavigationDestination(icon: Icon(Icons.person_outline), label: 'Perfil'),
        ],
      ),
    );
  }

  Widget _buildCurrentTab() {
    switch (_currentTab) {
      case 0: return const Center(child: Text('Resumen Inicio'));
      case 1: return const OsmMapView();
      case 2: return const Center(child: Text('Reportar'));
      case 3: return const Center(child: Text('Avisos'));
      case 4: return const Center(child: Text('Perfil'));
      default: return const OsmMapView();
    }
  }
}
`
  },
  {
    path: 'android/app/src/main/AndroidManifest.xml',
    name: 'AndroidManifest.xml',
    category: 'android',
    description: 'Permisos de GPS (ACCESS_FINE_LOCATION, ACCESS_COARSE_LOCATION) para OpenStreetMap.',
    code: `<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.moviradar.app">

    <uses-permission android:name="android.permission.INTERNET"/>
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION"/>
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION"/>
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE"/>

    <application
        android:label="MoviRadar"
        android:name="\${applicationName}"
        android:icon="@mipmap/ic_launcher">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:launchMode="singleTop"
            android:theme="@style/LaunchTheme"
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|smallestScreenSize|locale|layoutDirection|fontScale|screenLayout|density|uiMode"
            android:hardwareAccelerated="true"
            android:windowSoftInputMode="adjustResize">
            <intent-filter>
                <action android:name="android.intent.action.MAIN"/>
                <category android:name="android.intent.category.LAUNCHER"/>
            </intent-filter>
        </activity>
    </application>
</manifest>
`
  },
  {
    path: 'FIREBASE_SETUP_GUIDE.md',
    name: 'FIREBASE_SETUP_GUIDE.md',
    category: 'config',
    description: 'Guía paso a paso para descargar google-services.json y configurar Firebase Spark (100% Gratis).',
    code: `# Guía de Configuración de Firebase para MoviRadar (Plan Gratuito Spark)

1. Ingresa a la consola: https://console.firebase.google.com/
2. Crea tu proyecto 'MoviRadar' (Plan Spark - Gratuito $0).
3. En Authentication > Sign-in method, habilita 'Correo electrónico/contraseña'.
4. Registra tu app Android con el paquete exacto: com.moviradar.app
5. Descarga google-services.json y colócalo en:
   android/app/google-services.json
6. En android/build.gradle activa:
   classpath 'com.google.gms:google-services:4.4.1'
7. En android/app/build.gradle activa:
   apply plugin: 'com.google.gms.google-services'
8. Ejecuta 'flutter pub get' y 'flutter run'.
`
  },
  {
    path: 'android/app/google-services.json.example',
    name: 'google-services.json.example',
    category: 'android',
    description: 'Plantilla de ejemplo del archivo de credenciales de Firebase para com.moviradar.app.',
    code: `{
  "project_info": {
    "project_number": "123456789012",
    "project_id": "moviradar-app",
    "storage_bucket": "moviradar-app.appspot.com"
  },
  "client": [
    {
      "client_info": {
        "mobilesdk_app_id": "1:123456789012:android:abcdef0123456789abcdef",
        "android_client_info": {
          "package_name": "com.moviradar.app"
        }
      },
      "api_key": [
        {
          "current_key": "AIzaSyEjemploReemplazarConTuClaveDeFirebaseSpark12345"
        }
      ]
    }
  ],
  "configuration_version": "1"
}`
  },
  {
    path: 'lib/firebase_options_example.dart',
    name: 'firebase_options_example.dart',
    category: 'config',
    description: 'Estructura DefaultFirebaseOptions para inicializar Firebase con FlutterFire CLI.',
    code: `import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;
import 'package:flutter/foundation.dart' show defaultTargetPlatform, TargetPlatform;

class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    if (defaultTargetPlatform == TargetPlatform.android) {
      return android;
    }
    throw UnsupportedError('Plataforma no configurada.');
  }

  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'AIzaSyEjemploReemplazarConTuClaveDeFirebaseSpark12345',
    appId: '1:123456789012:android:abcdef0123456789abcdef',
    messagingSenderId: '123456789012',
    projectId: 'moviradar-app',
    storageBucket: 'moviradar-app.appspot.com',
  );
}`
  },
  {
    path: 'lib/core/services/firestore_service.dart',
    name: 'firestore_service.dart',
    category: 'core',
    description: 'Servicio Cloud Firestore con stream en tiempo real y operaciones atómicas para reportes de movilidad (Plan Spark $0).',
    code: `import 'dart:async';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../../features/reports/domain/models/mobility_report_model.dart';

class FirestoreService {
  final FirebaseFirestore _firestore;
  static const String reportsCollection = 'mobility_reports';

  FirestoreService({FirebaseFirestore? firestore})
      : _firestore = firestore ?? FirebaseFirestore.instance;

  CollectionReference<Map<String, dynamic>> get _reportsRef =>
      _firestore.collection(reportsCollection);

  Stream<List<MobilityReportModel>> streamActiveReports({int hoursLimit = 24}) {
    final cutoffTime = DateTime.now().subtract(Duration(hours: hoursLimit));

    return _reportsRef
        .where('timestamp', isGreaterThanOrEqualTo: cutoffTime.toIso8601String())
        .orderBy('timestamp', descending: true)
        .snapshots()
        .map((snapshot) => snapshot.docs.map((doc) {
              final data = doc.data();
              data['id'] = doc.id;
              return MobilityReportModel.fromMap(data);
            }).toList());
  }

  Future<String> saveReport(MobilityReportModel report) async {
    final map = report.toMap();
    map['votersConfirm'] = [report.authorId];
    map['votersDeny'] = [];
    map['createdAt'] = FieldValue.serverTimestamp();

    if (report.id.isNotEmpty) {
      await _reportsRef.doc(report.id).set(map, SetOptions(merge: true));
      return report.id;
    } else {
      final docRef = await _reportsRef.add(map);
      await docRef.update({'id': docRef.id});
      return docRef.id;
    }
  }

  Future<bool> confirmReport({required String reportId, required String userId}) async {
    final docRef = _reportsRef.doc(reportId);
    final snap = await docRef.get();
    if (!snap.exists) return false;

    final voters = (snap.data()?['votersConfirm'] as List?) ?? [];
    if (voters.contains(userId)) return false;

    await docRef.update({
      'confirmationsCount': FieldValue.increment(1),
      'votersConfirm': FieldValue.arrayUnion([userId]),
      'votersDeny': FieldValue.arrayRemove([userId]),
    });
    return true;
  }

  Future<bool> denyReport({required String reportId, required String userId}) async {
    final docRef = _reportsRef.doc(reportId);
    final snap = await docRef.get();
    if (!snap.exists) return false;

    final voters = (snap.data()?['votersDeny'] as List?) ?? [];
    if (voters.contains(userId)) return false;

    await docRef.update({
      'denialsCount': FieldValue.increment(1),
      'votersDeny': FieldValue.arrayUnion([userId]),
      'votersConfirm': FieldValue.arrayRemove([userId]),
    });
    return true;
  }
}`
  },
  {
    path: 'lib/features/maps/domain/repositories/map_repository.dart',
    name: 'map_repository.dart',
    category: 'maps',
    description: 'Interfaz del repositorio para incidentes y marcadores sobre OpenStreetMap.',
    code: `import 'package:latlong2/latlong.dart';
import '../../../reports/domain/models/mobility_report_model.dart';

abstract class MapRepository {
  Stream<List<MobilityReportModel>> getMapIncidentsStream();
  Future<List<MobilityReportModel>> getIncidentsNearLocation({
    required LatLng center,
    double radiusKm = 15.0,
  });
  Future<String> submitIncident(MobilityReportModel report);
  Future<bool> confirmIncident({required String reportId, required String userId});
  Future<bool> denyIncident({required String reportId, required String userId});
}`
  },
  {
    path: 'lib/features/maps/data/repositories/map_repository_impl.dart',
    name: 'map_repository_impl.dart',
    category: 'maps',
    description: 'Implementación de MapRepository sincronizada con Cloud Firestore y cálculo de distancias latlong2.',
    code: `import 'dart:async';
import 'package:latlong2/latlong.dart';
import '../../../../core/services/firestore_service.dart';
import '../../../reports/domain/models/mobility_report_model.dart';
import '../../domain/repositories/map_repository.dart';

class MapRepositoryImpl implements MapRepository {
  final FirestoreService _firestoreService;
  final Distance _distanceCalculator = const Distance();

  MapRepositoryImpl({FirestoreService? firestoreService})
      : _firestoreService = firestoreService ?? FirestoreService();

  @override
  Stream<List<MobilityReportModel>> getMapIncidentsStream() {
    return _firestoreService.streamActiveReports();
  }

  @override
  Future<List<MobilityReportModel>> getIncidentsNearLocation({
    required LatLng center,
    double radiusKm = 15.0,
  }) async {
    try {
      final reports = await _firestoreService.getRecentReports(limit: 100);
      return reports.where((r) {
        final dist = _distanceCalculator.as(LengthUnit.Kilometer, center, LatLng(r.latitude, r.longitude));
        return dist <= radiusKm;
      }).toList();
    } catch (_) {
      return [];
    }
  }

  @override
  Future<String> submitIncident(MobilityReportModel report) => _firestoreService.saveReport(report);

  @override
  Future<bool> confirmIncident({required String reportId, required String userId}) =>
      _firestoreService.confirmReport(reportId: reportId, userId: userId);

  @override
  Future<bool> denyIncident({required String reportId, required String userId}) =>
      _firestoreService.denyReport(reportId: reportId, userId: userId);
}`
  },
  {
    path: 'firestore.rules',
    name: 'firestore.rules',
    category: 'config',
    description: 'Reglas de seguridad de Cloud Firestore: acceso exclusivo a usuarios autenticados y restricción de autor por UID.',
    code: `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isAuthenticated() {
      return request.auth != null;
    }

    function isAuthor(data) {
      return isAuthenticated() && (
        (data.authorId != null && data.authorId == request.auth.uid) ||
        (data.userId != null && data.userId == request.auth.uid)
      );
    }

    match /mobility_reports/{reportId} {
      allow read: if isAuthenticated();

      allow create: if isAuthenticated() && (
        (request.resource.data.authorId == request.auth.uid) ||
        (request.resource.data.userId == request.auth.uid)
      );

      allow update: if isAuthenticated() && (
        isAuthor(resource.data) ||
        (
          request.resource.data.authorId == resource.data.authorId &&
          request.resource.data.latitude == resource.data.latitude &&
          request.resource.data.longitude == resource.data.longitude
        )
      );

      allow delete: if isAuthor(resource.data);
    }

    match /users/{userId} {
      allow read: if isAuthenticated();
      allow create, update, delete: if isAuthenticated() && request.auth.uid == userId;
    }
  }
}`
  }
];

