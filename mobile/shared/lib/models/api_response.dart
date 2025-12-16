import 'package:json_annotation/json_annotation.dart';
import 'package:equatable/equatable.dart';

part 'api_response.g.dart';

@JsonSerializable(genericArgumentFactories: true)
class ApiResponse<T> extends Equatable {
  final bool success;
  final T? data;
  final String? message;
  final String? error;

  const ApiResponse({
    required this.success,
    this.data,
    this.message,
    this.error,
  });

  factory ApiResponse.fromJson(
    Map<String, dynamic> json,
    T Function(Object? json) fromJsonT,
  ) =>
      _$ApiResponseFromJson(json, fromJsonT);

  Map<String, dynamic> toJson(Object Function(T value) toJsonT) =>
      _$ApiResponseToJson(this, toJsonT);

  @override
  List<Object?> get props => [success, data, message, error];
}