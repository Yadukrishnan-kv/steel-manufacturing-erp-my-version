import 'package:json_annotation/json_annotation.dart';
import 'package:equatable/equatable.dart';

part 'customer_interaction.g.dart';

@JsonSerializable()
class CustomerInteraction extends Equatable {
  final String id;
  final String leadId;
  final String? customerId;
  final String interactionType; // 'CALL', 'EMAIL', 'WHATSAPP', 'SMS', 'MEETING', 'SITE_VISIT'
  final String direction; // 'INBOUND', 'OUTBOUND'
  final String subject;
  final String? description;
  final DateTime scheduledAt;
  final DateTime? completedAt;
  final String status; // 'SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_RESPONSE'
  final String? outcome; // 'INTERESTED', 'NOT_INTERESTED', 'FOLLOW_UP_REQUIRED', 'CONVERTED'
  final String? nextAction;
  final DateTime? nextFollowUp;
  final String createdBy;
  final DateTime createdAt;
  final bool isSynced;

  const CustomerInteraction({
    required this.id,
    required this.leadId,
    this.customerId,
    required this.interactionType,
    required this.direction,
    required this.subject,
    this.description,
    required this.scheduledAt,
    this.completedAt,
    required this.status,
    this.outcome,
    this.nextAction,
    this.nextFollowUp,
    required this.createdBy,
    required this.createdAt,
    this.isSynced = false,
  });

  factory CustomerInteraction.fromJson(Map<String, dynamic> json) => _$CustomerInteractionFromJson(json);
  Map<String, dynamic> toJson() => _$CustomerInteractionToJson(this);

  CustomerInteraction copyWith({
    String? id,
    String? leadId,
    String? customerId,
    String? interactionType,
    String? direction,
    String? subject,
    String? description,
    DateTime? scheduledAt,
    DateTime? completedAt,
    String? status,
    String? outcome,
    String? nextAction,
    DateTime? nextFollowUp,
    String? createdBy,
    DateTime? createdAt,
    bool? isSynced,
  }) {
    return CustomerInteraction(
      id: id ?? this.id,
      leadId: leadId ?? this.leadId,
      customerId: customerId ?? this.customerId,
      interactionType: interactionType ?? this.interactionType,
      direction: direction ?? this.direction,
      subject: subject ?? this.subject,
      description: description ?? this.description,
      scheduledAt: scheduledAt ?? this.scheduledAt,
      completedAt: completedAt ?? this.completedAt,
      status: status ?? this.status,
      outcome: outcome ?? this.outcome,
      nextAction: nextAction ?? this.nextAction,
      nextFollowUp: nextFollowUp ?? this.nextFollowUp,
      createdBy: createdBy ?? this.createdBy,
      createdAt: createdAt ?? this.createdAt,
      isSynced: isSynced ?? this.isSynced,
    );
  }

  @override
  List<Object?> get props => [
        id,
        leadId,
        customerId,
        interactionType,
        direction,
        subject,
        description,
        scheduledAt,
        completedAt,
        status,
        outcome,
        nextAction,
        nextFollowUp,
        createdBy,
        createdAt,
        isSynced,
      ];
}