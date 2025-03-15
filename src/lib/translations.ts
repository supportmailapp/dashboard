// @ts-nocheck

const AVAILABLE_KEYS = ["global", "errors", "commands", "tickets", "reports", "labels", "permissions", "tips"];

type TranslationModules = "global" | "errors" | "commands" | "tickets" | "reports" | "labels" | "tips" | "permissions";

class Translation {
  constructor() {}

  static async loadLanguages(...languages: string[]): Promise<void> {
    // Clear the old languages from memory
    global.availableLanguages = languages ?? ["en", "anonymNicknames"];
    global.languages = {};

    for (const lang of global.availableLanguages) {
      try {
        const languageData = await import(`../supportmail-locales/${lang}.json`, { with: { type: "json" } });
        global.languages[lang] = languageData.default;
      } catch (error) {
        console.error(`Failed to load language ${lang}:`, error);
      }
    }
  }

  static getModule(
    key: Omit<TranslationModules, "logs" | "commands" | "tickets" | "reports">,
    language: string,
  ): { [key: string]: string };
  static getModule(
    key: Extract<TranslationModules, "commands" | "tickets" | "reports">,
    language: string,
  ): { [key: string]: string | string[] };

  /**
   * Returns a whole module of translations (good for permissions and other things that require multiple translations)
   */
  static getModule(key: string, language: string): { [key: string]: string } {
    language = this.getLanguage(language);
    const l = global.languages[`${language}`];
    return l[AVAILABLE_KEYS.includes(key) ? key : "global"];
  }

  // For anonymous nicknames
  static async getAnonymNickname(language: string): Promise<string> {
    const meta = {
      animals: global.anonymNicknames.animals,
      colors: global.anonymNicknames.colors,
      animalCount: global.anonymNicknames.animals.length as number,
      colorCount: global.anonymNicknames.colors.length as number,
    };

    const nick = `${meta.colors[Math.floor(Math.random() * meta.colorCount)]} ${
      meta.animals[Math.floor(Math.random() * meta.animalCount)]
    }`;

    let translatedNick = String(nick);
    try {
      translatedNick = await DeeplClient.translateText(
        nick,
        "en",
        (language == "en" ? "en-US" : language) as TargetLanguageCode,
      );
    } catch (error) {
      console.error("Failed to translate nickname:", error);
    }

    return translatedNick;
  }

  /**
   * Returns a single translation
   */
  static get(path: string, language: string, data: { [key: string]: any } = {}, commands: ApplicationCommandManager = null) {
    language = this.getLanguage(language);

    const l = global.languages[`${language}`];
    const keys = path.split(".");
    let c = l;

    for (const key of keys) {
      if (c && key in c) {
        c = c[key];
        if (typeof c === "string" || Array.isArray(c)) break;
        continue;
      }
    }

    if (!c || !(typeof c === "string" || Array.isArray(c))) {
      return path;
    }

    let t: string;
    if (Array.isArray(c)) t = c.join("\n");
    else t = c;

    let cmdMap: Map<string, string>;
    if (commands) {
      cmdMap = new Map(commands.cache.map((c, id) => [c.name, id]));
    }

    return t.replace(/\{([^{}]+)\}/gi, (_: any, vName: string) => {
      if (vName.startsWith("command") && commands) {
        const commandName = vName.split(":")[1];
        const commandId = cmdMap.get(commandName.split(" ")[0]);
        return `</${commandName}:${commandId}>`;
      } else {
        return `${data[vName]}`;
      }
    });
  }

  static getLanguage(language: string) {
    if (typeof language != "string") {
      language = "en";
    } else {
      if (language && language.length != 2) language = language.slice(0, 2);
      if (!language || !global.availableLanguages?.includes(language)) language = "en";
    }

    return language;
  }
}

export default Translation;
