import React from "react";
import { DarkWebItems } from "./DarkWebItems";
import { formatMoney } from "../ui/formatNumber";
import { Player } from "@player";
import { Terminal } from "../Terminal";
import { SpecialServers } from "../Server/data/SpecialServers";
import { Money } from "../ui/React/Money";
import { DarkWebItem } from "./DarkWebItem";
import { isCreateProgramWork } from "../Work/CreateProgramWork";

//Posts a "help" message if connected to DarkWeb
export function checkIfConnectedToDarkweb(): void {
  const server = Player.getCurrentServer();
  if (server !== null && SpecialServers.DarkWeb == server.hostname) {
    Terminal.print(
      "You are now connected to the dark web. From the dark web you can purchase illegal items. " +
        "Use the 'buy -l' command to display a list of all the items you can buy. Use 'buy [item-name]' " +
        "to purchase an item. Use 'buy -a' to purchase all unowned items. You can use the 'buy' command anywhere, " +
        "not only when connecting to the 'darkweb' server.",
    );
  }
}

export function listAllDarkwebItems(): void {
  for (const key of Object.keys(DarkWebItems) as (keyof typeof DarkWebItems)[]) {
    const item = DarkWebItems[key];

    const cost = Player.getHomeComputer().programs.includes(item.program) ? (
      <span style={{ color: `green` }}>[OWNED]</span>
    ) : (
      <Money money={item.price} />
    );

    Terminal.printRaw(
      <>
        <span>{item.program}</span> - <span>{cost}</span> - <span>{item.description}</span>
      </>,
    );
  }
}

export function buyDarkwebItem(itemName: string): void {
  itemName = itemName.toLowerCase();

  // find the program that matches, if any
  let item: DarkWebItem | null = null;

  for (const key of Object.keys(DarkWebItems) as (keyof typeof DarkWebItems)[]) {
    const i = DarkWebItems[key];
    if (i.program.toLowerCase() == itemName) {
      item = i;
    }
  }

  // return if invalid
  if (item === null) {
    Terminal.error("Unrecognized item: " + itemName);
    return;
  }

  // return if the player already has it.
  if (Player.hasProgram(item.program)) {
    Terminal.print("You already have the " + item.program + " program");
    return;
  }

  // return if the player doesn't have enough money
  if (Player.money < item.price) {
    Terminal.error("Not enough money to purchase " + item.program);
    return;
  }

  // buy and push
  Player.loseMoney(item.price, "other");

  Player.getHomeComputer().pushProgram(item.program);
  // Cancel if the program is in progress of writing
  if (isCreateProgramWork(Player.currentWork) && Player.currentWork.programName === item.program) {
    Player.finishWork(true);
  }

  Terminal.print(
    "You have purchased the " + item.program + " program. The new program can be found on your home computer.",
  );
}

export function buyAllDarkwebItems(): void {
  const itemsToBuy: DarkWebItem[] = [];

  for (const key of Object.keys(DarkWebItems) as (keyof typeof DarkWebItems)[]) {
    const item = DarkWebItems[key];
    if (!Player.hasProgram(item.program)) {
      itemsToBuy.push(item);
      if (item.price > Player.money) {
        Terminal.error("Need " + formatMoney(item.price - Player.money) + " more to purchase " + item.program);
        return;
      } else {
        buyDarkwebItem(item.program);
      }
    }
  }

  if (itemsToBuy.length === 0) {
    Terminal.print("All available programs have been purchased already.");
    return;
  }

  if (itemsToBuy.length > 0) {
    Terminal.print("All programs have been purchased.");
    return;
  }
}
