import 'package:json_annotation/json_annotation.dart';
import 'package:equatable/equatable.dart';

part 'measurement.g.dart';

@JsonSerializable()
class SiteMeasurement extends Equatable {
  final String id;
  final String leadId;
  final String? customerId;
  final String measurementType; // 'DOOR', 'WINDOW', 'FRAME'
  final double width;
  final double height;
  final double? depth;
  final String unit; // 'MM', 'CM', 'INCH'
  final double latitude;
  final double longitude;
  final String address;
  final List<String> photos;
  final String? notes;
  final Map<String, dynamic>? specifications; // Additional measurements
  final String measuredBy;
  final DateTime measuredAt;
  final bool isSynced;

  const SiteMeasurement({
    required this.id,
    required this.leadId,
    this.customerId,
    required this.measurementType,
    required this.width,
    required this.height,
    this.depth,
    required this.unit,
    required this.latitude,
    required this.longitude,
    required this.address,
    required this.photos,
    this.notes,
    this.specifications,
    required this.measuredBy,
    required this.measuredAt,
    this.isSynced = false,
  });

  factory SiteMeasurement.fromJson(Map<String, dynamic> json) => _$SiteMeasurementFromJson(json);
  Map<String, dynamic> toJson() => _$SiteMeasurementToJson(this);

  SiteMeasurement copyWith({
    String? id,
    String? leadId,
    String? customerId,
    String? measurementType,
    double? width,
    double? height,
    double? depth,
    String? unit,
    double? latitude,
    double? longitude,
    String? address,
    List<String>? photos,
    String? notes,
    Map<String, dynamic>? specifications,
    String? measuredBy,
    DateTime? measuredAt,
    bool? isSynced,
  }) {
    return SiteMeasurement(
      id: id ?? this.id,
      leadId: leadId ?? this.leadId,
      customerId: customerId ?? this.customerId,
      measurementType: measurementType ?? this.measurementType,
      width: width ?? this.width,
      height: height ?? this.height,
      depth: depth ?? this.depth,
      unit: unit ?? this.unit,
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
      address: address ?? this.address,
      photos: photos ?? this.photos,
      notes: notes ?? this.notes,
      specifications: specifications ?? this.specifications,
      measuredBy: measuredBy ?? this.measuredBy,
      measuredAt: measuredAt ?? this.measuredAt,
      isSynced: isSynced ?? this.isSynced,
    );
  }

  @override
  List<Object?> get props => [
        id,
        leadId,
        customerId,
        measurementType,
        width,
        height,
        depth,
        unit,
        latitude,
        longitude,
        address,
        photos,
        notes,
        specifications,
        measuredBy,
        measuredAt,
        isSynced,
      ];
}