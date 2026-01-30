import { redirect } from "@sveltejs/kit";
import { ComponentType, SeparatorSpacingSize, type APIButtonComponentWithURL } from "discord-api-types/v10";
import type { SMMediaGalleryComponent } from "./sm-types/src";

type RedirectStatus = 300 | 301 | 302 | 303 | 304 | 305 | 306 | 307 | 308;

export function redirectToLoginWithError({
  status = 302,
  errKey,
  description,
}: {
  errKey?: string;
  description?: string;
  status?: RedirectStatus;
}): never {
  return redirect(
    status,
    "/login?error=" +
      (errKey || "unknown") +
      (description ? `&error_description=${encodeURIComponent(description)}` : ""),
  );
}

export function getNextPathFromGuildPath(pathname: string) {
  const match = pathname.replace(/^\/-\/\d+/, "").match(/^(\/[^/]+)?/);
  if (match) {
    return match[1] || "/";
  }
  return "/";
}

export const componentDefaults = {
  [ComponentType.TextDisplay]: { content: "Hello world" },
  [ComponentType.Container]: { components: [], accent_color: undefined, spoiler: false },
  [ComponentType.Separator]: { divider: true, spacing: SeparatorSpacingSize.Small },
  [ComponentType.ActionRow]: { components: [] as APIButtonComponentWithURL[] },
  [ComponentType.Section]: {
    components: [{ type: ComponentType.TextDisplay, content: "Hello world" }],
    accessory: undefined,
  },
  [ComponentType.MediaGallery]: { items: [{ url: "", description: "", spoiler: false }] } as Pick<
    SMMediaGalleryComponent,
    "items"
  >,
};

export const componentOptions: { label: string; type: keyof typeof componentDefaults }[] = [
  { label: "Text Display", type: ComponentType.TextDisplay },
  { label: "Action Row", type: ComponentType.ActionRow },
  { label: "Section", type: ComponentType.Section },
  { label: "Container", type: ComponentType.Container },
  { label: "Media Gallery", type: ComponentType.MediaGallery },
  { label: "Separator", type: ComponentType.Separator },
];
