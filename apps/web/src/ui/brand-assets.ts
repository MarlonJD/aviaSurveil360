import type { IconKey } from "../app/route-contracts";

export const BRAND_ASSET_SOURCES: {
  mark: string;
  loginTexture: string;
  dmSansVariable: string;
  icons: Readonly<Record<IconKey, string>>;
} = {
  mark: "../../../../assets/login/aviasurveil360-mark.png",
  loginTexture: "../../../../assets/login/airspace-texture.png",
  dmSansVariable: "../../../../assets/fonts/dm-sans/DMSans-Variable.ttf",
  icons: {
    assignments: "../../../../assets/icons/phosphor/air-traffic-control.svg",
    leadReview: "../../../../assets/icons/phosphor/seal-check.svg",
    dashboard: "../../../../assets/icons/phosphor/compass.svg",
    planning: "../../../../assets/icons/phosphor/globe-hemisphere-west.svg",
    organizations: "../../../../assets/icons/phosphor/buildings.svg",
    finance: "../../../../assets/icons/phosphor/wallet.svg",
    reports: "../../../../assets/icons/phosphor/bank.svg",
    templates: "../../../../assets/icons/phosphor/gear.svg",
    profile: "../../../../assets/icons/phosphor/globe-hemisphere-west.svg",
    notifications: "../../../../assets/icons/phosphor/seal-check.svg",
    logout: "../../../../assets/icons/phosphor/arrow-right.svg",
    menu: "../../../../assets/icons/phosphor/compass.svg",
  },
} as const;

export const BRAND_ASSETS: {
  mark: string;
  loginTexture: string;
  dmSansVariable: string;
  icons: Readonly<Record<IconKey, string>>;
} = {
  mark: new URL("../../../../assets/login/aviasurveil360-mark.png", import.meta.url).href,
  loginTexture: new URL("../../../../assets/login/airspace-texture.png", import.meta.url).href,
  dmSansVariable: new URL(
    "../../../../assets/fonts/dm-sans/DMSans-Variable.ttf",
    import.meta.url,
  ).href,
  icons: {
    assignments: new URL(
      "../../../../assets/icons/phosphor/air-traffic-control.svg",
      import.meta.url,
    ).href,
    leadReview: new URL("../../../../assets/icons/phosphor/seal-check.svg", import.meta.url).href,
    dashboard: new URL("../../../../assets/icons/phosphor/compass.svg", import.meta.url).href,
    planning: new URL(
      "../../../../assets/icons/phosphor/globe-hemisphere-west.svg",
      import.meta.url,
    ).href,
    organizations: new URL("../../../../assets/icons/phosphor/buildings.svg", import.meta.url).href,
    finance: new URL("../../../../assets/icons/phosphor/wallet.svg", import.meta.url).href,
    reports: new URL("../../../../assets/icons/phosphor/bank.svg", import.meta.url).href,
    templates: new URL("../../../../assets/icons/phosphor/gear.svg", import.meta.url).href,
    profile: new URL(
      "../../../../assets/icons/phosphor/globe-hemisphere-west.svg",
      import.meta.url,
    ).href,
    notifications: new URL(
      "../../../../assets/icons/phosphor/seal-check.svg",
      import.meta.url,
    ).href,
    logout: new URL("../../../../assets/icons/phosphor/arrow-right.svg", import.meta.url).href,
    menu: new URL("../../../../assets/icons/phosphor/compass.svg", import.meta.url).href,
  },
} as const;
