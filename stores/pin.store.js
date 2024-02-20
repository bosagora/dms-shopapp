import { makeAutoObservable } from 'mobx';

class PinStore {
  mode = '';
  code = '';
  visible = false;
  nextScreen = '';
  needPinCode = false;
  successEnter = false;

  backgrounAt = 0;
  useFooter = true;

  constructor() {
    makeAutoObservable(this);
  }

  reset() {
    this.mode = '';
    this.code = '';
    this.visible = false;
    this.nextScreen = '';
    this.needPinCode = false;
    this.successEnter = false;
    this.background = false;
    this.backgrounAt = 0;
    this.useFooter = true;
  }

  setMode = (mode) => {
    this.mode = mode;
  };

  setCode = (code) => {
    this.code = code;
  };

  setVisible = (visible) => {
    this.visible = visible;
  };
  setNextScreen = (screen) => {
    this.nextScreen = screen;
  };

  setNeedPinCode = (needPinCode) => {
    this.needPinCode = needPinCode;
  };
  setSuccessEnter = (success) => {
    this.successEnter = success;
  };

  setBackgroundAt = (time) => {
    this.backgrounAt = time;
  };

  setBackground = (bg) => {
    this.background = bg;
  };

  setUseFooter = (use) => {
    this.useFooter = use;
  };
}

export default PinStore;
