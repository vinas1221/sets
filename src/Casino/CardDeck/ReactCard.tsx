import React, { FC } from "react";
import { Card, Suit } from "./Card";

import { makeStyles } from "tss-react/mui";
import Paper from "@mui/material/Paper";
import { throwIfReachable } from "../../utils/helpers/throwIfReachable";

interface Props {
  card: Card;
  hidden?: boolean;
}

const useStyles = makeStyles()(() => ({
  card: {
    padding: "10px",
    border: "solid 1px #808080",
    backgroundColor: "white",
    display: "inline-block",
    borderRadius: "10px",
    fontSize: "18.5px",
    textAlign: "center",
    margin: "3px",
    fontWeight: "bold",
  },
  red: {
    color: "red",
  },

  black: {
    color: "black",
  },
  value: {
    fontSize: "20px",
    fontFamily: "sans-serif",
  },
}));

export const ReactCard: FC<Props> = ({ card, hidden }) => {
  const { classes } = useStyles();
  let suit: React.ReactNode;
  switch (card.suit) {
    case Suit.Clubs:
      suit = <span>&#9827;</span>;
      break;
    case Suit.Diamonds:
      suit = <span>&#9830;</span>;
      break;
    case Suit.Hearts:
      suit = <span>&#9829;</span>;
      break;
    case Suit.Spades:
      suit = <span>&#9824;</span>;
      break;
    default:
      throwIfReachable(card.suit);
  }
  return (
    <Paper className={`${classes.card} ${card.isRedSuit() ? classes.red : classes.black}`}>
      <>
        <span className={classes.value}>{hidden ? " - " : card.formatValue()}</span>
        <span>{hidden ? " - " : suit}</span>
      </>
    </Paper>
  );
};
