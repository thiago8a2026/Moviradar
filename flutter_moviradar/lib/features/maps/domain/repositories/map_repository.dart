import 'package:latlong2/latlong.dart';
import '../../../reports/domain/models/mobility_report_model.dart';

/// Contrato de repositorio para la gestión de incidentes y marcadores
/// en la pantalla del mapa principal de MoviRadar.
abstract class MapRepository {
  /// Obtiene un flujo en tiempo real (Stream) de los incidentes que deben
  /// mostrarse como marcadores visuales sobre el mapa base de OpenStreetMap.
  Stream<List<MobilityReportModel>> getMapIncidentsStream();

  /// Obtiene incidentes dentro de un radio específico (en kilómetros)
  /// alrededor de las coordenadas GPS del usuario.
  Future<List<MobilityReportModel>> getIncidentsNearLocation({
    required LatLng center,
    double radiusKm = 15.0,
  });

  /// Registra un nuevo reporte ciudadano originado desde la interfaz del mapa.
  Future<String> submitIncident(MobilityReportModel report);

  /// Registra el voto de confirmación de un ciudadano para un incidente del mapa.
  Future<bool> confirmIncident({
    required String reportId,
    required String userId,
  });

  /// Registra el voto de desacreditación o reporte de vía libre.
  Future<bool> denyIncident({
    required String reportId,
    required String userId,
  });
}
