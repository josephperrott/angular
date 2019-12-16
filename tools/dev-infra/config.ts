export interface DevInfraConfig {
  bazelDiagnostics?: {
    enabled: boolean;
  }
}

export function getUserConfig(): DevInfraConfig {
  try {
    return require('../../.ng-dev-infra-config.json');
  } catch {
    return {};
  }
}
