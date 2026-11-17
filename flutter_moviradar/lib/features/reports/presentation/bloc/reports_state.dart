import 'package:equatable/equatable.dart';
import '../../domain/models/mobility_report_model.dart';

enum ReportsStatus { initial, loading, loaded, submitting, success, error }

class ReportsState extends Equatable {
  final ReportsStatus status;
  final List<MobilityReportModel> reports;
  final String? errorMessage;
  final String? successMessage;

  const ReportsState({
    this.status = ReportsStatus.initial,
    this.reports = const [],
    this.errorMessage,
    this.successMessage,
  });

  ReportsState copyWith({
    ReportsStatus? status,
    List<MobilityReportModel>? reports,
    String? errorMessage,
    String? successMessage,
  }) {
    return ReportsState(
      status: status ?? this.status,
      reports: reports ?? this.reports,
      errorMessage: errorMessage,
      successMessage: successMessage,
    );
  }

  @override
  List<Object?> get props => [status, reports, errorMessage, successMessage];
}
