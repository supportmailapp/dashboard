import { createContext } from "svelte";

class SnowflakeControls {
  public intensity = $state(5);

  constructor(intensity: number = 5) {
    this.intensity = intensity;
  }
}

const [get, set] = createContext<SnowflakeControls>();

export const getSnowflakes = get;

export function setSnowflakes() {
  return set(new SnowflakeControls(1));
}
