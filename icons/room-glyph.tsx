import type { IconProps } from "./types";
import { PantryRoomIcon } from "./rooms/pantry";
import { BasementRoomIcon } from "./rooms/basement";
import { KitchenRoomIcon } from "./rooms/kitchen";
import { FridgeRoomIcon } from "./rooms/fridge";
import { FreezerRoomIcon } from "./rooms/freezer";
import { SpiceRoomIcon } from "./rooms/spice";
import { GarageRoomIcon } from "./rooms/garage";

export type RoomGlyphName =
  | "pantry"
  | "basement"
  | "kitchen"
  | "fridge"
  | "freezer"
  | "spice"
  | "garage";

export const ROOM_GLYPHS: RoomGlyphName[] = [
  "pantry",
  "basement",
  "kitchen",
  "fridge",
  "freezer",
  "spice",
  "garage",
];

export function RoomGlyph({ name, size = 22, className }: { name: string } & IconProps) {
  switch (name) {
    case "pantry": {
      return <PantryRoomIcon size={size} className={className} />;
    }
    case "basement": {
      return <BasementRoomIcon size={size} className={className} />;
    }
    case "kitchen": {
      return <KitchenRoomIcon size={size} className={className} />;
    }
    case "fridge": {
      return <FridgeRoomIcon size={size} className={className} />;
    }
    case "freezer": {
      return <FreezerRoomIcon size={size} className={className} />;
    }
    case "spice": {
      return <SpiceRoomIcon size={size} className={className} />;
    }
    case "garage": {
      return <GarageRoomIcon size={size} className={className} />;
    }
    default: {
      return (
        <svg viewBox="0 0 22 22" width={size} height={size} fill="none" className={className}>
          <rect x="3" y="3" width="16" height="16" stroke="currentColor" strokeWidth="1.3" />
        </svg>
      );
    }
  }
}
