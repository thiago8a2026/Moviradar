import '../models/mobility_report_model.dart';

abstract class ReportsRepository {
  /// Obtener flujo de reportes en tiempo real
  Stream<List<MobilityReportModel>> getReportsStream();

  /// Obtener reportes cercanos a unas coordenadas GPS
  Future<List<MobilityReportModel>> getNearbyReports({
    required double latitude,
    required double longitude,
    double radiusKm = 10.0,
  });

  /// Crear un nuevo reporte ciudadano
  Future<void> submitReport(MobilityReportModel report);

  /// Confirmar la veracidad de un reporte existente
  Future<void> confirmReport(String reportId, String userId);

  /// Denegar un reporte (marcar como resuelto o falso)
  Future<void> denyReport(String reportId, String userId);
}
