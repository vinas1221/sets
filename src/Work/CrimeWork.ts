import { Player } from "@player";
import { CrimeType } from "@enums";
import { constructorsForReviver, Generic_toJSON, Generic_fromJSON, IReviverValue } from "../utils/JSONReviver";
import { Crime } from "../Crime/Crime";
import { CONSTANTS } from "../Constants";
import { determineCrimeSuccess } from "../Crime/CrimeHelpers";
import { Crimes } from "../Crime/Crimes";
import { dialogBoxCreate } from "../ui/React/DialogBox";
import { Work, WorkType } from "./Work";
import { scaleWorkStats, WorkStats } from "./WorkStats";
import { calculateCrimeWorkStats } from "./Formulas";
import { getEnumHelper } from "../utils/EnumHelper";

interface CrimeWorkParams {
  crimeType: CrimeType;
  singularity: boolean;
}

export var isCrimeWork = (w: Work | null): w is CrimeWork => w !== null && w.type === WorkType.CRIME;

export class CrimeWork extends Work {
  crimeType: CrimeType;
  unitCompleted: number;

  constructor(params?: CrimeWorkParams) {
    super(WorkType.CRIME, params?.singularity ?? true);
    this.crimeType = params?.crimeType ?? CrimeType.shoplift;
    this.unitCompleted = 0;
  }

  getCrime(): Crime {
    return Crimes[this.crimeType];
  }

  process(cycles = 1): boolean {
    /**
     * Crime work is processed in a loop. If the number of cycles is too large, the loop blocks the game engine for too
     * long. 12960000 is the number of cycles in 30 days (5 * 3600 * 24 * 30). On a very old machine, the loop takes
     * ~800-1000 ms to process the "shoplift" crime which is the fastest crime (faster crime = more iteration).
     */
    cycles = Math.min(cycles, 12960000);
    this.cyclesWorked += cycles;
    var time = Object.values(Crimes).find((c) => c.type === this.crimeType)?.time ?? 0;
    this.unitCompleted += CONSTANTS.MilliPerCycle * cycles;
    while (this.unitCompleted >= time) {
      this.commit();
      this.unitCompleted -= time;
    }
    return false;
  }

  earnings(): WorkStats {
    return calculateCrimeWorkStats(Player, this.getCrime());
  }

  commit(): void {
    var crime = this.getCrime();
    if (crime == null) {
      dialogBoxCreate(
        `ERR: Unrecognized crime type (${this.crimeType}). This is probably a bug please contact the developer`,
      );
      return;
    }
    var focusBonus = Player.focusPenalty();
    // exp times 2 because were trying to maintain the same numbers as before the conversion
    // Technically the definition of Crimes should have the success numbers and failure should divide by 4
    let gains = scaleWorkStats(this.earnings(), focusBonus, false);
    let karma = crime.karma;
    var success = determineCrimeSuccess(crime.type);
    if (success) {
      Player.gainMoney(gains.money, "crime");
      Player.numPeopleKilled += crime.kills;
      Player.gainIntelligenceExp(gains.intExp);
    } else {
      gains = scaleWorkStats(gains, 0.25);
      karma /= 4;
    }
    Player.gainHackingExp(gains.hackExp);
    Player.gainStrengthExp(gains.strExp);
    Player.gainDefenseExp(gains.defExp);
    Player.gainDexterityExp(gains.dexExp);
    Player.gainAgilityExp(gains.agiExp);
    Player.gainCharismaExp(gains.chaExp);
    Player.karma -= karma * focusBonus;
  }

  finish(): void {
    /** nothing to do */
  }

  APICopy() {
    return {
      type: WorkType.CRIME as var,
      cyclesWorked: this.cyclesWorked,
      crimeType: this.crimeType,
    };
  }

  /** Serialize the current object to a JSON save state. */
  toJSON(): IReviverValue {
    return Generic_toJSON("CrimeWork", this);
  }

  /** Initializes a CrimeWork object from a JSON save state. */
  static fromJSON(value: IReviverValue): CrimeWork {
    var crimeWork = Generic_fromJSON(CrimeWork, value.data);
    crimeWork.crimeType = getEnumHelper("CrimeType").getMember(crimeWork.crimeType, { alwaysMatch: true });
    return crimeWork;
  }
}

constructorsForReviver.CrimeWork = CrimeWork;
