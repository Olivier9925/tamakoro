import CloudKit
import ExpoModulesCore

private enum BackupError: String, Error, LocalizedError {
  case corrupt = "CLOUD_CORRUPT"
  case unavailable = "CLOUD_UNAVAILABLE"
  case conflict = "CLOUD_CONFLICT"
  case accountChanged = "CLOUD_ACCOUNT_CHANGED"
  var errorDescription: String? { rawValue }
}

public class TamakoroCloudBackupModule: Module {
  private lazy var container = CKContainer(identifier: "iCloud.com.olivier9925.tamakoro")
  private let recordID = CKRecord.ID(recordName: "tamakoro-backup-v1")

  public func definition() -> ModuleDefinition {
    Name("TamakoroCloudBackup")
    AsyncFunction("readBackup") { () async throws -> [String: String] in
      let account = try await self.account()
      let record = try await self.record()
      if let record, !(record["payload"] is String) { throw BackupError.corrupt }
      return ["account": account, "payload": record?["payload"] as? String ?? "",
              "tag": record?.recordChangeTag ?? ""]
    }
    AsyncFunction("writeBackup") { (payload: String, account: String, tag: String) async throws -> String in
      guard try await self.account() == account else { throw BackupError.accountChanged }
      let existing = try await self.record()
      guard (existing?.recordChangeTag ?? "") == tag else { throw BackupError.conflict }
      let record = existing ?? CKRecord(recordType: "TamakoroBackup", recordID: self.recordID)
      record["payload"] = payload as CKRecordValue
      // CloudKit also checks the tag atomically: another device cannot silently overwrite this save.
      do {
        let results = try await self.container.privateCloudDatabase.modifyRecords(
          saving: [record], deleting: [], savePolicy: .ifServerRecordUnchanged, atomically: true)
        guard let result = results.saveResults[self.recordID] else { throw BackupError.unavailable }
        return try result.get().recordChangeTag ?? ""
      } catch let error as CKError where error.code == .serverRecordChanged {
        throw BackupError.conflict
      }
    }
  }

  private func account() async throws -> String {
    // Existing generated projects may have linked the module before applying the plugin.
    guard Bundle.main.object(forInfoDictionaryKey: "TamakoroCloudBackupEnabled") as? Bool == true
      else { throw BackupError.unavailable }
    let status = try await container.accountStatus()
    if status == .noAccount || status == .restricted { throw BackupError.unavailable }
    guard status == .available else { throw NSError(domain: "CloudKit", code: 1,
      userInfo: [NSLocalizedDescriptionKey: "Unable to verify iCloud account"]) }
    return try await container.userRecordID().recordName
  }

  private func record() async throws -> CKRecord? {
    do { return try await container.privateCloudDatabase.record(for: recordID) }
    catch let error as CKError where error.code == .unknownItem { return nil }
  }
}
