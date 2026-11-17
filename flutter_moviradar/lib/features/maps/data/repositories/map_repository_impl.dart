import 'dart:async';
import 'package:latlong2/latlong.dart';
import '../../../../core/services/firestore_service.dart';
import '../../../reports/domain/models/mobility_report_model.dart';
import '../../domain/repositories/map_repository.dart';

/// Implementación de [MapRepository] conectada a Cloud Firestore (Plan Spark).
/// 
/// Gestiona la sincronización en tiempo real entre los documentos de Firestore
/// y los marcadores visuales del [flutter_map].
class MapRepositoryImpl implements MapRepository {
  final FirestoreService _firestoreService;
  final Distance _distanceCalculator = const Distance();

  MapRepositoryImpl({FirestoreService? firestoreService})
      : _firestoreService = firestoreService ?? FirestoreService();

  @override
  Stream<List<MobilityReportModel>> getMapIncidentsStream() {
    // Escucha en tiempo real los reportes de las últimas 24 horas
    return _firestoreService.streamActiveReports();
  }

  @override
  Future<List<MobilityReportModel>> getIncidentsNearLocation({
    required LatLng center,
    double radiusKm = 15.0,
  }) async {
    try {
      // 1. Obtiene los reportes recientes desde Cloud Firestore
      final allReports = await _firestoreService.getRecentReports(limit: 100);

      // 2. Filtra localmente por radio euclidiano usando latlong2 (Ahorro de lecturas en Spark)
      return allReports.where((report) {
        final reportLocation = LatLng(report.latitude, report.longitude);
        final distance = _distanceCalculator.as(
          LengthUnit.Kilometer,
          center,
          reportLocation,
        );
        return distance <= radiusKm;
      }).toList();
    } catch (e) {
      // En caso de modo sin conexión o error de red, devuelve lista vacía sin romper el mapa
      return [];
    }
  }

  @override
  Future<String> submitIncident(MobilityReportModel report) async {
    return await _firestoreService.saveReport(report);
  }

  @override
  Future<bool> confirmIncident({
    required String reportId,
    required String userId,
  }) async {
    return await _firestoreService.confirmReport(
      reportId: reportId,
      userId: userId,
    );
  }

  @override
  Future<bool> denyIncident({
    required String reportId,
    required String userId,
  }) async {
    return await _firestoreService.denyReport(
      reportId: reportId,
      userId: userId,
    );
  }
}
