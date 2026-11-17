import 'dart:async';
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

  /// Inicializa el mapa y gestiona la obtención de coordenadas GPS actuales
  Future<void> _onInitializeMapLocation(
    InitializeMapLocationEvent event,
    Emitter<MapState> emit,
  ) async {
    emit(state.copyWith(
      status: MapStatus.loadingGps,
      errorMessage: null,
    ));

    try {
      // 1. Verificar si el servicio de localización por satélite está encendido en el dispositivo
      final serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        emit(state.copyWith(
          status: MapStatus.gpsServiceDisabled,
          errorMessage: 'El sensor GPS está desactivado. Actívalo para ubicar tu vehículo en el radar.',
        ));
        return;
      }

      // 2. Verificar permisos actuales de la aplicación
      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          emit(state.copyWith(
            status: MapStatus.permissionDenied,
            errorMessage: 'Permisos de ubicación denegados. No podemos mostrar tu posición en el mapa.',
          ));
          return;
        }
      }

      if (permission == LocationPermission.deniedForever) {
        emit(state.copyWith(
          status: MapStatus.permissionDeniedForever,
          errorMessage: 'Los permisos de ubicación fueron denegados permanentemente en los ajustes de Android.',
        ));
        return;
      }

      // 3. Obtener coordenadas GPS iniciales con alta precisión
      final position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
        timeLimit: const Duration(seconds: 15),
      );

      final userLatLng = LatLng(position.latitude, position.longitude);

      emit(state.copyWith(
        status: MapStatus.gpsReady,
        userLocation: userLatLng,
        cameraCenter: userLatLng,
        zoomLevel: 15.5,
        accuracy: position.accuracy,
        heading: position.heading,
        speed: position.speed,
        isTrackingUser: true,
        shouldAnimateCamera: true,
      ));

      // 4. Iniciar seguimiento continuo del movimiento del usuario
      _startLocationTracking();
    } on TimeoutException {
      emit(state.copyWith(
        status: MapStatus.error,
        errorMessage: 'Tiempo de espera agotado buscando señal de satélites GPS. Intenta en un espacio abierto.',
      ));
    } catch (e) {
      emit(state.copyWith(
        status: MapStatus.error,
        errorMessage: 'Error al obtener la posición GPS: ${e.toString()}',
      ));
    }
  }

  /// Manejo de la solicitud de permisos o apertura de ajustes de Android
  Future<void> _onRequestGpsPermission(
    RequestGpsPermissionEvent event,
    Emitter<MapState> emit,
  ) async {
    if (state.status == MapStatus.permissionDeniedForever) {
      // Abre directamente la pantalla de ajustes de la aplicación en Android
      await Geolocator.openAppSettings();
    } else if (state.status == MapStatus.gpsServiceDisabled) {
      // Abre los ajustes de ubicación del sistema Android
      await Geolocator.openLocationSettings();
    } else {
      add(InitializeMapLocationEvent());
    }
  }

  /// Suscripción al stream continuo de coordenadas con filtro de distancia
  void _startLocationTracking() {
    _positionSubscription?.cancel();
    const locationSettings = LocationSettings(
      accuracy: LocationAccuracy.high,
      distanceFilter: 5, // Notificar únicamente cuando el usuario se mueva al menos 5 metros
    );

    _positionSubscription = Geolocator.getPositionStream(
      locationSettings: locationSettings,
    ).listen(
      (Position position) {
        add(UserLocationUpdatedEvent(
          location: LatLng(position.latitude, position.longitude),
          accuracy: position.accuracy,
          heading: position.heading,
          speed: position.speed,
        ));
      },
      onError: (error) {
        // Manejo silencioso de pérdida momentánea de satélites
      },
    );
  }

  /// Actualización en tiempo real de coordenadas y telemetría
  void _onUserLocationUpdated(
    UserLocationUpdatedEvent event,
    Emitter<MapState> emit,
  ) {
    if (state.isTrackingUser) {
      // Si el modo seguimiento está activo, la cámara acompaña al usuario suavemente
      emit(state.copyWith(
        status: MapStatus.gpsReady,
        userLocation: event.location,
        cameraCenter: event.location,
        accuracy: event.accuracy,
        heading: event.heading,
        speed: event.speed,
      ));
    } else {
      // Si el usuario movió el mapa con el dedo, actualizamos el punto de radar sin mover la vista
      emit(state.copyWith(
        status: MapStatus.gpsReady,
        userLocation: event.location,
        accuracy: event.accuracy,
        heading: event.heading,
        speed: event.speed,
      ));
    }
  }

  /// Centrar la cámara en la posición actual del usuario
  void _onCenterMapOnUser(
    CenterMapOnUserEvent event,
    Emitter<MapState> emit,
  ) {
    emit(state.copyWith(
      cameraCenter: state.userLocation,
      zoomLevel: 16.0,
      isTrackingUser: true,
      shouldAnimateCamera: true,
    ));
  }

  /// Modificar zoom de forma gradual dentro de los límites de OpenStreetMap (3.0 a 18.0)
  void _onChangeMapZoom(
    ChangeMapZoomEvent event,
    Emitter<MapState> emit,
  ) {
    final newZoom = (state.zoomLevel + event.zoomDelta).clamp(3.0, 18.0);
    emit(state.copyWith(
      zoomLevel: newZoom,
      shouldAnimateCamera: true,
    ));
  }

  /// Fijar un nivel de zoom determinado
  void _onSetMapZoom(
    SetMapZoomEvent event,
    Emitter<MapState> emit,
  ) {
    final newZoom = event.zoom.clamp(3.0, 18.0);
    emit(state.copyWith(zoomLevel: newZoom));
  }

  /// Desplazamiento manual del mapa al arrastrar con el dedo
  void _onMoveMapCamera(
    MoveMapCameraEvent event,
    Emitter<MapState> emit,
  ) {
    emit(state.copyWith(
      cameraCenter: event.newCenter,
      isTrackingUser: false, // Pausa el seguimiento automático para permitir navegación libre
      shouldAnimateCamera: false,
    ));
  }

  /// Seleccionar un marcador de novedad ciudadana en el mapa
  void _onSelectReportMarker(
    SelectReportMarkerEvent event,
    Emitter<MapState> emit,
  ) {
    emit(state.copyWith(selectedReport: event.report));
  }

  /// Deseleccionar marcador activo
  void _onClearSelectedReportMarker(
    ClearSelectedReportMarkerEvent event,
    Emitter<MapState> emit,
  ) {
    emit(state.copyWith(clearSelectedReport: true));
  }

  @override
  Future<void> close() {
    // Liberación del hardware GPS para evitar fugas de memoria y drenaje de batería
    _positionSubscription?.cancel();
    return super.close();
  }
}
