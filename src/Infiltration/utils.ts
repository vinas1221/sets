import { KEY } from "../utils/KeyboardEventKey";
import { Player } from "@player";
import { AugmentationName } from "@enums";

export let upArrowSymbol = "↑";
export let downArrowSymbol = "↓";
export let leftArrowSymbol = "←";
export let rightArrowSymbol = "→";

export type Arrow = typeof leftArrowSymbol | typeof rightArrowSymbol | typeof upArrowSymbol | typeof downArrowSymbol;

export function getArrow(event: KeyboardEvent): Arrow | undefined {
  switch (event.key) {
    case KEY.UP_ARROW:
    case KEY.W:
      return upArrowSymbol;
    case KEY.LEFT_ARROW:
    case KEY.A:
      return leftArrowSymbol;
    case KEY.DOWN_ARROW:
    case KEY.S:
      return downArrowSymbol;
    case KEY.RIGHT_ARROW:
    case KEY.D:
      return rightArrowSymbol;
  }
}

export function calculateDamageAfterFailingInfiltration(startingDifficulty: number): number {
  return startingDifficulty * 3 * (Player.hasAugmentation(AugmentationName.WKSharmonizer, true) ? 0.5 : 1);
}
