import 'package:equatable/equatable.dart';
import 'package:latlong2/latlong.dart';
import '../../../reports/domain/models/mobility_report_model.dart';

abstract class MapEvent extends Equatable {
  const MapEvent();

  @override
  List<Object?> get props => [];
}

/// Disparado al montar la pantalla para inicializar el mapa y solicitar la posición GPS
class InitializeMapLocationEvent extends MapEvent {}

/// Solicitar permisos de GPS del dispositivo cuando el usuario pulsa "Reintentar" o "Activar"
class RequestGpsPermissionEvent extends MapEvent {}

/// Actualización continua de coordenadas GPS emitida por el stream del hardware
class UserLocationUpdatedEvent extends MapEvent {
  final LatLng location;
  final double? accuracy;
  final double? heading;
  final double? speed;

  const UserLocationUpdatedEvent({
    required this.location,
    this.accuracy,
    this.heading,
    this.speed,
  });

  @override
  List<Object?> get props => [location, accuracy, heading, speed];
}

/// Centrar la cámara de OpenStreetMap en la posición física actual del usuario
class CenterMapOnUserEvent extends MapEvent {}

/// Modificar el nivel de zoom de forma relativa (+1.0 o -1.0)
class ChangeMapZoomEvent extends MapEvent {
  final double zoomDelta;

  const ChangeMapZoomEvent(this.zoomDelta);

  @override
  List<Object?> get props => [zoomDelta];
}

/// Fijar un nivel de zoom absoluto (entre 3.0 y 18.0)
class SetMapZoomEvent extends MapEvent {
  final double zoom;

  const SetMapZoomEvent(this.zoom);

  @override
  List<Object?> get props => [zoom];
}

/// Mover manualmente la cámara del mapa al arrastrar con el dedo
class MoveMapCameraEvent extends MapEvent {
  final LatLng newCenter;

  const MoveMapCameraEvent(this.newCenter);

  @override
  List<Object?> get props => [newCenter];
}

/// Seleccionar un marcador de novedad ciudadana en el mapa para ver sus detalles
class SelectReportMarkerEvent extends MapEvent {
  final MobilityReportModel report;

  const SelectReportMarkerEvent(this.report);

  @override
  List<Object?> get props => [report];
}

/// Limpiar o cerrar la tarjeta de detalle del marcador seleccionado
class ClearSelectedReportMarkerEvent extends MapEvent {}
