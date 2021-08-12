import React from 'react';
import { IonAlert, IonButton, IonContent, IonLabel, IonModal } from '@ionic/react';
import { RouteComponentProps } from 'react-router-dom';
import { connect } from 'react-redux';
import QrCode from 'qrcode-reader';
import Globals from '../Globals';

interface Props {
  dispatch: Function;
  showModal: boolean;
  finish: Function;
  settings: any;
}

interface PageProps extends Props, RouteComponentProps<{
  tab: string;
  path: string;
}> { }

interface State {
  showLoadCameraAlert: boolean;
}

class _ScanQrCodeModal extends React.Component<PageProps, State> {

  constructor(props: any) {
    super(props);
    this.state = {
      showLoadCameraAlert: false,
    }
  }

  otpauthUriDecode(uri: string) {
    //uri = 'otpauth://totp/ACME%20Co:john@example.com?secret=HXDMVJECJJWSRB3HWIZR4IFUGFTMXBOZ&issuer=ACME%20Co&algorithm=SHA1&digits=6&period=30';
    const re0 = /otpauth:\/\/totp\/([^:]*):(.*)\?.*/i;
    let [, issuer, account] = re0.exec(uri)!;
    issuer = decodeURIComponent(issuer);
    account = decodeURIComponent(account);
    const re1 = /.*\?.*secret=([^&]*).*/i;
    const [, secret] = re1.exec(uri)!;
    return { issuer, account, secret };
  }

  stream: MediaStream | undefined;
  async loadCamera() {
    this.stream = await Globals.loadCamera();
    const stream = this.stream!;
    const videoElement = document.querySelector('#video') as HTMLVideoElement;
    videoElement.srcObject = stream;
    const canvas = document.createElement("canvas");
    const qr = new QrCode();

    const timer = setInterval(() => {
      canvas.getContext('2d')?.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
      qr.decode(canvas.toDataURL());
    }, 500);

    qr.callback = (error: any, result: any) => {
      if (error || !/otpauth:\/\/.*:.*\?.*secret=.*/i.test(result.result)) {
        return;
      }

      clearInterval(timer);
      videoElement.pause();
      this.closeStream();
      this.props.finish(this.otpauthUriDecode(result.result));
    }

    videoElement.onloadedmetadata = (e) => {
      videoElement.play();
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
    }
  }

  closeStream() {
    this.stream?.getTracks().forEach(t => t.stop());
  }

  async loadCameraAux() {
    if (!this.props.settings.isInitialized) {
      this.setState({ showLoadCameraAlert: true });
    } else {
      this.loadCamera();
    }
  }

  render() {
    return (
      <IonModal
        isOpen={this.props.showModal}
        cssClass='uiFont'
        swipeToClose={true}
        //presentingElement={router || undefined}
        onWillPresent={async () => {
          this.loadCameraAux();
        }}
        onDidDismiss={() => {
          this.closeStream();
          this.props.finish();
        }}>
        <IonContent>
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center' }}>
            <div>
              <IonLabel className='uiFont'>請掃描雙重驗證 QR Code</IonLabel>
            </div>
            <div style={{ flexGrow: 1, flexShrink: 0, display: 'flex', alignItems: 'center', margin: 10 }}>
              <video id='video' width='100%' style={{ margin: '0px auto' }} />
            </div>
            <div>
              <IonButton fill='outline' shape='round' size='large' onClick={() => {
                this.closeStream();
                this.props.finish();
              }}>關閉</IonButton>
            </div>
          </div>

          <IonAlert
            cssClass='uiFont'
            isOpen={this.state.showLoadCameraAlert}
            backdropDismiss={false}
            header={'請在私人裝置使用此 app，避免密碼外流。按下關閉後，會跳出相機授權確認，請允許以掃描 QR code。'}
            buttons={[
              {
                text: '關閉',
                cssClass: 'primary uiFont',
                handler: (value) => {
                  this.setState({
                    showLoadCameraAlert: false,
                  });
                  this.props.dispatch({
                    type: "SET_KEY_VAL",
                    key: 'isInitialized',
                    val: true,
                  });
                  this.loadCamera();
                },
              },
            ]}
          />
        </IonContent>
      </IonModal>
    );
  }
};

const mapStateToProps = (state: any /*, ownProps*/) => {
  return {
    settings: state.settings,
  }
};

//const mapDispatchToProps = {};

export default connect(
  mapStateToProps,
)(_ScanQrCodeModal);
