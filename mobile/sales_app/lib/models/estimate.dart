import 'package:json_annotation/json_annotation.dart';
import 'package:equatable/equatable.dart';

part 'estimate.g.dart';

@JsonSerializable()
class Estimate extends Equatable {
  final String id;
  final String leadId;
  final String? customerId;
  final String productType; // 'DOOR', 'WINDOW', 'FRAME'
  final double width;
  final double height;
  final String coatingType; // 'POWDER_COATING', 'PAINT', 'ANODIZED'
  final String hardwareType; // 'STANDARD', 'PREMIUM', 'LUXURY'
  final Map<String, dynamic> specifications;
  final double materialCost;
  final double laborCost;
  final double hardwareCost;
  final double coatingCost;
  final double totalCost;
  final double? discountPercentage;
  final double? discountAmount;
  final double finalAmount;
  final String status; // 'DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'SENT', 'ACCEPTED', 'REJECTED'
  final String? approvedBy;
  final DateTime? approvedAt;
  final String createdBy;
  final DateTime createdAt;
  final DateTime? updatedAt;
  final bool isSynced;

  const Estimate({
    required this.id,
    required this.leadId,
    this.customerId,
    required this.productType,
    required this.width,
    required this.height,
    required this.coatingType,
    required this.hardwareType,
    required this.specifications,
    required this.materialCost,
    required this.laborCost,
    required this.hardwareCost,
    required this.coatingCost,
    required this.totalCost,
    this.discountPercentage,
    this.discountAmount,
    required this.finalAmount,
    required this.status,
    this.approvedBy,
    this.approvedAt,
    required this.createdBy,
    required this.createdAt,
    this.updatedAt,
    this.isSynced = false,
  });

  factory Estimate.fromJson(Map<String, dynamic> json) => _$EstimateFromJson(json);
  Map<String, dynamic> toJson() => _$EstimateToJson(this);

  Estimate copyWith({
    String? id,
    String? leadId,
    String? customerId,
    String? productType,
    double? width,
    double? height,
    String? coatingType,
    String? hardwareType,
    Map<String, dynamic>? specifications,
    double? materialCost,
    double? laborCost,
    double? hardwareCost,
    double? coatingCost,
    double? totalCost,
    double? discountPercentage,
    double? discountAmount,
    double? finalAmount,
    String? status,
    String? approvedBy,
    DateTime? approvedAt,
    String? createdBy,
    DateTime? createdAt,
    DateTime? updatedAt,
    bool? isSynced,
  }) {
    return Estimate(
      id: id ?? this.id,
      leadId: leadId ?? this.leadId,
      customerId: customerId ?? this.customerId,
      productType: productType ?? this.productType,
      width: width ?? this.width,
      height: height ?? this.height,
      coatingType: coatingType ?? this.coatingType,
      hardwareType: hardwareType ?? this.hardwareType,
      specifications: specifications ?? this.specifications,
      materialCost: materialCost ?? this.materialCost,
      laborCost: laborCost ?? this.laborCost,
      hardwareCost: hardwareCost ?? this.hardwareCost,
      coatingCost: coatingCost ?? this.coatingCost,
      totalCost: totalCost ?? this.totalCost,
      discountPercentage: discountPercentage ?? this.discountPercentage,
      discountAmount: discountAmount ?? this.discountAmount,
      finalAmount: finalAmount ?? this.finalAmount,
      status: status ?? this.status,
      approvedBy: approvedBy ?? this.approvedBy,
      approvedAt: approvedAt ?? this.approvedAt,
      createdBy: createdBy ?? this.createdBy,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      isSynced: isSynced ?? this.isSynced,
    );
  }

  @override
  List<Object?> get props => [
        id,
        leadId,
        customerId,
        productType,
        width,
        height,
        coatingType,
        hardwareType,
        specifications,
        materialCost,
        laborCost,
        hardwareCost,
        coatingCost,
        totalCost,
        discountPercentage,
        discountAmount,
        finalAmount,
        status,
        approvedBy,
        approvedAt,
        createdBy,
        createdAt,
        updatedAt,
        isSynced,
      ];
}