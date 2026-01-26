import { Filesystem, Directory } from '@capacitor/filesystem';
import { FileTransfer } from '@capacitor/file-transfer';
import { AppInstallPlugin } from '@m430/capacitor-app-install'

const getDownloadPath = (name: string) => {
  return Filesystem.getUri({ path: name, directory: Directory.Temporary });
}

const download = async (url: string) => {
  const fileName = url.split('/').pop();
  if (!fileName || !fileName?.endsWith('.apk')) {
    throw new Error('url is not end with .apk: ' + url)
  }
  const downloadPath = await getDownloadPath(fileName);
  return FileTransfer.downloadFile({
    url,
    path: downloadPath.uri,
  })
}

const install = (path: string) => {
  return AppInstallPlugin.installApk({ filePath: path })
}

export const downloadAndInstall = async (url: string) => {
  const { path } = await download(url);
  if (!path) {
    throw new Error('download failed: ' + url)
  }
  return install(path)
}

export const checkInstallApkPermission = () => {
  return AppInstallPlugin.canInstallUnknownApps().then(res => res.granted)
}

export const requestInstallApkPermission = () => {
  return AppInstallPlugin.openInstallUnknownAppsSettings()
}
