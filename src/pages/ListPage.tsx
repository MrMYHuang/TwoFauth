import React from 'react';
import { IonContent, IonHeader, IonPage, IonToolbar, withIonLifeCycle, IonList, IonItem, IonLabel, IonToast, IonTitle, IonFab, IonFabButton, IonIcon, IonItemOptions, IonItemOption, IonItemSliding, IonReorderGroup, IonButton, IonReorder } from '@ionic/react';
import { ItemReorderEventDetail } from '@ionic/core';
import { RouteComponentProps } from 'react-router-dom';
import { connect } from 'react-redux';
import { v4 as uuidv4 } from 'uuid';
import authenticator from 'authenticator';

import { Settings } from '../models/Settings';
import { TmpSettings } from '../models/TmpSettings';
import './ListPage.css';
import { Bookmark } from '../models/Bookmark';
import { add, swapVertical } from 'ionicons/icons';
import ScanQrCodeModal from '../components/ScanQrCodeModal';
import Globals from '../Globals';

interface Props {
  dispatch: Function;
  tmpSettings: TmpSettings;
  settings: Settings;
}

interface PageProps extends Props, RouteComponentProps<{
  path: string;
  tab: string;
}> { }

interface State {
  showScanQrCodeModal: boolean;
  remainingTime: number;
  tokens: string[];
  reorder: boolean;
  showToast: boolean;
  toastMessage: string;
}

class _ListPage extends React.Component<PageProps, State> {
  tokenUpdateTimer: NodeJS.Timeout | null;
  bookmarkListRef: React.RefObject<HTMLIonListElement>;

  constructor(props: any) {
    super(props);
    this.state = {
      showScanQrCodeModal: false,
      remainingTime: 0,
      tokens: [],
      reorder: false,
      showToast: false,
      toastMessage: '',
    }

    this.tokenUpdateTimer = null;
    this.bookmarkListRef = React.createRef<HTMLIonListElement>();
  }

  ionViewWillEnter() {
    //console.log(`${this.props.match.url} will enter`);

    const bookmark0 = this.props.settings.bookmarks[0];
    if (bookmark0) {
    }

    this.tokenUpdateTimer = setInterval(() => {
      this.setState({
        tokens: this.props.settings.bookmarks.map(
          b => authenticator.generateToken(b.secret).replace(/(.{3})/g, '$1 ')
        ),
        remainingTime: 30 - (new Date().getSeconds() % 30),
      });
    }, 40);
  }

  reorderBookmarks(event: CustomEvent<ItemReorderEventDetail>) {
    const bookmarks = event.detail.complete(this.props.settings.bookmarks);
    this.props.dispatch({
      type: "UPDATE_BOOKMARKS",
      bookmarks: bookmarks,
    });
  }

  getRows() {
    let rows = Array<object>();
    this.props.settings.bookmarks.forEach((item: Bookmark, index: number) => {
      const token = this.state.tokens[index];
      rows.push(
        <IonItemSliding key={`bookmarkItemSliding_` + index}>
          <IonItem button={true} key={`dictItem` + index}
            onClick={async event => {
              event.preventDefault();
              Globals.copyToClipboard(token.replaceAll(' ', ''));
              this.setState({ showToast: true, toastMessage: `複製 OTP 成功` })
            }}>
            <div tabIndex={0}></div>{/* Workaround for macOS Safari 14 bug. */}
            <IonLabel slot='start'>
              <div className='listItem'>
                <div>
                  <IonLabel className='ion-text-wrap uiFont'>
                    {item.issuer} ({item.account})
                  </IonLabel>
                </div>
                <div>
                  <IonLabel color='primary' className='ion-text-wrap uiFontX1_5' key={`bookmarkItemLabel_` + index}>
                    {token}
                  </IonLabel>
                </div>
              </div>
            </IonLabel>
            <IonLabel slot='end' className='ion-text-wrap uiFontX1_5' style={{ textAlign: 'center' }} key={`bookmarkItemLabel_` + index}>
              {this.state.remainingTime}s
            </IonLabel>
            <IonReorder slot='end' />
          </IonItem>

          <IonItemOptions side="end">
            <IonItemOption className='uiFont' color='danger' onClick={(e) => {
              this.props.dispatch({
                type: "DEL_BOOKMARK",
                uuid: item.uuid,
              });
              this.bookmarkListRef.current?.closeSlidingItems();
            }}>刪除</IonItemOption>
          </IonItemOptions>
        </IonItemSliding>
      );
    });
    return rows;
  }

  render() {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle className='uiFont'>驗證碼</IonTitle>

            <IonButton fill={this.state.reorder ? 'solid' : 'clear'} slot='end'
              onClick={ev => this.setState({ reorder: !this.state.reorder })}>
              <IonIcon icon={swapVertical} slot='icon-only' />
            </IonButton>
          </IonToolbar>
        </IonHeader>
        <IonContent>

          {
            this.props.settings.bookmarks.length === 0 ?
              <IonLabel className='uiFontX2'>請按右下角加號鈕，掃描雙重驗證 QR code。</IonLabel>
              :
              <IonList ref={this.bookmarkListRef}>
                <IonReorderGroup disabled={!this.state.reorder} onIonItemReorder={(event: CustomEvent<ItemReorderEventDetail>) => { this.reorderBookmarks(event); }}>
                  {this.getRows()}
                </IonReorderGroup>
              </IonList>
          }

          <IonFab vertical='bottom' horizontal='end' slot='fixed'>
            <IonFabButton
              onClick={e => {
                this.setState({ showScanQrCodeModal: true });
              }}
            >
              <IonIcon icon={add} />
            </IonFabButton>
          </IonFab>

          <ScanQrCodeModal
            {...{
              showModal: this.state.showScanQrCodeModal,
              finish: (result: any) => {
                this.setState({ showScanQrCodeModal: false });

                if (result == null) {
                  return;
                }
                const { issuer, account, secret } = result;

                this.props.dispatch({
                  type: "ADD_BOOKMARK",
                  bookmark: new Bookmark({
                    uuid: uuidv4(),
                    issuer,
                    account,
                    secret,
                  }),
                });
              }, ...this.props
            }}
          />

          <IonToast
            cssClass='uiFont'
            isOpen={this.state.showToast}
            onDidDismiss={() => this.setState({ showToast: false })}
            message={this.state.toastMessage}
            duration={2000}
          />
        </IonContent>
      </IonPage>
    );
  }
};

const ListPage = withIonLifeCycle(_ListPage);

const mapStateToProps = (state: any /*, ownProps*/) => {
  return {
    isLoadingData: state.tmpSettings.isLoadingData,
    tmpSettings: state.tmpSettings,
    settings: state.settings,
  }
};

//const mapDispatchToProps = {};

export default connect(
  mapStateToProps,
)(ListPage);
