import React from "react";

import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import { Player } from "@player";
import { Engine } from "../../engine";
import { dialogBoxCreate } from "../../ui/React/DialogBox";

// Update as additional BitNodes get implemented

export function TimeSkip(): React.ReactElement {
  function timeskip(time: number) {
    return () => {
      Player.lastUpdate -= time;
      Engine._lastUpdate -= time;
      dialogBoxCreate("Time skip effect has been applied");
    };
  }

  return (
    <Accordion TransitionProps={{ unmountOnExit: true }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography>Time skip</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Button onClick={timeskip(60 * 1000)}>1 minute</Button>
        <Button onClick={timeskip(60 * 60 * 1000)}>1 hour</Button>
        <Button onClick={timeskip(24 * 60 * 60 * 1000)}>1 day</Button>
      </AccordionDetails>
    </Accordion>
  );
}
