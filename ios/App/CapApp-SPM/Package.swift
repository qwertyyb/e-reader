// swift-tools-version: 5.9
import PackageDescription

// DO NOT MODIFY THIS FILE - managed by Capacitor CLI commands
let package = Package(
    name: "CapApp-SPM",
    platforms: [.iOS(.v15)],
    products: [
        .library(
            name: "CapApp-SPM",
            targets: ["CapApp-SPM"])
    ],
    dependencies: [
        .package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", exact: "8.0.0"),
        .package(name: "CapacitorCommunityTextToSpeech", path: "../../../node_modules/.pnpm/@capacitor-community+text-to-speech@6.1.0_@capacitor+core@8.0.0/node_modules/@capacitor-community/text-to-speech"),
        .package(name: "CapacitorApp", path: "../../../node_modules/.pnpm/@capacitor+app@8.0.0_@capacitor+core@8.0.0/node_modules/@capacitor/app"),
        .package(name: "CapacitorFileTransfer", path: "../../../node_modules/.pnpm/@capacitor+file-transfer@2.0.3_@capacitor+core@8.0.0/node_modules/@capacitor/file-transfer"),
        .package(name: "CapacitorFilesystem", path: "../../../node_modules/.pnpm/@capacitor+filesystem@8.1.0_@capacitor+core@8.0.0/node_modules/@capacitor/filesystem")
    ],
    targets: [
        .target(
            name: "CapApp-SPM",
            dependencies: [
                .product(name: "Capacitor", package: "capacitor-swift-pm"),
                .product(name: "Cordova", package: "capacitor-swift-pm"),
                .product(name: "CapacitorCommunityTextToSpeech", package: "CapacitorCommunityTextToSpeech"),
                .product(name: "CapacitorApp", package: "CapacitorApp"),
                .product(name: "CapacitorFileTransfer", package: "CapacitorFileTransfer"),
                .product(name: "CapacitorFilesystem", package: "CapacitorFilesystem")
            ]
        )
    ]
)
