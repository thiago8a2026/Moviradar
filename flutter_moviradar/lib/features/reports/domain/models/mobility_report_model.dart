import 'package:equatable/equatable.dart';

enum ReportType {
  accident,
  congestion,
  roadClosed,
  construction,
  stalledVehicle,
  hazard,
  other,
}

extension ReportTypeExtension on ReportType {
  String get displayName {
    switch (this) {
      case ReportType.accident:
        return 'Accidente';
      case ReportType.congestion:
        return 'Congestión vehicular';
      case ReportType.roadClosed:
        return 'Vía cerrada';
      case ReportType.construction:
        return 'Obras en la vía';
      case ReportType.stalledVehicle:
        return 'Vehículo varado';
      case ReportType.hazard:
        return 'Peligro / Bache';
      case ReportType.other:
        return 'Otro acontecimiento';
    }
  }

  String get iconKey {
    switch (this) {
      case ReportType.accident:
        return 'warning';
      case ReportType.congestion:
        return 'traffic';
      case ReportType.roadClosed:
        return 'block';
      case ReportType.construction:
        return 'construction';
      case ReportType.stalledVehicle:
        return 'car_crash';
      case ReportType.hazard:
        return 'error';
      case ReportType.other:
        return 'info';
    }
  }
}

class MobilityReportModel extends Equatable {
  final String id;
  final ReportType type;
  final String title;
  final String description;
  final String locationName;
  final double latitude;
  final double longitude;
  final DateTime timestamp;
  final String authorId;
  final String authorName;
  final int confirmationsCount;
  final int denialsCount;
  final String? photoUrl;
  final bool isVerified;

  const MobilityReportModel({
    required this.id,
    required this.type,
    required this.title,
    required this.description,
    required this.locationName,
    required this.latitude,
    required this.longitude,
    required this.timestamp,
    required this.authorId,
    required this.authorName,
    this.confirmationsCount = 1,
    this.denialsCount = 0,
    this.photoUrl,
    this.isVerified = false,
  });

  MobilityReportModel copyWith({
    String? id,
    ReportType? type,
    String? title,
    String? description,
    String? locationName,
    double? latitude,
    double? longitude,
    DateTime? timestamp,
    String? authorId,
    String? authorName,
    int? confirmationsCount,
    int? denialsCount,
    String? photoUrl,
    bool? isVerified,
  }) {
    return MobilityReportModel(
      id: id ?? this.id,
      type: type ?? this.type,
      title: title ?? this.title,
      description: description ?? this.description,
      locationName: locationName ?? this.locationName,
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
      timestamp: timestamp ?? this.timestamp,
      authorId: authorId ?? this.authorId,
      authorName: authorName ?? this.authorName,
      confirmationsCount: confirmationsCount ?? this.confirmationsCount,
      denialsCount: denialsCount ?? this.denialsCount,
      photoUrl: photoUrl ?? this.photoUrl,
      isVerified: isVerified ?? this.isVerified,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'type': type.name,
      'title': title,
      'description': description,
      'locationName': locationName,
      'latitude': latitude,
      'longitude': longitude,
      'timestamp': timestamp.toIso8601String(),
      'authorId': authorId,
      'authorName': authorName,
      'confirmationsCount': confirmationsCount,
      'denialsCount': denialsCount,
      'photoUrl': photoUrl,
      'isVerified': isVerified,
    };
  }

  factory MobilityReportModel.fromMap(Map<String, dynamic> map) {
    return MobilityReportModel(
      id: map['id'] ?? '',
      type: ReportType.values.firstWhere(
        (e) => e.name == map['type'],
        orElse: () => ReportType.other,
      ),
      title: map['title'] ?? '',
      description: map['description'] ?? '',
      locationName: map['locationName'] ?? '',
      latitude: (map['latitude'] as num?)?.toDouble() ?? 0.0,
      longitude: (map['longitude'] as num?)?.toDouble() ?? 0.0,
      timestamp: map['timestamp'] != null
          ? DateTime.parse(map['timestamp'])
          : DateTime.now(),
      authorId: map['authorId'] ?? '',
      authorName: map['authorName'] ?? 'Ciudadano',
      confirmationsCount: map['confirmationsCount'] ?? 1,
      denialsCount: map['denialsCount'] ?? 0,
      photoUrl: map['photoUrl'],
      isVerified: map['isVerified'] ?? false,
    );
  }

  @override
  List<Object?> get props => [
        id,
        type,
        title,
        description,
        locationName,
        latitude,
        longitude,
        timestamp,
        authorId,
        authorName,
        confirmationsCount,
        denialsCount,
        photoUrl,
        isVerified,
      ];
}
