import type { ChatJumperSettings } from "../shared/settings";
import {
  readSettings,
  writeSettings,
  type SettingsStorageArea
} from "../shared/settingsStorage";
import {
  getHighlightDurationControl,
  getOptionsToggleRows,
  type OptionsBooleanSettingKey
} from "./viewModel";

const root = document.querySelector<HTMLElement>(
  "[data-chatjumper-options-root]"
);

if (root) {
  void bootOptions(root);
}

export async function bootOptions(
  rootElement: HTMLElement,
  storageArea: SettingsStorageArea = chrome.storage.local
): Promise<void> {
  const settings = await readSettings(storageArea);
  renderOptions(rootElement, settings, storageArea);
}

function renderOptions(
  rootElement: HTMLElement,
  settings: ChatJumperSettings,
  storageArea: SettingsStorageArea
): void {
  rootElement.replaceChildren();
  rootElement.append(
    createHeader(),
    createSettingsSection(settings, storageArea),
    createGuidanceSection(),
    createPrivacySection(),
    createSupportSection(),
    createStatus()
  );
}

function createHeader(): HTMLElement {
  const header = document.createElement("header");
  header.className = "cj-options__header";

  const title = document.createElement("h1");
  title.className = "cj-options__title";
  title.textContent = "ChatJumper Options";

  const subtitle = document.createElement("p");
  subtitle.className = "cj-options__subtitle";
  subtitle.textContent =
    "Detailed settings for jumping back to your latest ChatGPT question.";

  header.append(title, subtitle);
  return header;
}

function createSettingsSection(
  settings: ChatJumperSettings,
  storageArea: SettingsStorageArea
): HTMLElement {
  const section = createSection("Settings");
  const list = document.createElement("div");
  list.className = "cj-options__list";

  for (const row of getOptionsToggleRows(settings)) {
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

  list.append(createDurationControl(settings, storageArea));
  section.append(list);
  return section;
}

function createToggleRow(
  key: OptionsBooleanSettingKey,
  labelText: string,
  descriptionText: string,
  checked: boolean,
  storageArea: SettingsStorageArea
): HTMLElement {
  const label = document.createElement("label");
  label.className = "cj-setting";

  const text = document.createElement("span");
  text.className = "cj-setting__text";

  const title = document.createElement("span");
  title.className = "cj-setting__label";
  title.textContent = labelText;

  const description = document.createElement("span");
  description.className = "cj-setting__description";
  description.textContent = descriptionText;

  const checkbox = document.createElement("input");
  checkbox.className = "cj-setting__input";
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

function createDurationControl(
  settings: ChatJumperSettings,
  storageArea: SettingsStorageArea
): HTMLElement {
  const control = getHighlightDurationControl(settings);
  const wrapper = document.createElement("label");
  wrapper.className = "cj-setting cj-duration";

  const text = document.createElement("span");
  text.className = "cj-setting__text";

  const title = document.createElement("span");
  title.className = "cj-setting__label";
  title.textContent = control.label;

  const description = document.createElement("span");
  description.className = "cj-setting__description";
  description.textContent = control.description;

  const input = document.createElement("input");
  input.className = "cj-duration__input";
  input.type = "number";
  input.min = String(control.min);
  input.max = String(control.max);
  input.step = String(control.step);
  input.value = String(control.value);
  input.addEventListener("change", () => {
    void writeSettings(
      {
        highlightDurationMs: Number(input.value)
      },
      storageArea
    );
  });

  text.append(title, description);
  wrapper.append(text, input);
  return wrapper;
}

function createGuidanceSection(): HTMLElement {
  const section = createSection("Shortcut");
  const copy = document.createElement("p");
  copy.className = "cj-options__copy";
  copy.textContent =
    "Use Alt+J on Windows/Linux or Command+J on macOS. You can remap the shortcut from chrome://extensions/shortcuts.";
  section.append(copy);
  return section;
}

function createPrivacySection(): HTMLElement {
  const section = createSection("Privacy");
  section.id = "privacy";

  const copy = document.createElement("p");
  copy.className = "cj-options__copy";
  copy.textContent =
    "ChatJumper stores settings in this Chrome profile only. It does not store chat text, send conversation content to a server, or include analytics.";
  section.append(copy);
  return section;
}

function createSupportSection(): HTMLElement {
  const section = createSection("Support");
  section.id = "support";

  const copy = document.createElement("p");
  copy.className = "cj-options__copy";
  copy.textContent =
    "Use the Product Site support page for bug reports, privacy questions, and Chrome Web Store support requests.";
  section.append(copy);
  return section;
}

function createStatus(): HTMLElement {
  const status = document.createElement("p");
  status.className = "cj-options__status";
  status.textContent = "Composer button status appears here when unavailable.";
  return status;
}

function createSection(titleText: string): HTMLElement {
  const section = document.createElement("section");
  section.className = "cj-options__section";

  const title = document.createElement("h2");
  title.className = "cj-options__section-title";
  title.textContent = titleText;

  section.append(title);
  return section;
}
