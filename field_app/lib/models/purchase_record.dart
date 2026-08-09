import 'dart:convert';

class PurchaseRecord {
  final String id;
  final String? serverRecordId;
  final String familyCode;
  final String farmerName;
  final String village;
  final String variety;
  final String grade;
  final double standardPrice;
  final double additionalPrice;
  final double finalPrice;
  final List<double> sackWeights;
  final double totalWeight;
  final double totalPayment;
  final double seedBorrowed;
  final double seedRepayment;
  final double seedDeduction;
  final double additionalPremium;
  final double netPayment;
  final String? signatureFarmer;
  final String? signatureStaff;
  final String? specsRecordId;
  final String? transportRecordId;
  final String status;
  final DateTime createdAt;
  final bool isSynced;
  final String? syncError;

  PurchaseRecord({
    required this.id,
    this.serverRecordId,
    required this.familyCode,
    required this.farmerName,
    required this.village,
    required this.variety,
    required this.grade,
    required this.standardPrice,
    this.additionalPrice = 0.0,
    required this.finalPrice,
    required this.sackWeights,
    required this.totalWeight,
    required this.totalPayment,
    this.seedBorrowed = 0.0,
    this.seedRepayment = 0.0,
    this.seedDeduction = 0.0,
    this.additionalPremium = 0.0,
    required this.netPayment,
    this.signatureFarmer,
    this.signatureStaff,
    this.specsRecordId,
    this.transportRecordId,
    this.status = 'PENDING',
    required this.createdAt,
    this.isSynced = false,
    this.syncError,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'serverRecordId': serverRecordId,
      'familyCode': familyCode,
      'farmerName': farmerName,
      'village': village,
      'variety': variety,
      'grade': grade,
      'standardPrice': standardPrice,
      'additionalPrice': additionalPrice,
      'finalPrice': finalPrice,
      'sackWeightsJson': jsonEncode(sackWeights),
      'totalWeight': totalWeight,
      'totalPayment': totalPayment,
      'seedBorrowed': seedBorrowed,
      'seedRepayment': seedRepayment,
      'seedDeduction': seedDeduction,
      'additionalPremium': additionalPremium,
      'netPayment': netPayment,
      'signatureFarmer': signatureFarmer,
      'signatureStaff': signatureStaff,
      'specsRecordId': specsRecordId,
      'transportRecordId': transportRecordId,
      'status': status,
      'createdAt': createdAt.toIso8601String(),
      'isSynced': isSynced ? 1 : 0,
      'syncError': syncError,
    };
  }

  factory PurchaseRecord.fromMap(Map<String, dynamic> map) {
    List<double> weights = [];
    if (map['sackWeightsJson'] != null) {
      final decoded = jsonDecode(map['sackWeightsJson']);
      if (decoded is List) {
        weights = decoded.map((e) => (e as num).toDouble()).toList();
      }
    }

    return PurchaseRecord(
      id: map['id'],
      serverRecordId: map['serverRecordId'],
      familyCode: map['familyCode'],
      farmerName: map['farmerName'],
      village: map['village'],
      variety: map['variety'] ?? 'Red Jasmine',
      grade: map['grade'] ?? 'A1',
      standardPrice: (map['standardPrice'] as num).toDouble(),
      additionalPrice: (map['additionalPrice'] as num?)?.toDouble() ?? 0.0,
      finalPrice: (map['finalPrice'] as num).toDouble(),
      sackWeights: weights,
      totalWeight: (map['totalWeight'] as num).toDouble(),
      totalPayment: (map['totalPayment'] as num).toDouble(),
      seedBorrowed: (map['seedBorrowed'] as num?)?.toDouble() ?? 0.0,
      seedRepayment: (map['seedRepayment'] as num?)?.toDouble() ?? 0.0,
      seedDeduction: (map['seedDeduction'] as num?)?.toDouble() ?? 0.0,
      additionalPremium: (map['additionalPremium'] as num?)?.toDouble() ?? 0.0,
      netPayment: (map['netPayment'] as num).toDouble(),
      signatureFarmer: map['signatureFarmer'],
      signatureStaff: map['signatureStaff'],
      specsRecordId: map['specsRecordId'],
      transportRecordId: map['transportRecordId'],
      status: map['status'] ?? 'PENDING',
      createdAt: DateTime.parse(map['createdAt']),
      isSynced: map['isSynced'] == 1 || map['isSynced'] == true,
      syncError: map['syncError'],
    );
  }

  Map<String, dynamic> toPostJson() {
    return {
      'familyCode': familyCode,
      'farmerName': farmerName,
      'village': village,
      'totalWeight': totalWeight,
      'totalPayment': totalPayment,
      'seedBorrowed': seedBorrowed,
      'seedRepayment': seedRepayment,
      'seedDeduction': seedDeduction,
      'additionalPremium': additionalPremium,
      'netPayment': netPayment,
      'signatureFarmer': signatureFarmer ?? '',
      'signatureStaff': signatureStaff ?? '',
      'specsRecordId': specsRecordId,
      'items': [
        {
          'variety': variety,
          'grade': grade,
          'standardPrice': standardPrice,
          'additionalPrice': additionalPrice,
          'finalPrice': finalPrice,
          'sacks': sackWeights.length,
          'quantity': totalWeight,
          'totalValue': totalPayment,
          'sackWeights': sackWeights,
        }
      ],
    };
  }
}
