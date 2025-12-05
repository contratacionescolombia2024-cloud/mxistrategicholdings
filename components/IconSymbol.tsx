
// This file is a fallback for using MaterialIcons on Android and web.

import React from "react";
import { SymbolWeight } from "expo-symbols";
import {
  OpaqueColorValue,
  StyleProp,
  TextStyle,
  ViewStyle,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

// Add your SFSymbol to MaterialIcons mappings here.
const MAPPING = {
  // See MaterialIcons here: https://icons.expo.fyi
  // See SF Symbols in the SF Symbols app on Mac.

  // Navigation & Home
  "house.fill": "home",
  "house": "home",
  "arrow.left": "arrow-back",
  "arrow.right": "arrow-forward",
  "arrow.up": "arrow-upward",
  "arrow.down": "arrow-downward",
  "chevron.left": "chevron-left",
  "chevron.right": "chevron-right",
  "chevron.up": "keyboard-arrow-up",
  "chevron.down": "keyboard-arrow-down",
  "arrow.clockwise": "refresh",
  "arrow.counterclockwise": "refresh",
  "arrow.up.circle.fill": "arrow-circle-up",
  "arrow.down.circle.fill": "arrow-circle-down",
  "arrow.up.circle": "arrow-circle-up",
  "arrow.down.circle": "arrow-circle-down",

  // Communication & Social
  "paperplane.fill": "send",
  "paperplane": "send",
  "envelope.fill": "mail",
  "envelope": "mail",
  "envelope.open": "drafts",
  "phone.fill": "phone",
  "phone": "phone",
  "message.fill": "chat",
  "message": "chat",
  "bubble.left.fill": "chat-bubble",
  "bubble.left": "chat-bubble",
  "bell.fill": "notifications",
  "bell": "notifications",
  "heart.fill": "favorite",
  "heart": "favorite-border",

  // Actions & Controls
  "plus": "add",
  "plus.circle.fill": "add-circle",
  "plus.circle": "add-circle",
  "minus": "remove",
  "minus.circle.fill": "remove-circle",
  "xmark": "close",
  "xmark.circle.fill": "cancel",
  "xmark.circle": "cancel",
  "checkmark": "check",
  "checkmark.circle.fill": "check-circle",
  "checkmark.circle": "check-circle",
  "checkmark.square.fill": "check-box",
  "checkmark.square": "check-box",
  "checkmark.seal.fill": "verified",
  "checkmark.shield.fill": "verified-user",
  "checkmark.shield": "verified-user",
  "multiply": "clear",
  "trash.fill": "delete",
  "trash": "delete",

  // Editing & Creation
  "pencil": "edit",
  "pencil.fill": "edit",
  "pencil.and.list.clipboard": "edit-note",
  "square.and.pencil": "edit",
  "doc.text.fill": "description",
  "doc.text": "description",
  "doc.on.doc": "content-copy",
  "doc.on.doc.fill": "content-copy",
  "folder.fill": "folder",
  "folder": "folder",
  "doc.fill": "insert-drive-file",
  "doc": "insert-drive-file",
  "tray.fill": "inbox",
  "tray": "inbox",

  // Media & Content
  "photo.fill": "image",
  "photo": "image",
  "camera.fill": "camera-alt",
  "camera": "camera-alt",
  "video.fill": "videocam",
  "video": "videocam",
  "music.note": "music-note",
  "speaker.wave.2.fill": "volume-up",
  "speaker.slash.fill": "volume-off",
  "play.fill": "play-arrow",
  "pause.fill": "pause",
  "stop.fill": "stop",
  "mic.fill": "mic",
  "mic": "mic",
  "mic.slash.fill": "mic-off",

  // System & Settings
  "gear": "settings",
  "gearshape.fill": "settings",
  "slider.horizontal.3": "tune",
  "info.circle.fill": "info",
  "info.circle": "info",
  "exclamationmark.triangle.fill": "warning",
  "exclamationmark.triangle": "warning",
  "exclamationmark.circle.fill": "error",
  "exclamationmark.circle": "error",
  "questionmark.circle.fill": "help",
  "questionmark.circle": "help",

  // Shapes & Symbols
  "square": "square",
  "square.grid.3x3": "apps",
  "circle": "circle",
  "circle.fill": "circle",
  "triangle.fill": "change-history",
  "star.fill": "star",
  "star": "star-border",
  "bookmark.fill": "bookmark",
  "bookmark": "bookmark-border",
  "gift.fill": "card-giftcard",
  "equal.circle.fill": "drag-handle",
  "equal.circle": "drag-handle",

  // Technology & Code
  "chevron.left.forwardslash.chevron.right": "code",
  "qrcode.viewfinder": "qr-code-scanner",
  "qrcode": "qr-code",
  "wifi": "wifi",
  "antenna.radiowaves.left.and.right": "signal-cellular-alt",
  "battery.100": "battery-full",
  "battery.25": "battery-2-bar",
  "lock.fill": "lock",
  "lock": "lock",
  "lock.open.fill": "lock-open",
  "lock.open": "lock-open",

  // Shopping & Commerce
  "cart.fill": "shopping-cart",
  "cart": "shopping-cart",
  "creditcard.fill": "credit-card",
  "creditcard": "credit-card",
  "dollarsign.circle.fill": "attach-money",
  "dollarsign.circle": "attach-money",
  "banknote.fill": "payments",
  "banknote": "payments",
  "bag.fill": "shopping-bag",
  "bag": "shopping-bag",

  // Location & Maps
  "location.fill": "location-on",
  "location": "location-on",
  "map.fill": "map",
  "map": "map",
  "compass.drawing": "explore",

  // Time & Calendar
  "clock.fill": "schedule",
  "clock": "schedule",
  "calendar": "event",
  "calendar.fill": "event",
  "timer": "timer",

  // User & Profile
  "person": "person",
  "person.fill": "person",
  "person.2.fill": "people",
  "person.2": "people",
  "person.3.fill": "group",
  "person.3": "group",
  "person.circle.fill": "account-circle",
  "person.circle": "account-circle",
  "person.crop.circle.fill": "account-circle",
  "person.crop.circle": "account-circle",
  "person.badge.shield.checkmark": "verified-user",

  // Sharing & Export
  "square.and.arrow.up": "share",
  "square.and.arrow.down": "download",
  "arrow.up.doc.fill": "upload-file",
  "link": "link",

  // Search & Discovery
  "magnifyingglass": "search",
  "line.3.horizontal.decrease": "filter-list",
  "arrow.up.arrow.down": "sort",

  // Visibility & Display
  "eye": "visibility",
  "eye.fill": "visibility",
  "eye.slash": "visibility-off",
  "eye.slash.fill": "visibility-off",
  "lightbulb.fill": "lightbulb",
  "lightbulb": "lightbulb",
  "moon.fill": "dark-mode",
  "sun.max.fill": "light-mode",

  // Crypto & Finance
  "bitcoinsign.circle.fill": "currency-bitcoin",
  "target": "track-changes",

  // Charts & Analytics
  "chart.line.uptrend.xyaxis": "trending-up",
  "chart.bar.fill": "bar-chart",
  "chart.bar": "bar-chart",

  // Gestures & Interaction
  "hand.tap.fill": "touch-app",
  "hand.tap": "touch-app",

  // Games & Entertainment
  "gamecontroller.fill": "sports-esports",
  "gamecontroller": "sports-esports",
  "trophy.fill": "emoji-events",
  "trophy": "emoji-events",
  "ticket.fill": "confirmation-number",
  "ticket": "confirmation-number",
  "flag.fill": "flag",
  "flag": "flag",

  // Security & Authentication
  "shield.fill": "security",
  "shield": "security",
  "shield.checkmark.fill": "verified-user",
  "shield.checkmark": "verified-user",

  // Actions & Utilities
  "arrow.triangle.merge": "merge-type",
  "arrow.triangle.swap": "swap-vert",
  "rectangle.portrait.and.arrow.right": "logout",
  "rectangle.portrait.and.arrow.left": "login",
  "wrench.and.screwdriver": "build",
  "wrench.and.screwdriver.fill": "build",

  // Numbers & Badges
  "number.circle.fill": "badge",
  "number.circle": "badge",
  "number": "tag",

  // Additional wallet and balance icons
  "wallet.fill": "account-balance-wallet",
  "wallet": "account-balance-wallet",
  "account.balance.wallet": "account-balance-wallet",
  
  // Additional icons
  "checkmark.seal": "verified",
  "arrow.clockwise.circle.fill": "refresh",
} as Partial<
  Record<
    import("expo-symbols").SymbolViewProps["name"],
    React.ComponentProps<typeof MaterialIcons>["name"]
  >
>;

export type IconSymbolName = keyof typeof MAPPING;

/**
 * An icon component that uses native SFSymbols on iOS, and MaterialIcons on Android and web. This ensures a consistent look across platforms, and optimal resource usage.
 *
 * Icon `name`s are based on SFSymbols and require manual mapping to MaterialIcons.
 */
export function IconSymbol({
  name,
  ios_icon_name,
  android_material_icon_name,
  size = 24,
  color,
  style,
}: {
  name?: IconSymbolName;
  ios_icon_name?: IconSymbolName;
  android_material_icon_name?: string;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<ViewStyle>;
  weight?: SymbolWeight;
}) {
  // Support both prop patterns
  const iconName = name || ios_icon_name;
  let materialIconName = android_material_icon_name || (iconName ? MAPPING[iconName] : undefined);

  // Convert underscores to hyphens for Material Icons
  // This handles cases where developers use underscores instead of hyphens
  if (materialIconName && typeof materialIconName === 'string') {
    materialIconName = materialIconName.replace(/_/g, '-');
  }

  if (!materialIconName) {
    console.warn(`IconSymbol: No mapping found for icon "${iconName}". Using fallback icon.`);
    // Return a fallback icon instead of null to avoid question marks
    return (
      <MaterialIcons
        color={color}
        size={size}
        name="help-outline"
        style={style as StyleProp<TextStyle>}
      />
    );
  }

  return (
    <MaterialIcons
      color={color}
      size={size}
      name={materialIconName as any}
      style={style as StyleProp<TextStyle>}
    />
  );
}
