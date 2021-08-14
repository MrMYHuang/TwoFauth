# 雙重驗證 (Two Factor Authenticator)

## <a id='feature'>特色</a>

掃描、新增雙重驗證 QR code、one-time password (OTP) 生成、佈景主題切換、字型調整、跨平台、無廣告、開放原始碼。

## 說明

雙重驗證 (Two Factor Authenticator)，簡寫TwoFauth，支援以下功能

* 掃描雙重驗證 QR code，並每個30秒生成 OTP。
* 離線瀏覽
* 佈景主題切換
* 字型調整
  1. 考量視力不佳的使用者，提供最大32 px的字型設定。
* <a id='shortcuts'>App 捷徑</a>
  1. Windows, Android 的 Chrome (建議最新版)使用者，滑鼠右鍵或長按 app 圖示，可存取app功能捷徑，目前有：免費充電、免費 WiFi。

* <a id='report'>App異常回報</a>

  App設定頁的異常回報鈕使用方法為：執行會造成app異常的步驟後，再至設定頁按下異常回報鈕，即會自動產生一封E-mail，包含異常的記錄，發送此E-mail給我們即可。

程式碼為開放 (MIT License)，可自由下載修改、重新發佈。

## <a id='install'>安裝</a>

此 app 目前有1種取得、安裝方式：

  1. Chrome、Safari 網頁瀏覽器。

### <a id='web-app'>從瀏覽器開啟/安裝</a>
請用Chrome (Windows, macOS, Linux, Android作業系統使用者)、Safari (iOS (iPhone, iPad)使用者)瀏覽器開啟以下網址：

https://myhpwa.github.io/TwoFauth

或：

<a href='https://myhpwa.github.io/TwoFauth' target='_blank'>
<img width="auto" height='60px' src='https://user-images.githubusercontent.com/9122190/28998409-c5bf7362-7a00-11e7-9b63-db56694522e7.png'/>
</a>

此 progressive web app (PWA)，可不安裝直接在網頁瀏覽器執行，或安裝至手機、平板、筆電、桌機。建議安裝，以避免瀏覽器定期清除快取，導致 app 設定不見！

#### Windows, macOS, Linux, Android - 使用Chrome安裝
使用Chrome瀏覧器（建議最新版）開啟上述PWA網址後，網址列會出現一個加號，如圖所示：

<img src='https://github.com/MrMYHuang/TwoFauth/raw/main/docs/images/ChromeInstall.png' width='50%' />

點擊它，以完成安裝。安裝完後會在桌面出現"TwoFauth" app 圖示。

#### iOS - 使用Safari安裝
1. 使用Safari開啟web app網址，再點擊下方中間的"分享"圖示：

<img src='https://github.com/MrMYHuang/TwoFauth/raw/main/docs/images/Safari/OpenAppUrl.png' width='50%' />

2. 滑動頁面至下方，點選"加入主畫面"(Add to Home Screen)：

<img src='https://github.com/MrMYHuang/TwoFauth/raw/main/docs/images/Safari/AddToHomeScreen.png' width='50%' />

3. App安裝完，出現在主畫面的圖示：

<img src='https://github.com/MrMYHuang/TwoFauth/raw/main/docs/images/Safari/AppIcon.png' width='50%' />

## <a id='knownIssues'>已知問題</a>
1. iOS Safari 13.4以上才支援"分享此頁"功能。

## <a id='history'>版本歷史</a>
* 1.1.5:
  * 修正存取相機權限問題。
* 1.1.4:
  * 修正 iOS app 存取相機權限問題。
* 1.1.3:
  * 修正 iOS app 存取相機權限問題。
* 1.1.2:
  * 移除 app 中不必要的外部連結，避免送審商店遇到問題。
* 1.1.1:
  * 修正匯入設定後，扇形動畫沒出現的問題。
* 1.1.0:
  * OTP 倒數改用扇形動畫表示。
* 1.0.1:
  * 修正效能 bug。
* 1.0.0：
  * 第一版。

## <a href='https://github.com/MrMYHuang/TwoFauth/blob/main/PrivacyPolicy.md'>隱私政策</a>
