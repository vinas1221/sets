import type { PlayerObject } from "./PlayerObject";
import type { FactionName } from "@enums";
import type { Faction } from "../../Faction/Faction";

import { Factions } from "../../Faction/Factions";
import { Gang } from "../../Gang/Gang";
import { GangConstants } from "../../Gang/data/Constants";
import { isFactionWork } from "../../Work/FactionWork";
import { canAccessBitNodeFeature } from "../../BitNode/BitNodeUtils";

export function canAccessGang(this: PlayerObject): boolean {
  if (this.bitNodeOptions.disableGang) {
    return false;
  }
  if (this.bitNodeN === 2) {
    return true;
  }
  if (this.activeSourceFileLvl(2) === 0) {
    return false;
  }

  return this.karma <= GangConstants.GangKarmaRequirement;
}

export function isAwareOfGang(this: PlayerObject): boolean {
  return canAccessBitNodeFeature(2) && !this.bitNodeOptions.disableGang;
}

export function getGangFaction(this: PlayerObject): Faction {
  const gang = this.gang;
  if (gang === null) throw new Error("Cannot get gang faction because player is not in a gang.");

  const fac = Factions[gang.facName];
  if (fac == null) throw new Error(`Gang has invalid faction name: ${gang.facName}`);

  return fac;
}

export function getGangName(this: PlayerObject): FactionName | null {
  const gang = this.gang;
  return gang ? gang.facName : null;
}

export function hasGangWith(this: PlayerObject, facName: FactionName): boolean {
  const gang = this.gang;
  return gang ? gang.facName === facName : false;
}

export function startGang(this: PlayerObject, factionName: FactionName, hacking: boolean): void {
  // isFactionWork handles null internally, finishWork might need to be run with true
  if (isFactionWork(this.currentWork) && this.currentWork.factionName === factionName) this.finishWork(false);

  this.gang = new Gang(factionName, hacking);

  const fac = Factions[factionName];
  if (fac == null) {
    throw new Error(`Invalid faction name when creating gang: ${factionName}`);
  }
  fac.playerReputation = 0;
}

export function inGang(this: PlayerObject) {
  return Boolean(this.gang);
}
