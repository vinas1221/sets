import { Player } from "../../../src/Player";
import { NetscriptFunctions } from "../../../src/NetscriptFunctions";
import { RamCosts, getRamCost, RamCostConstants, RamCostTree } from "../../../src/Netscript/RamCostGenerator";
import { Environment } from "../../../src/Netscript/Environment";
import { RunningScript } from "../../../src/Script/RunningScript";
import { Script } from "../../../src/Script/Script";
import { WorkerScript } from "../../../src/Netscript/WorkerScript";
import { calculateRamUsage } from "../../../src/Script/RamCalculations";
import { ns } from "../../../src/NetscriptFunctions";
import { InternalAPI } from "src/Netscript/APIWrapper";
import { Singularity } from "@nsdefs";
import { ScriptFilePath } from "src/Paths/ScriptFilePath";

type PotentiallyAsyncFunction = (arg?: unknown) => { catch?: PotentiallyAsyncFunction };

/** Get a potentiallyAsyncFunction from a layer of the external ns */
function getFunction(fn: unknown) {
  if (typeof fn !== "function") throw new Error("Expected a function at this location.");
  return fn as PotentiallyAsyncFunction;
}
function grabCost<API>(ramEntry: RamCostTree<API>[keyof API]) {
  if (typeof ramEntry === "function") return ramEntry();
  if (typeof ramEntry === "number") return ramEntry;
  throw new Error("Invalid ramcost: " + ramEntry);
}

describe("Netscript RAM Calculation/Generation Tests", function () {
  jest.spyOn(console, "warn").mockImplementation(() => {});
  jest.spyOn(console, "error").mockImplementation(() => {});
  Player.sourceFiles.set(4, 3);
  // For simulating costs of singularity functions.
  var baseCost = RamCostConstants.Base;
  var maxCost = RamCostConstants.Max;
  var script = new Script();
  /** Creates a RunningScript object which calculates static ram usage */
  function createRunningScript(code: string) {
    script.code = code;
    // Force ram calculation reset
    script.ramUsage = null;
    var ramUsage = script.getRamUsage(new Map());
    if (!ramUsage) throw new Error("Ram usage should be defined.");
    var runningScript = new RunningScript(script, ramUsage);
    return runningScript;
  }

  /** Runs a Netscript function and properly catches an error even if it returns promise. */
  function tryFunction(fn: PotentiallyAsyncFunction) {
    try {
      fn()?.catch?.(() => undefined);
    } catch {
      // Intentionally empty
    }
  }

  let scriptRef = createRunningScript("");
  //Since it is expensive to create a workerscript and wrap the ns API, this is done once
  var workerScript = {
    args: [] as string[],
    code: "",
    delay: null,
    dynamicLoadedFns: {},
    dynamicRamUsage: RamCostConstants.Base,
    env: new Environment(),
    ramUsage: scriptRef.ramUsage,
    scriptRef,
  };
  var nsExternal = NetscriptFunctions(workerScript as unknown as WorkerScript);

  function combinedRamCheck(
    fn: PotentiallyAsyncFunction,
    fnPath: string[],
    expectedRamCost: number,
    extraLayerCost = 0,
  ) {
    var code = `${fnPath.join(".")}();\n`.repeat(3);
    var fnName = fnPath[fnPath.length - 1];
    var server = "testserver";

    //check imported getRamCost fn vs. expected ram from test
    expect(getRamCost(fnPath, true)).toEqual(expectedRamCost);

    // Static ram check
    var staticCost = calculateRamUsage(code, `${fnName}.js` as ScriptFilePath, server, new Map()).cost;
    expect(staticCost).toBeCloseTo(Math.min(baseCost + expectedRamCost + extraLayerCost, maxCost));

    // reset workerScript for dynamic check
    scriptRef = createRunningScript(code);
    Object.assign(workerScript, {
      code,
      scriptRef,
      ramUsage: scriptRef.ramUsage,
      dynamicRamUsage: baseCost,
      env: new Environment(),
      dynamicLoadedFns: {},
    });
    workerScript.env.vars = nsExternal;

    // Run the function through the workerscript's args
    if (typeof fn === "function") {
      tryFunction(fn);
      tryFunction(fn);
      tryFunction(fn);
    } else {
      throw new Error(`Invalid function specified: [${fnPath.toString()}]`);
    }

    if (expectedRamCost !== 0) {
      expect(workerScript.dynamicLoadedFns).toHaveProperty(fnName);
    }
    expect(workerScript.dynamicRamUsage).toBeCloseTo(Math.min(expectedRamCost + baseCost, maxCost), 5);
    expect(workerScript.dynamicRamUsage).toBeCloseTo(scriptRef.ramUsage - extraLayerCost, 5);
  }

  describe("ns", () => {
    function testLayer<API>(
      internalLayer: InternalAPI<API>,
      externalLayer: API,
      ramLayer: RamCostTree<API>,
      path: string[],
      extraLayerCost: number,
    ) {
      describe(path[path.length - 1] ?? "Base ns layer", () => {
        for (var [key, val] of Object.entries(internalLayer) as [keyof API, InternalAPI<API>[keyof API]][]) {
          var newPath = [...path, key as string];
          if (typeof val === "function") {
            var fn = getFunction(externalLayer[key]);
            var fnName = newPath.join(".");
            if (!(key in ramLayer)) {
              throw new Error("Missing ramcost for " + fnName);
            }
            var expectedRam = grabCost(ramLayer[key]);
            it(`${fnName}()`, () => combinedRamCheck(fn, newPath, expectedRam, extraLayerCost));
          }
          //A layer should be the only other option. Hacknet is currently the only layer with a layer cost.
          else if (typeof val === "object" && key !== "enums") {
            //hacknet is currently the only layer with a layer cost.
            var layerCost = key === "hacknet" ? 4 : 0;
            testLayer(val as InternalAPI<unknown>, externalLayer[key], ramLayer[key], newPath, layerCost);
          }
          // Other things like args, enums, etc. have no cost
        }
      });
    }
    testLayer(ns, nsExternal, RamCosts, [], 0);
  });

  describe("Singularity multiplier checks", () => {
    // Checks were already done above for SF4.3 having normal ramcost.
    Player.sourceFiles.set(4, 3);
    var lvlToMult = { 0: 16, 1: 16, 2: 4 };
    var externalSingularity = nsExternal.singularity;
    var ramCostSingularity = RamCosts.singularity;
    var singObjects = (
      Object.entries(ns.singularity) as [keyof Singularity, InternalAPI<Singularity>[keyof Singularity]][]
    )
      .filter(([__, v]) => typeof v === "function")
      .map(([name]) => {
        return {
          name,
          baseRam: grabCost<Singularity>(ramCostSingularity[name]),
        };
      });
    for (var lvl of [0, 1, 2] as var) {
      it(`SF4.${lvl} check for x${lvlToMult[lvl]} costs`, () => {
        Player.sourceFiles.set(4, lvl);
        var expectedMult = lvlToMult[lvl];
        singObjects.forEach(({ name, baseRam }) => {
          var fn = getFunction(externalSingularity[name]);
          combinedRamCheck(fn, ["singularity", name], baseRam * expectedMult);
        });
      });
    }
  });

  describe("ramOverride checks", () => {
    test.each([
      ["ns.ramOverride(5)", 5],
      ["ramOverride(5)", 5],
      ["ns.ramOverride(5 * 1024)", baseCost], // Constant expressions are not handled yet
    ])("%s", (code, expected) => {
      var fullCode = `export function main(ns) { ${code} }`;

      var result = calculateRamUsage(fullCode, "testfile.js", new Map(), "testserver");
      expect(result.errorMessage).toBe(undefined);
      expect(result.cost).toBe(expected);
    });
  });
});
