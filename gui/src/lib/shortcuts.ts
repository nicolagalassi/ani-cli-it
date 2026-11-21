// single-character shortcuts (/ and the player letters) can be switched off
// in Settings, for speech input or a keyboard that sends stray keys. Key
// handlers read this at event time, so no re-render is needed.
let enabled = true;

export const singleKeysEnabled = () => enabled;

export function setSingleKeys(on: boolean) {
  enabled = on;
  return window.ani.setSetting("singleKeyShortcuts", on);
}

export function loadSingleKeys() {
  return window.ani.settings().then((s) => {
    enabled = s.singleKeyShortcuts !== false;
    return enabled;
  });
}
