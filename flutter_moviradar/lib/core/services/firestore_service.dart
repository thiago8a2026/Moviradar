import 'dart:async';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../../features/reports/domain/models/mobility_report_model.dart';

/// Servicio centralizado de Cloud Firestore para MoviRadar.
/// 
/// Diseñado para operar en el **Plan Gratuito Spark** de Firebase ($0/mes),
/// optimizando lecturas y escrituras mediante caché local y filtros de fecha.
class FirestoreService {
  final FirebaseFirestore _firestore;

  static const String reportsCollection = 'mobility_reports';
  static const String usersCollection = 'users';

  FirestoreService({FirebaseFirestore? firestore})
      : _firestore = firestore ?? FirebaseFirestore.instance;

  /// Referencia a la colección de reportes de movilidad
  CollectionReference<Map<String, dynamic>> get _reportsRef =>
      _firestore.collection(reportsCollection);

  /// Obtiene un flujo en tiempo real (Stream) de los reportes ciudadanos activos.
  /// 
  /// Filtra automáticamente reportes de las últimas 24 horas y los ordena
  /// de forma descendente por marca de tiempo para no saturar el mapa ni
  /// consumir lecturas innecesarias en el Plan Spark.
  Stream<List<MobilityReportModel>> streamActiveReports({int hoursLimit = 24}) {
    final cutoffTime = DateTime.now().subtract(Duration(hours: hoursLimit));

    return _reportsRef
        .where('timestamp', isGreaterThanOrEqualTo: cutoffTime.toIso8601String())
        .orderBy('timestamp', descending: true)
        .snapshots()
        .map((snapshot) {
      return snapshot.docs.map((doc) {
        final data = doc.data();
        data['id'] = doc.id; // Garantiza consistencia con el ID de Firestore
        return MobilityReportModel.fromMap(data);
      }).toList();
    });
  }

  /// Consulta puntual de reportes (Future) con límite de resultados
  Future<List<MobilityReportModel>> getRecentReports({int limit = 50}) async {
    try {
      final snapshot = await _reportsRef
          .orderBy('timestamp', descending: true)
          .limit(limit)
          .get(const GetOptions(source: Source.serverAndCache));

      return snapshot.docs.map((doc) {
        final data = doc.data();
        data['id'] = doc.id;
        return MobilityReportModel.fromMap(data);
      }).toList();
    } catch (e) {
      throw Exception('Error al obtener reportes desde Firestore: $e');
    }
  }

  /// Guarda un nuevo reporte ciudadano en Cloud Firestore.
  /// 
  /// Si el reporte no tiene ID asignado, Firestore generará uno automáticamente.
  Future<String> saveReport(MobilityReportModel report) async {
    try {
      final reportMap = report.toMap();
      
      // Inicializar arrays para control de votos comunitarios y evitar spam
      reportMap['votersConfirm'] = [report.authorId];
      reportMap['votersDeny'] = [];
      reportMap['createdAt'] = FieldValue.serverTimestamp();

      if (report.id.isNotEmpty) {
        await _reportsRef.doc(report.id).set(reportMap, SetOptions(merge: true));
        return report.id;
      } else {
        final docRef = await _reportsRef.add(reportMap);
        // Actualizar el ID interno del documento
        await docRef.update({'id': docRef.id});
        return docRef.id;
      }
    } catch (e) {
      throw Exception('Error al publicar el reporte en Firestore: $e');
    }
  }

  /// Confirma un reporte ciudadano sumando +1 e impidiendo votos duplicados.
  /// 
  /// Utiliza operaciones atómicas [FieldValue.increment] y [FieldValue.arrayUnion]
  /// garantizando que ningún usuario confirme dos veces el mismo reporte.
  Future<bool> confirmReport({
    required String reportId,
    required String userId,
  }) async {
    try {
      final docRef = _reportsRef.doc(reportId);
      final docSnapshot = await docRef.get();

      if (!docSnapshot.exists) {
        throw Exception('El reporte ya no existe o fue retirado.');
      }

      final data = docSnapshot.data() ?? {};
      final List<dynamic> votersConfirm = data['votersConfirm'] ?? [];

      // Si el usuario ya votó, no duplicar el conteo
      if (votersConfirm.contains(userId)) {
        return false;
      }

      await docRef.update({
        'confirmationsCount': FieldValue.increment(1),
        'votersConfirm': FieldValue.arrayUnion([userId]),
        'votersDeny': FieldValue.arrayRemove([userId]), // Si antes había denegado
      });

      return true;
    } catch (e) {
      throw Exception('Error al confirmar reporte: $e');
    }
  }

  /// Deniega o descarta un reporte ciudadano (por ejemplo, si la vía ya fue despejada).
  Future<bool> denyReport({
    required String reportId,
    required String userId,
  }) async {
    try {
      final docRef = _reportsRef.doc(reportId);
      final docSnapshot = await docRef.get();

      if (!docSnapshot.exists) {
        throw Exception('El reporte no existe.');
      }

      final data = docSnapshot.data() ?? {};
      final List<dynamic> votersDeny = data['votersDeny'] ?? [];

      if (votersDeny.contains(userId)) {
        return false;
      }

      await docRef.update({
        'denialsCount': FieldValue.increment(1),
        'votersDeny': FieldValue.arrayUnion([userId]),
        'votersConfirm': FieldValue.arrayRemove([userId]),
      });

      return true;
    } catch (e) {
      throw Exception('Error al denegar reporte: $e');
    }
  }

  /// Elimina un reporte (solo permitido para el autor o administradores)
  Future<void> deleteReport(String reportId) async {
    try {
      await _reportsRef.doc(reportId).delete();
    } catch (e) {
      throw Exception('Error al eliminar reporte: $e');
    }
  }
}
