## Steps to create a release apk
Don't forget to **change the app version** first:  
**For android**, change the version code and version name in [android/app/build.gradle](./android/app/build.gradle)  
**For iOS**, change the xml and plist version in [ios/Tsukiyo/Info.plist](./ios/Tsukiyo/Info.plist) and the `MARKETING_VERSION` in [ios/Tsukiyo.xcodeproj/project.pbxproj](./ios/Tsukiyo.xcodeproj/project.pbxproj)  
**Then, from the root folder:**
```
>>> cd android
>>> ./gradlew assembleRelease
```

## Steps to create a debug apk
**From the root folder:**
```
>>> npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output android/app/src/main/assets/index.android.bundle --assets-dest android/app/src/main/res
>>> cd android
>>> ./gradlew assembleDebug
```