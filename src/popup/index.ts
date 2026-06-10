import type { ChatJumperSettings } from "../shared/settings";
import {
  readSettings,
  writeSettings,
  type SettingsStorageArea
} from "../shared/settingsStorage";
import {
  getPopupToggleRows,
  type PopupBooleanSettingKey
} from "./viewModel";

const root = document.querySelector<HTMLElement>(
  "[data-chatjumper-popup-root]"
);

if (root) {
  void bootPopup(root);
}

export async function bootPopup(
  rootElement: HTMLElement,
  storageArea: SettingsStorageArea = chrome.storage.local
): Promise<void> {
  const settings = await readSettings(storageArea);
  renderPopup(rootElement, settings, storageArea);
}

function renderPopup(
  rootElement: HTMLElement,
  settings: ChatJumperSettings,
  storageArea: SettingsStorageArea
): void {
  rootElement.replaceChildren();
  rootElement.append(
    createHeader(),
    createToggleList(settings, storageArea),
    createStatus()
  );
}

function createHeader(): HTMLElement {
  const header = document.createElement("section");
  header.className = "cj-popup__header";

  const title = document.createElement("h1");
  title.className = "cj-popup__title";
  title.textContent = "ChatJumper";

  const subtitle = document.createElement("p");
  subtitle.className = "cj-popup__subtitle";
  subtitle.textContent =
    "Quick settings for jumping back to your latest question.";

  header.append(title, subtitle);
  return header;
}

function createToggleList(
  settings: ChatJumperSettings,
  storageArea: SettingsStorageArea
): HTMLElement {
  const list = document.createElement("section");
  list.className = "cj-popup__list";

  for (const row of getPopupToggleRows(settings)) {
    list.append(
      createToggleRow(
        row.key,
        row.label,
        row.description,
        row.checked,
        storageArea
      )
    );
  }

  return list;
}

function createToggleRow(
  key: PopupBooleanSettingKey,
  labelText: string,
  descriptionText: string,
  checked: boolean,
  storageArea: SettingsStorageArea
): HTMLElement {
  const label = document.createElement("label");
  label.className = "cj-toggle";

  const text = document.createElement("span");
  text.className = "cj-toggle__text";

  const title = document.createElement("span");
  title.className = "cj-toggle__label";
  title.textContent = labelText;

  const description = document.createElement("span");
  description.className = "cj-toggle__description";
  description.textContent = descriptionText;

  const checkbox = document.createElement("input");
  checkbox.className = "cj-toggle__input";
  checkbox.type = "checkbox";
  checkbox.checked = checked;
  checkbox.addEventListener("change", () => {
    void writeSettings(
      {
        [key]: checkbox.checked
      },
      storageArea
    );
  });

  text.append(title, description);
  label.append(text, checkbox);
  return label;
}

function createStatus(): HTMLElement {
  const status = document.createElement("p");
  status.className = "cj-popup__status";
  status.textContent = "Composer button status appears here when unavailable.";
  return status;
}
