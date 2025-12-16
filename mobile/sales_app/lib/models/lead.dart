import 'package:json_annotation/json_annotation.dart';
import 'package:equatable/equatable.dart';

part 'lead.g.dart';

@JsonSerializable()
class Lead extends Equatable {
  final String id;
  final String? customerId;
  final String customerName;
  final String? customerPhone;
  final String? customerEmail;
  final String source; // 'META', 'GOOGLE', 'MANUAL', 'REFERRAL'
  final String? sourceId; // External lead ID from Meta/Google
  final String status; // 'NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'LOST'
  final String? address;
  final double? latitude;
  final double? longitude;
  final String? notes;
  final String assignedTo;
  final DateTime createdAt;
  final DateTime? updatedAt;
  final DateTime? followUpDate;
  final Map<String, dynamic>? metadata; // Additional source-specific data

  const Lead({
    required this.id,
    this.customerId,
    required this.customerName,
    this.customerPhone,
    this.customerEmail,
    required this.source,
    this.sourceId,
    required this.status,
    this.address,
    this.latitude,
    this.longitude,
    this.notes,
    required this.assignedTo,
    required this.createdAt,
    this.updatedAt,
    this.followUpDate,
    this.metadata,
  });

  factory Lead.fromJson(Map<String, dynamic> json) => _$LeadFromJson(json);
  Map<String, dynamic> toJson() => _$LeadToJson(this);

  Lead copyWith({
    String? id,
    String? customerId,
    String? customerName,
    String? customerPhone,
    String? customerEmail,
    String? source,
    String? sourceId,
    String? status,
    String? address,
    double? latitude,
    double? longitude,
    String? notes,
    String? assignedTo,
    DateTime? createdAt,
    DateTime? updatedAt,
    DateTime? followUpDate,
    Map<String, dynamic>? metadata,
  }) {
    return Lead(
      id: id ?? this.id,
      customerId: customerId ?? this.customerId,
      customerName: customerName ?? this.customerName,
      customerPhone: customerPhone ?? this.customerPhone,
      customerEmail: customerEmail ?? this.customerEmail,
      source: source ?? this.source,
      sourceId: sourceId ?? this.sourceId,
      status: status ?? this.status,
      address: address ?? this.address,
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
      notes: notes ?? this.notes,
      assignedTo: assignedTo ?? this.assignedTo,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      followUpDate: followUpDate ?? this.followUpDate,
      metadata: metadata ?? this.metadata,
    );
  }

  @override
  List<Object?> get props => [
        id,
        customerId,
        customerName,
        customerPhone,
        customerEmail,
        source,
        sourceId,
        status,
        address,
        latitude,
        longitude,
        notes,
        assignedTo,
        createdAt,
        updatedAt,
        followUpDate,
        metadata,
      ];
}