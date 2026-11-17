import 'dart:async';
import '../../../../core/services/firestore_service.dart';
import '../../domain/models/mobility_report_model.dart';
import '../../domain/repositories/reports_repository.dart';

/// Implementación de [ReportsRepository] respaldada por [FirestoreService] (Plan Spark - Gratuito).
class ReportsRepositoryImpl implements ReportsRepository {
  final FirestoreService _firestoreService;
  final List<MobilityReportModel> _inMemoryFallbackReports = [];
  final StreamController<List<MobilityReportModel>> _fallbackController =
      StreamController<List<MobilityReportModel>>.broadcast();

  ReportsRepositoryImpl({FirestoreService? firestoreService})
      : _firestoreService = firestoreService ?? FirestoreService();

  @override
  Stream<List<MobilityReportModel>> getReportsStream() {
    try {
      return _firestoreService.streamActiveReports();
    } catch (_) {
      return _fallbackController.stream;
    }
  }

  @override
  Future<List<MobilityReportModel>> getNearbyReports({
    required double latitude,
    required double longitude,
    double radiusKm = 10.0,
  }) async {
    try {
      final reports = await _firestoreService.getRecentReports();
      return reports;
    } catch (_) {
      return List.unmodifiable(_inMemoryFallbackReports);
    }
  }

  @override
  Future<void> submitReport(MobilityReportModel report) async {
    try {
      await _firestoreService.saveReport(report);
    } catch (_) {
      // Fallback local en caso de desconexión
      _inMemoryFallbackReports.insert(0, report);
      _fallbackController.add(List.unmodifiable(_inMemoryFallbackReports));
    }
  }

  @override
  Future<void> confirmReport(String reportId, String userId) async {
    try {
      await _firestoreService.confirmReport(
        reportId: reportId,
        userId: userId,
      );
    } catch (_) {
      final index = _inMemoryFallbackReports.indexWhere((r) => r.id == reportId);
      if (index != -1) {
        final current = _inMemoryFallbackReports[index];
        _inMemoryFallbackReports[index] = current.copyWith(
          confirmationsCount: current.confirmationsCount + 1,
        );
        _fallbackController.add(List.unmodifiable(_inMemoryFallbackReports));
      }
    }
  }

  @override
  Future<void> denyReport(String reportId, String userId) async {
    try {
      await _firestoreService.denyReport(
        reportId: reportId,
        userId: userId,
      );
    } catch (_) {
      final index = _inMemoryFallbackReports.indexWhere((r) => r.id == reportId);
      if (index != -1) {
        final current = _inMemoryFallbackReports[index];
        _inMemoryFallbackReports[index] = current.copyWith(
          denialsCount: current.denialsCount + 1,
        );
        _fallbackController.add(List.unmodifiable(_inMemoryFallbackReports));
      }
    }
  }
}
