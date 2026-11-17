import 'package:equatable/equatable.dart';

class UserModel extends Equatable {
  final String id;
  final String email;
  final String displayName;
  final String? photoUrl;
  final int reputationScore;
  final bool isVerifiedCitizen;
  final String subscriptionTier; // 'free' | 'plus_monthly'
  final DateTime createdAt;

  const UserModel({
    required this.id,
    required this.email,
    required this.displayName,
    this.photoUrl,
    this.reputationScore = 100,
    this.isVerifiedCitizen = false,
    this.subscriptionTier = 'free',
    required this.createdAt,
  });

  UserModel copyWith({
    String? id,
    String? email,
    String? displayName,
    String? photoUrl,
    int? reputationScore,
    bool? isVerifiedCitizen,
    String? subscriptionTier,
    DateTime? createdAt,
  }) {
    return UserModel(
      id: id ?? this.id,
      email: email ?? this.email,
      displayName: displayName ?? this.displayName,
      photoUrl: photoUrl ?? this.photoUrl,
      reputationScore: reputationScore ?? this.reputationScore,
      isVerifiedCitizen: isVerifiedCitizen ?? this.isVerifiedCitizen,
      subscriptionTier: subscriptionTier ?? this.subscriptionTier,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'email': email,
      'displayName': displayName,
      'photoUrl': photoUrl,
      'reputationScore': reputationScore,
      'isVerifiedCitizen': isVerifiedCitizen,
      'subscriptionTier': subscriptionTier,
      'createdAt': createdAt.toIso8601String(),
    };
  }

  factory UserModel.fromMap(Map<String, dynamic> map) {
    return UserModel(
      id: map['id'] ?? '',
      email: map['email'] ?? '',
      displayName: map['displayName'] ?? '',
      photoUrl: map['photoUrl'],
      reputationScore: map['reputationScore'] ?? 100,
      isVerifiedCitizen: map['isVerifiedCitizen'] ?? false,
      subscriptionTier: map['subscriptionTier'] ?? 'free',
      createdAt: map['createdAt'] != null
          ? DateTime.parse(map['createdAt'])
          : DateTime.now(),
    );
  }

  @override
  List<Object?> get props => [
        id,
        email,
        displayName,
        photoUrl,
        reputationScore,
        isVerifiedCitizen,
        subscriptionTier,
        createdAt,
      ];
}
