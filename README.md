# Shop App

## EAS Command
### build
eas build -p ios --profile development

### push setup
eas credentials

### update
eas update --branch preview --message "i18n 26-2"

### submit

### device
eas device:create

## Update App
### 변경 시 조치
version : build 설치 필요
ios.buildVersion / android.versionCode : update 필요

### EAS
update : buildVersion, versionCode 변경 후 eas update
build : 
* runtimeVersion 변경과 빌드
* APP_VERSION, APP_UPGRADE_URL 추가 
* 이전 빌드 버전에서 에서 eas update


