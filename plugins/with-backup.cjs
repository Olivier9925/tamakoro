const { withEntitlementsPlist, withInfoPlist } = require('expo/config-plugins');
module.exports = config => {
  config = withInfoPlist(config, config => {
    config.modResults.TamakoroCloudBackupEnabled = true;
    return config;
  });
  return withEntitlementsPlist(config, config => {
    const entitlements = config.modResults;
    entitlements['com.apple.developer.icloud-container-identifiers'] = [...new Set([...(entitlements['com.apple.developer.icloud-container-identifiers'] || []), 'iCloud.com.olivier9925.tamakoro'])];
    entitlements['com.apple.developer.icloud-services'] = [...new Set([...(entitlements['com.apple.developer.icloud-services'] || []), 'CloudKit'])];
    return config;
  });
};
