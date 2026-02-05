import { createContext } from "svelte";

type Breadcrumb = { label: string; href: string } | string;

class BreabcrumbStack {
  private _crumbs = $state<Breadcrumb[]>([]);

  /**
   * Returns the current stack of breadcrumbs.
   */
  get crumbs() {
    return this._crumbs;
  }

  set(...crumbs: Breadcrumb[]) {
    this._crumbs = crumbs;
  }

  push(crumb: Breadcrumb) {
    this._crumbs.push(crumb);
  }

  /**
   * Removes the last breadcrumb from the stack.
   */
  pop() {
    this._crumbs.pop();
  }

  /**
   * Clears all breadcrumbs from the stack.
   */
  clear() {
    this._crumbs.length = 0;
  }
}

const [get, set] = createContext<BreabcrumbStack>();

function createBreadcrumbStack() {
  return set(new BreabcrumbStack());
}

export { createBreadcrumbStack as createBreadcrumbs, get as getBreadcrumbs };
