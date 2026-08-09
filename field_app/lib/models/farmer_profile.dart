class FarmerProfile {
  final String id;
  final String? serverRecordId;
  final String familyCode;
  final String farmerName;
  final String village;
  final String? phone;
  final String paymentMethod;
  final String? bankName;
  final String? accountNumber;
  final String? accountHolder;
  final String relationship;
  final String? bankDocumentUrl; // Local image file path or HTTP URL
  final DateTime createdAt;
  final bool isSynced;
  final String? syncError;

  FarmerProfile({
    required this.id,
    this.serverRecordId,
    required this.familyCode,
    required this.farmerName,
    required this.village,
    this.phone,
    this.paymentMethod = 'Bank Transfer',
    this.bankName,
    this.accountNumber,
    this.accountHolder,
    this.relationship = 'Self',
    this.bankDocumentUrl,
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
      'phone': phone,
      'paymentMethod': paymentMethod,
      'bankName': bankName,
      'accountNumber': accountNumber,
      'accountHolder': accountHolder,
      'relationship': relationship,
      'bankDocumentUrl': bankDocumentUrl,
      'createdAt': createdAt.toIso8601String(),
      'isSynced': isSynced ? 1 : 0,
      'syncError': syncError,
    };
  }

  factory FarmerProfile.fromMap(Map<String, dynamic> map) {
    return FarmerProfile(
      id: map['id'],
      serverRecordId: map['serverRecordId'],
      familyCode: map['familyCode'],
      farmerName: map['farmerName'],
      village: map['village'],
      phone: map['phone'],
      paymentMethod: map['paymentMethod'] ?? 'Bank Transfer',
      bankName: map['bankName'],
      accountNumber: map['accountNumber'],
      accountHolder: map['accountHolder'],
      relationship: map['relationship'] ?? 'Self',
      bankDocumentUrl: map['bankDocumentUrl'],
      createdAt: DateTime.parse(map['createdAt']),
      isSynced: map['isSynced'] == 1 || map['isSynced'] == true,
      syncError: map['syncError'],
    );
  }

  Map<String, dynamic> toPostJson({String? uploadedPhotoUrl}) {
    return {
      'familyCode': familyCode,
      'farmerName': farmerName,
      'village': village,
      'phone': phone ?? '',
      'paymentMethod': paymentMethod,
      'bankName': paymentMethod == 'Bank Transfer' ? bankName : 'Cash',
      'accountNumber': accountNumber ?? '',
      'accountHolder': accountHolder ?? farmerName,
      'relationship': relationship,
      'bankDocumentUrl': uploadedPhotoUrl ?? bankDocumentUrl ?? '',
    };
  }
}
