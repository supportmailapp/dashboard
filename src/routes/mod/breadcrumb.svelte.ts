import { createContext } from "svelte";

class BreabcrumbStack {
  public readonly crumbs = $state<string[]>([]);

  push(crumb: string) {
    this.crumbs.push(crumb);
  }

  /**
   * Removes the last breadcrumb from the stack.
   */
  pop() {
    this.crumbs.pop();
  }

  /**
   * Clears all breadcrumbs from the stack.
   */
  clear() {
    this.crumbs.length = 0;
  }
}

const [get, set] = createContext<BreabcrumbStack>();

function createBreadcrumbStack() {
  return set(new BreabcrumbStack());
}

export { createBreadcrumbStack as createBreadcrumbs, get as getBreadcrumbs };
