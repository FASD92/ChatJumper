import { bootContent } from "./controller";

if (typeof chrome !== "undefined" && chrome.runtime?.onMessage) {
  void bootContent();
}
