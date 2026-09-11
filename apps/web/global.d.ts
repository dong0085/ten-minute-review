import type { MessagesShape, UiLocale } from "@tmr/core";

declare module "next-intl" {
  interface AppConfig {
    Locale: UiLocale;
    Messages: MessagesShape;
  }
}
