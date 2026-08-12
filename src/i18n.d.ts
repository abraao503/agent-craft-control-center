import "i18next";
import { I18nResources } from "./i18n/resources";

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "translation";
    resources: I18nResources["pt-BR"];
  }
}
