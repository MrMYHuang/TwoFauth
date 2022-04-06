//
//  ViewController.swift
//  cbetar2
//
//  Created by Roger Huang on 2020/12/24.
//

import SwiftUI
import UIKit
import WebKit
import SnapKit
import AVFoundation

struct WebViewControllerWrap: UIViewControllerRepresentable {
    
    func makeUIViewController(context: Context) -> some UIViewController {
        return WebViewController()
    }
    
    func updateUIViewController(_ uiViewController: UIViewControllerType, context: Context) {
    }
}

class WebViewController: UIViewController {
    
    let jsonUriPrefix = "data:text/json;charset=utf-8,"
    #if DEBUG
    let baseURL = URL(string: "http://192.168.0.23:3000/TwoFauth")!
    #else
    let baseURL = URL(string: "https://myhpwa.github.io/TwoFauth")!
    #endif
    
    let contentController = WKUserContentController();
    let swiftCallbackHandler = "swiftCallbackHandler"
    
    var webView: WKWebView?
    func loadWebView() {
        webView = {
            let preferences = WKPreferences()
            preferences.setValue(true, forKey: "allowFileAccessFromFileURLs")
            
            let configuration = WKWebViewConfiguration()
            configuration.preferences = preferences
            configuration.defaultWebpagePreferences.allowsContentJavaScript = true
            configuration.limitsNavigationsToAppBoundDomains = true
            configuration.userContentController = contentController
            
            let webView = WKWebView(frame: .zero, configuration: configuration)
            webView.navigationDelegate = self
            webView.uiDelegate = self
            webView.scrollView.contentInsetAdjustmentBehavior = .never
            
            let websiteDataTypes = NSSet(array: [WKWebsiteDataTypeDiskCache, WKWebsiteDataTypeMemoryCache])
            let date = NSDate(timeIntervalSince1970: 0)
            
            WKWebsiteDataStore.default().removeData(ofTypes: websiteDataTypes as! Set<String>, modifiedSince: date as Date, completionHandler:{ })
            
            return webView
        }()
        
        view.addSubview(webView!)
        webView?.snp.makeConstraints {
            //$0.edges.equalToSuperview()
            $0.top.equalTo(self.view.safeAreaLayoutGuide.snp.topMargin)
            $0.leading.trailing.bottom.equalToSuperview()
        }
        webView?.load(URLRequest(url: baseURL))
    }
    
    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
    }
    
    override func viewDidLoad() {
        super.viewDidLoad()
        contentController.add(self, name: swiftCallbackHandler)
        
        AVCaptureDevice.requestAccess(for: .video) { granted in
            if granted {
                DispatchQueue.main.async {
                    self.loadWebView()
                }
            }
        }
    }
    
    var fileURL: URL?
    private func saveText(text: String, file: String) {
        if let dir = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first {
            fileURL = dir.appendingPathComponent(file)
            do {
                try text.write(to: fileURL!, atomically: false, encoding: .utf8)
                let controller = UIDocumentPickerViewController(forExporting: [fileURL!])
                controller.delegate = self
                present(controller, animated: true)
            }
            catch {/* error handling here */}
        }
    }
    
    func requestCameraResult(code: Int) {
        DispatchQueue.main.async {
            self.webView?.evaluateJavaScript("CameraResultCallback(\(code))", completionHandler: nil)
        }
    }
}

extension WebViewController: UIDocumentPickerDelegate {
    func documentPicker(_ controller: UIDocumentPickerViewController, didPickDocumentsAt urls: [URL]) {
        try? FileManager.default.removeItem(at: fileURL! )
    }
}

extension WebViewController: WKScriptMessageHandler {
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard let dict = message.body as? Dictionary<String, Any> else { return }
        guard let event = dict["event"] as? String else { return }
        
        switch event {
        case "copy":
            let text = dict["text"] as? String ?? ""
            UIPasteboard.general.string = text
        case "camera":
            switch AVCaptureDevice.authorizationStatus(for: .video) {
                case .authorized: // The user has previously granted access to the camera.
                    requestCameraResult(code: 0)
                    break
                
                case .notDetermined: // The user has not yet been asked for camera access.
                    AVCaptureDevice.requestAccess(for: .video) { granted in
                        if granted {
                            self.requestCameraResult(code: 0)
                        }
                    }
                
                case .denied: // The user has previously denied access.
                    self.requestCameraResult(code: 1)
                    return

                case .restricted: // The user can't grant access due to restrictions.
                    self.requestCameraResult(code: 1)
                    return
            @unknown default:
                fatalError()
            }
        default:
            break
        }
    }
}

extension WebViewController: WKNavigationDelegate {
    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        if navigationAction.navigationType == .linkActivated  {
            if let url = navigationAction.request.url {
                if url.absoluteString.contains(jsonUriPrefix) {
                    if let dataStr = url.absoluteString.replacingOccurrences(of: jsonUriPrefix, with: "").removingPercentEncoding {
                        saveText(text: dataStr, file: "TwoFauthSettings.json")
                        decisionHandler(.cancel)
                        return
                    }
                } else if let host = url.host, !host.hasPrefix(baseURL.host!), UIApplication.shared.canOpenURL(url) {
                    UIApplication.shared.open(url)
                    decisionHandler(.cancel)
                    return
                }
            }
        }
        
        decisionHandler(.allow)
    }
}

extension WebViewController: WKUIDelegate {
    func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration, for navigationAction: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
        if let url = navigationAction.request.url {
            UIApplication.shared.open(url)
        }
        return nil
    }
}
