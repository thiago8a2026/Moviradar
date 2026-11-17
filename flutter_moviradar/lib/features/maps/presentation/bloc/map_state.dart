import 'package:equatable/equatable.dart';
import 'package:latlong2/latlong.dart';
import '../../../reports/domain/models/mobility_report_model.dart';

/// Enumeración detallada de los estados del mapa y del hardware GPS
enum MapStatus {
  initial,
  loadingGps,
  gpsReady,
  gpsServiceDisabled,
  permissionDenied,
  permissionDeniedForever,
  error,
}

class MapState extends Equatable {
  final MapStatus status;
  final LatLng userLocation;
  final LatLng cameraCenter;
  final double zoomLevel;
  final double? accuracy;
  final double? heading;
  final double? speed;
  final bool isTrackingUser;
  final String? errorMessage;
  final MobilityReportModel? selectedReport;
  final bool shouldAnimateCamera;

  const MapState({
    this.status = MapStatus.initial,
    this.userLocation = const LatLng(19.432608, -99.133209), // Centro por defecto (ej. CDMX)
    this.cameraCenter = const LatLng(19.432608, -99.133209),
    this.zoomLevel = 15.0,
    this.accuracy,
    this.heading,
    this.speed,
    this.isTrackingUser = true,
    this.errorMessage,
    this.selectedReport,
    this.shouldAnimateCamera = false,
  });

  /// Indica si el sensor GPS está obteniendo la ubicación por primera vez
  bool get isLoadingGps => status == MapStatus.loadingGps || status == MapStatus.initial;

  /// Indica si el mapa cuenta con una posición satelital válida y precisa
  bool get hasValidGps =>
      status == MapStatus.gpsReady &&
      userLocation.latitude != 0.0 &&
      userLocation.longitude != 0.0;

  /// Indica si el servicio de GPS está apagado o no cuenta con permisos
  bool get isGpsDisabledOrDenied =>
      status == MapStatus.gpsServiceDisabled ||
      status == MapStatus.permissionDenied ||
      status == MapStatus.permissionDeniedForever;

  /// Indica si se puede solicitar nuevamente el permiso mediante diálogo del sistema
  bool get canRequestPermission => status == MapStatus.permissionDenied;

  /// Indica si el permiso fue denegado permanentemente y requiere ir a ajustes de Android
  bool get requiresAppAjustes => status == MapStatus.permissionDeniedForever;

  MapState copyWith({
    MapStatus? status,
    LatLng? userLocation,
    LatLng? cameraCenter,
    double? zoomLevel,
    double? accuracy,
    double? heading,
    double? speed,
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
      accuracy: accuracy ?? this.accuracy,
      heading: heading ?? this.heading,
      speed: speed ?? this.speed,
      isTrackingUser: isTrackingUser ?? this.isTrackingUser,
      errorMessage: errorMessage,
      selectedReport: clearSelectedReport ? null : (selectedReport ?? this.selectedReport),
      shouldAnimateCamera: shouldAnimateCamera ?? false,
    );
  }

  @override
  List<Object?> get props => [
        status,
        userLocation,
        cameraCenter,
        zoomLevel,
        accuracy,
        heading,
        speed,
        isTrackingUser,
        errorMessage,
        selectedReport,
        shouldAnimateCamera,
      ];
}
