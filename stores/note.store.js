import { makeAutoObservable } from 'mobx';

class NoteStore {
  notes = [];
  version = "0.0.0";

  constructor() {
    makeAutoObservable(this);
  }

  setVersion = (version) => {
    this.version = version;
  }
}

export default NoteStore;
