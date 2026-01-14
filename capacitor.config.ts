type CapacitorConfig = {
  appId: string;
  appName: string;
  webDir: string;
  bundledWebRuntime?: boolean;
};

const config: CapacitorConfig = {
  appId: 'jp.nicchyo.app',
  appName: 'nicchyo',
  webDir: 'out'
};

export default config;
