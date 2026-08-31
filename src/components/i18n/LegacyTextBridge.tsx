import { useEffect } from "react";
import i18n from "@/i18n/index";
import { enUS, esES } from "@/i18n/resources";
import { legacyTranslations } from "@/i18n/legacyTranslations";
import { legacyTranslationsExtra } from "@/i18n/legacyTranslationsExtra";

const translatableAttributes = ["placeholder", "title", "aria-label", "aria-description"];
const originalText = new WeakMap<Text, string>();
const originalAttributes = new WeakMap<Element, Map<string, string>>();
const reverseLegacy = new Map<string, string>();
const legacySources = new Set<string>();

function registerLegacyCatalog(catalog: Record<string, string>) {
  for (const [source, translated] of Object.entries(catalog)) {
    legacySources.add(source);
    reverseLegacy.set(translated, source);
  }
}

registerLegacyCatalog(esES.legacy);
registerLegacyCatalog(legacyTranslations);
registerLegacyCatalog(legacyTranslationsExtra);
registerLegacyCatalog(enUS.legacy);

function translate(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return value;
  const source = reverseLegacy.get(trimmed) ?? trimmed;
  const translated = i18n.language === "es-ES"
    ? esES.legacy[source as keyof typeof esES.legacy] ?? legacyTranslations[source] ?? legacyTranslationsExtra[source] ?? source
    : i18n.language === "en-US"
      ? enUS.legacy[source as keyof typeof enUS.legacy] ?? source
      : source;
  if (translated === trimmed) return value;
  return value.replace(trimmed, translated);
}

function resolveLegacySource(value: string, rememberedSource?: string) {
  const trimmed = value.trim();
  const catalogSource =
    reverseLegacy.get(trimmed) ??
    (legacySources.has(trimmed) ? trimmed : undefined);

  if (catalogSource) return catalogSource;
  if (rememberedSource && trimmed === rememberedSource) return rememberedSource;
  return undefined;
}

function shouldSkip(element: Element | null) {
  return Boolean(element?.closest("script,style,code,pre,[data-i18n-skip='true']"));
}

function translateTree(root: Node) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const texts: Text[] = [];
  let node: Node | null;
  while ((node = walker.nextNode())) texts.push(node as Text);

  for (const textNode of texts) {
    if (shouldSkip(textNode.parentElement)) continue;
    const current = textNode.nodeValue ?? "";
    const rememberedSource = originalText.get(textNode);
    const source = resolveLegacySource(current, rememberedSource);

    // React owns dynamic text nodes (counts, timestamps, customer content,
    // statuses, etc.). The bridge must not remember or rewrite those values.
    if (!source) {
      originalText.delete(textNode);
      continue;
    }

    originalText.set(textNode, source);
    const nextValue = i18n.language === "pt-BR" ? source : translate(source);
    if (current !== nextValue) textNode.nodeValue = nextValue;
  }

  const elements = root instanceof Element ? [root, ...Array.from(root.querySelectorAll("*"))] : Array.from((root as Document).querySelectorAll("*"));
  for (const element of elements) {
    if (shouldSkip(element)) continue;
    let attributes = originalAttributes.get(element);
    if (!attributes) {
      attributes = new Map();
      originalAttributes.set(element, attributes);
    }
    for (const attribute of translatableAttributes) {
      const current = element.getAttribute(attribute);
      if (current === null) continue;
      const resolvedSource = resolveLegacySource(current, attributes.get(attribute));
      if (!resolvedSource) {
        attributes.delete(attribute);
        continue;
      }
      attributes.set(attribute, resolvedSource);
      const nextValue = i18n.language === "pt-BR" ? resolvedSource : translate(resolvedSource);
      if (current !== nextValue) element.setAttribute(attribute, nextValue);
    }
  }
}

/**
 * Translates the remaining legacy literal labels while individual screens are
 * migrated to use useTranslation. It is deliberately limited to the reviewed
 * legacy catalog and never touches user-provided message content.
 */
export function LegacyTextBridge() {
  useEffect(() => {
    let updating = false;
    const apply = () => {
      if (updating) return;
      updating = true;
      translateTree(document.body);
      updating = false;
    };
    const observer = new MutationObserver(apply);
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
      // Attribute mutations are applied explicitly on languageChanged. Not
      // observing them avoids a self-triggering loop when setAttribute runs.
    });
    const handleLanguageChanged = () => apply();
    i18n.on("languageChanged", handleLanguageChanged);
    apply();
    return () => {
      observer.disconnect();
      i18n.off("languageChanged", handleLanguageChanged);
    };
  }, []);
  return null;
}
