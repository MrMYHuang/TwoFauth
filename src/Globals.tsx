import { isPlatform, IonLabel } from '@ionic/react';
import fs from 'fs';
import AdmZip from 'adm-zip';
import parse from 'csv-parse/lib/sync';
import { DownloaderHelper, Stats } from 'node-downloader-helper';

const pwaUrl = process.env.PUBLIC_URL || '';
let freeChargingUrl = `https://myhdata.s3.ap-northeast-1.amazonaws.com/charge_station_list.zip`;
let freeWifiUrl = `https://myhdata.s3.ap-northeast-1.amazonaws.com/hotspotlist.zip`;

const TwoFauthDb = 'TwoFauthDb';
const freeChargingDataKey = 'freeCharging';
const freeWifiDataKey = 'freeWifi';
let log = '';

async function downloadCsvZipData(url: string, progressCallback: Function) {
  let dataBuffer = await downloadData(url, progressCallback);
  const zip = new AdmZip(dataBuffer);
  let dataStr = zip.getEntries()[0].getData().toString('utf8');
  return parse(dataStr, {
    columns: true,
    bom: dataStr.charCodeAt(0) === 0xFEFF,
  });
}

async function downloadData(url: string, progressCallback: Function) {
  return new Promise<Buffer>((ok, fail) => {
    const dl = new DownloaderHelper(url, '.', {});
    let progressUpdateEnable = true;
    dl.on('progress', (stats: Stats) => {
      if (progressUpdateEnable) {
        // Reduce number of this calls by progressUpdateEnable.
        // Too many of this calls could result in 'end' event callback is executed before 'progress' event callbacks!
        progressCallback(stats.progress);
        progressUpdateEnable = false;
        setTimeout(() => {
          progressUpdateEnable = true;
        }, 100);
      }
    });
    dl.on('end', (downloadInfo: any) => {
      dl.removeAllListeners();
      ok(fs.readFileSync(downloadInfo.filePath));
    });
    dl.start();
  });
}

async function getFileFromIndexedDB(fileName: string) {
  const dbOpenReq = indexedDB.open(TwoFauthDb);

  return new Promise(function (ok, fail) {
    dbOpenReq.onsuccess = async function (ev) {
      const db = dbOpenReq.result;

      try {
        const trans = db.transaction(["store"], 'readwrite');
        let req = trans.objectStore('store').get(fileName);
        req.onsuccess = async function (_ev) {
          const data = req.result;
          if (!data) {
            console.error(`${fileName} loading failed!`);
            console.error(new Error().stack);
            return fail();
          }
          return ok(data);
        };
      } catch (err) {
        console.error(err);
      }
    };
  });
}

async function saveFileToIndexedDB(fileName: string, data: any) {
  const dbOpenReq = indexedDB.open(TwoFauthDb);
  return new Promise<void>((ok, fail) => {
    dbOpenReq.onsuccess = async (ev: Event) => {
      const db = dbOpenReq.result;

      const transWrite = db.transaction(["store"], 'readwrite')
      const reqWrite = transWrite.objectStore('store').put(data, fileName);
      reqWrite.onsuccess = (_ev: any) => ok();
      reqWrite.onerror = (_ev: any) => fail();
    };
  });
}

async function removeFileFromIndexedDB(fileName: string) {
  const dbOpenReq = indexedDB.open(TwoFauthDb);
  return new Promise<void>((ok, fail) => {
    try {
      dbOpenReq.onsuccess = (ev: Event) => {
        const db = dbOpenReq.result;

        const transWrite = db.transaction(["store"], 'readwrite')
        try {
          const reqWrite = transWrite.objectStore('store').delete(fileName);
          reqWrite.onsuccess = (_ev: any) => ok();
          reqWrite.onerror = (_ev: any) => fail();
        } catch (err) {
          console.error(err);
        }
      };
    } catch (err) {
      fail(err);
    }
  });
}

async function clearIndexedDB() {
  const dbOpenReq = indexedDB.open(TwoFauthDb);
  return new Promise<void>((ok, fail) => {
    dbOpenReq.onsuccess = async (ev: Event) => {
      const db = dbOpenReq.result;

      const transWrite = db.transaction(["store"], 'readwrite')
      const reqWrite = transWrite.objectStore('store').clear();
      reqWrite.onsuccess = (_ev: any) => ok();
      reqWrite.onerror = (_ev: any) => fail();
    };
  });
}

async function clearAppData() {
  localStorage.clear();
  await clearIndexedDB();
}

async function getCurrentPosition() {
  return new Promise<GeolocationPosition>((ok, fail) => {
    if (!navigator.geolocation) {
      fail('No geolocation object!');
    } else {
      navigator.geolocation.getCurrentPosition((position: GeolocationPosition) => {
        ok(position);
      }, (error: GeolocationPositionError) => {
        fail(`${error.code}: ${error.message}`);
      });
    }
  });
}

const webkit = (window as any).webkit;
function isWKWebView() {
  return webkit?.messageHandlers?.swiftCallbackHandler != null;
}

let isRequestingCamera = false;
let cameraResultCode = 0;
(window as any).CameraResultCallback = (code: number) => {
  cameraResultCode = code;
  isRequestingCamera = false;
}

async function loadCamera() {
  try {
    if (isWKWebView()) {
      await new Promise<void>(async (ok, fail) => {
        isRequestingCamera = true;
        webkit.messageHandlers.swiftCallbackHandler.postMessage({
          event: 'camera'
        });

        const timer = setInterval(() => {
          if (!isRequestingCamera) {
            clearInterval(timer);

            if (cameraResultCode) {
              fail();
            } else {
              ok();
            }
          }
        }, 500);
      });
    }

    return await navigator.mediaDevices.getUserMedia({
      video: { width: 720, height: 1280, facingMode: 'environment' }
    });
  } catch (error) {
    console.error(error);
    throw(error);
  }
}

//const electronBackendApi: any = (window as any).electronBackendApi;

function removeElementsByClassName(doc: Document, className: string) {
  let elements = doc.getElementsByClassName(className);
  while (elements.length > 0) {
    elements[0].parentNode?.removeChild(elements[0]);
  }
}

const consoleLog = console.log.bind(console);
const consoleError = console.error.bind(console);

function getLog() {
  return log;
}

function enableAppLog() {
  console.log = function () {
    log += '----- Info ----\n';
    log += (Array.from(arguments)) + '\n';
    consoleLog.apply(console, arguments as any);
  };

  console.error = function () {
    log += '----- Error ----\n';
    log += (Array.from(arguments)) + '\n';
    consoleError.apply(console, arguments as any);
  };
}

function disableAppLog() {
  log = '';
  console.log = consoleLog;
  console.error = consoleError;
}

function disableAndroidChromeCallout(event: any) {
  event.preventDefault();
  event.stopPropagation();
  return false;
}

// Workable but imperfect.
function disableIosSafariCallout(this: Window, event: any) {
  const s = this.getSelection();
  if ((s?.rangeCount || 0) > 0) {
    const r = s?.getRangeAt(0);
    s?.removeAllRanges();
    setTimeout(() => {
      s?.addRange(r!);
    }, 50);
  }
}

function copyToClipboard(text: string) {
  try {
    navigator.clipboard && navigator.clipboard.writeText(text);
  } catch (error) {
    console.error(error);
  }
}

function isMacCatalyst() {
  return isPlatform('ios') && navigator.platform === 'MacIntel';
}

const Globals = {
  pwaUrl,
  storeFile: 'TwoFauthSettings.json',
  downloadCsvZipData,
  getCurrentPosition,
  loadCamera,
  getLog,
  enableAppLog,
  disableAppLog,
  TwoFauthDb,
  freeResources: [
    { item: "離線免費充電資料", dataKey: freeChargingDataKey, url: freeChargingUrl },
    { item: "離線免費 WiFi 資料", dataKey: freeWifiDataKey, url: freeWifiUrl },
  ],
  appSettings: {
    'theme': '佈景主題',
    'uiFontSize': 'UI字型大小',
  } as Record<string, string>,
  fetchErrorContent: (
    <div className='contentCenter'>
      <IonLabel>
        <div>
          <div>連線失敗!</div>
          <div style={{ fontSize: 'var(--ui-font-size)', paddingTop: 24 }}>如果問題持續發生，請執行<a href={`/${pwaUrl}/settings`} target="_self">設定頁</a>的 app 異常回報功能。</div>
        </div>
      </IonLabel>
    </div>
  ),
  updateApp: () => {
    return new Promise(async resolve => {
      navigator.serviceWorker.getRegistrations().then(async regs => {
        const hasUpdates = await Promise.all(regs.map(reg => (reg.update() as any).then((newReg: ServiceWorkerRegistration) => {
          return newReg.installing !== null || newReg.waiting !== null;
        })));
        resolve(hasUpdates.reduce((prev, curr) => prev || curr, false));
      });
    });
  },
  updateCssVars: (settings: any) => {
    document.documentElement.style.cssText = `--ui-font-size: ${settings.uiFontSize}px;`
  },
  isMacCatalyst,
  isTouchDevice: () => {
    return (isPlatform('ios') && !isMacCatalyst()) || isPlatform('android');
  },
  isStoreApps: () => {
    return isPlatform('pwa') || isPlatform('electron');
  },
  isWKWebView,
  getFileFromIndexedDB,
  saveFileToIndexedDB,
  removeFileFromIndexedDB,
  clearAppData,
  removeElementsByClassName,
  disableAndroidChromeCallout,
  disableIosSafariCallout,
  copyToClipboard,
};

export default Globals;
