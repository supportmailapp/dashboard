export class ReactiveSnippet {
  public _id = $state<undefined | string>(undefined);
  private _name = $state("");
  private _content = $state("");

  constructor() {}

  sanitizeName(str: string) {
    // 1+ spaces -> 1 space + trim
    // uppercase -> lowercase
    // only a-z0-9_ and space in general (delete everything else)
    // limit to 50 characters
    return str
      .replace(/\s+/g, " ")
      .toLowerCase()
      .replace(/[^a-z0-9_ ]/g, "")
      .slice(0, 50);
  }

  get name() {
    return this._name;
  }

  get content() {
    return this._content;
  }

  set name(val: string) {
    // has to match the regex [a-z0-9_ ]{3,50} and can only have 1 space max in between
    // We don't check the name, we sanitize it
    this._name = this.sanitizeName(val);
  }

  set content(val: string) {
    this._content = val;
  }

  clear() {
    this._name = "";
    this._content = "";
  }
}
