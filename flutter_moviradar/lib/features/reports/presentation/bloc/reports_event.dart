import 'package:equatable/equatable.dart';
import '../../domain/models/mobility_report_model.dart';

abstract class ReportsEvent extends Equatable {
  const ReportsEvent();

  @override
  List<Object?> get props => [];
}

class LoadReportsEvent extends ReportsEvent {
  final double? latitude;
  final double? longitude;

  const LoadReportsEvent({this.latitude, this.longitude});

  @override
  List<Object?> get props => [latitude, longitude];
}

class CreateReportEvent extends ReportsEvent {
  final ReportType type;
  final String title;
  final String description;
  final String locationName;
  final double latitude;
  final double longitude;
  final String authorId;
  final String authorName;
  final String? photoUrl;

  const CreateReportEvent({
    required this.type,
    required this.title,
    required this.description,
    required this.locationName,
    required this.latitude,
    required this.longitude,
    required this.authorId,
    required this.authorName,
    this.photoUrl,
  });

  @override
  List<Object?> get props => [
        type,
        title,
        description,
        locationName,
        latitude,
        longitude,
        authorId,
        authorName,
        photoUrl,
      ];
}

class ConfirmReportEvent extends ReportsEvent {
  final String reportId;
  final String userId;

  const ConfirmReportEvent({required this.reportId, required this.userId});

  @override
  List<Object?> get props => [reportId, userId];
}

class DenyReportEvent extends ReportsEvent {
  final String reportId;
  final String userId;

  const DenyReportEvent({required this.reportId, required this.userId});

  @override
  List<Object?> get props => [reportId, userId];
}
