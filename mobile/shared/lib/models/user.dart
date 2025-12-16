import 'package:json_annotation/json_annotation.dart';
import 'package:equatable/equatable.dart';

part 'user.g.dart';

@JsonSerializable()
class User extends Equatable {
  final String id;
  final String email;
  final String firstName;
  final String lastName;
  final String? phone;
  final String role;
  final String branchId;
  final String? departmentId;
  final bool isActive;
  final DateTime createdAt;
  final DateTime? updatedAt;

  const User({
    required this.id,
    required this.email,
    required this.firstName,
    required this.lastName,
    this.phone,
    required this.role,
    required this.branchId,
    this.departmentId,
    required this.isActive,
    required this.createdAt,
    this.updatedAt,
  });

  factory User.fromJson(Map<String, dynamic> json) => _$UserFromJson(json);
  Map<String, dynamic> toJson() => _$UserToJson(this);

  String get fullName => '$firstName $lastName';

  @override
  List<Object?> get props => [
        id,
        email,
        firstName,
        lastName,
        phone,
        role,
        branchId,
        departmentId,
        isActive,
        createdAt,
        updatedAt,
      ];
}