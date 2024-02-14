import { makeAutoObservable } from 'mobx';

class SecretStore {
  pKey = '';
  address = '';
  mnemonic = '';

  showQRSheet = false;
  showTermSheet = false;
  showPrivacySheet = false;

  constructor() {
    makeAutoObservable(this);
  }
  reset(){
    this.pKey = '';
    this.address = '';
    this.mnemonic = '';

    this.showQRSheet = false;
    this.showTermSheet = false;
    this.showPrivacySheet = false;
  }
  setPKey = (key) => {
    this.pKey = key;
  };

  setAddress = (address) => {
    this.address = address;
  };

  setMnemonic = (mnemonic) => {
    this.mnemonic = mnemonic;
  };

  setShowQRSheet = (show) => {
    this.showQRSheet = show;
  };
  setShowTermSheet = (show) => {
    this.showTermSheet = show;
  };
  setShowPrivacySheet = (show) => {
    this.showPrivacySheet = show;
  };
}

export default SecretStore;
