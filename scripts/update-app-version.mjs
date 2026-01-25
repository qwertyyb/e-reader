import { root } from './const.mjs'
import { join } from 'node:path'
import { readFile, writeFile } from 'node:fs/promises'
import plist from 'plist';

const version = process.env.APP_VERSION
const buildVersion = Number(process.env.BUILDVERSION)

const androidGradlePath = join(root, './android/app/build.gradle');
const iosPlistPath = join(root, './ios/App/App/Info.plist');

const updateAndroidAppVersion = async (version, buildVersion) => {
  let gradleContent = await readFile(androidGradlePath, 'utf8');

  // 替换 versionCode（数字）
  gradleContent = gradleContent.replace(
    /versionCode\s+\d+/,
    `versionCode ${buildVersion}`
  );
  // 替换 versionName（字符串）
  gradleContent = gradleContent.replace(
    /versionName\s+["'](.+?)["']/,
    `versionName "${version}"`
  );
  // 写入修改后的内容
  await writeFile(androidGradlePath, gradleContent);
}

const updateIosAppVersion = async (version, buildVersion) => {
  const plistContent = await readFile(iosPlistPath, 'utf8');
  // 解析 plist 为 JSON 对象
  const plistObj = plist.parse(plistContent);

  // CFBundleShortVersionString = 版本名（如 1.0.0）
  plistObj.CFBundleShortVersionString = version;
  // CFBundleVersion = 版本代码（纯数字字符串）
  plistObj.CFBundleVersion = buildVersion.toString();

  // 写回 plist 文件（格式化输出）
  const newPlistContent = plist.build(plistObj, { pretty: true });
  await writeFile(iosPlistPath, newPlistContent);
}

const updateAppVersion = async (version, buildVersion) => {
  await Promise.all([
    updateAndroidAppVersion(version, buildVersion),
    updateIosAppVersion(version, buildVersion)
  ])
  console.log(`✅ 版本信息更新完成：
  - 版本名（versionName/ShortVersion）：${version}
  - 版本代码（versionCode/BuildVersion）：${buildVersion}
  - Android：已更新 android/app/build.gradle
  - iOS：已更新 ios/App/App/Info.plist`);
}

updateAppVersion(version, buildVersion)

