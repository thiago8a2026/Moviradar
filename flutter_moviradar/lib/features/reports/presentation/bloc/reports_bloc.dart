import 'dart:async';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../domain/models/mobility_report_model.dart';
import '../../domain/repositories/reports_repository.dart';
import 'reports_event.dart';
import 'reports_state.dart';

class ReportsBloc extends Bloc<ReportsEvent, ReportsState> {
  final ReportsRepository reportsRepository;
  StreamSubscription<List<MobilityReportModel>>? _reportsSubscription;

  ReportsBloc({required this.reportsRepository}) : super(const ReportsState()) {
    on<LoadReportsEvent>(_onLoadReports);
    on<CreateReportEvent>(_onCreateReport);
    on<ConfirmReportEvent>(_onConfirmReport);
    on<DenyReportEvent>(_onDenyReport);

    // Escuchar el flujo de reportes en tiempo real
    _reportsSubscription = reportsRepository.getReportsStream().listen((reports) {
      add(LoadReportsEvent());
    });
  }

  Future<void> _onLoadReports(
    LoadReportsEvent event,
    Emitter<ReportsState> emit,
  ) async {
    emit(state.copyWith(status: ReportsStatus.loading));
    try {
      final reports = await reportsRepository.getNearbyReports(
        latitude: event.latitude ?? 0.0,
        longitude: event.longitude ?? 0.0,
      );
      emit(state.copyWith(
        status: ReportsStatus.loaded,
        reports: reports,
      ));
    } catch (e) {
      emit(state.copyWith(
        status: ReportsStatus.error,
        errorMessage: 'Error al cargar los reportes de movilidad: ${e.toString()}',
      ));
    }
  }

  Future<void> _onCreateReport(
    CreateReportEvent event,
    Emitter<ReportsState> emit,
  ) async {
    if (event.title.trim().isEmpty) {
      emit(state.copyWith(
        status: ReportsStatus.error,
        errorMessage: 'Por favor ingresa un título para la novedad.',
      ));
      return;
    }

    emit(state.copyWith(status: ReportsStatus.submitting));
    try {
      final newReport = MobilityReportModel(
        id: 'rep_${DateTime.now().millisecondsSinceEpoch}',
        type: event.type,
        title: event.title.trim(),
        description: event.description.trim(),
        locationName: event.locationName.trim(),
        latitude: event.latitude,
        longitude: event.longitude,
        timestamp: DateTime.now(),
        authorId: event.authorId,
        authorName: event.authorName,
        photoUrl: event.photoUrl,
        confirmationsCount: 1,
      );

      await reportsRepository.submitReport(newReport);
      emit(state.copyWith(
        status: ReportsStatus.success,
        successMessage: 'Novedad de movilidad registrada con éxito en el radar.',
      ));
    } catch (e) {
      emit(state.copyWith(
        status: ReportsStatus.error,
        errorMessage: 'Error al registrar el reporte: ${e.toString()}',
      ));
    }
  }

  Future<void> _onConfirmReport(
    ConfirmReportEvent event,
    Emitter<ReportsState> emit,
  ) async {
    try {
      await reportsRepository.confirmReport(event.reportId, event.userId);
    } catch (e) {
      emit(state.copyWith(
        status: ReportsStatus.error,
        errorMessage: 'No se pudo confirmar el reporte.',
      ));
    }
  }

  Future<void> _onDenyReport(
    DenyReportEvent event,
    Emitter<ReportsState> emit,
  ) async {
    try {
      await reportsRepository.denyReport(event.reportId, event.userId);
    } catch (e) {
      emit(state.copyWith(
        status: ReportsStatus.error,
        errorMessage: 'No se pudo reportar como inactivo.',
      ));
    }
  }

  @override
  Future<void> close() {
    _reportsSubscription?.cancel();
    return super.close();
  }
}
