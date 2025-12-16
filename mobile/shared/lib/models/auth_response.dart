import 'package:json_annotation/json_annotation.dart';
import 'package:equatable/equatable.dart';
import 'user.dart';

part 'auth_response.g.dart';

@JsonSerializable()
class AuthResponse extends Equatable {
  final bool success;
  final String? token;
  final User? user;
  final String? message;

  const AuthResponse({
    required this.success,
    this.token,
    this.user,
    this.message,
  });

  factory AuthResponse.fromJson(Map<String, dynamic> json) =>
      _$AuthResponseFromJson(json);
  Map<String, dynamic> toJson() => _$AuthResponseToJson(this);

  @override
  List<Object?> get props => [success, token, user, message];
}