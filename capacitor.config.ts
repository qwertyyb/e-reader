import { internalIpV4Sync } from 'internal-ip';
import type { CapacitorConfig } from '@capacitor/cli';

const runEnv = process.env.RUN_ENV || 'prod'

const config: CapacitorConfig = {
  appId: 'com.qwertyyb.ereader',
  appName: 'E Reader',
  webDir: 'appdist',
  server: {
    appStartPath: '/e-reader/index.html'
  },
}

if (runEnv === 'dev') {
  config.server = {
    url: `http://${internalIpV4Sync()}:8030/e-reader/`,
    cleartext: true,
  }
}

export default config
