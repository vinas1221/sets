import type { Bladeburner } from "../Bladeburner";

import React from "react";
import { OperationElem } from "./OperationElem";
import { Typography } from "@mui/material";

interface OperationPageProps {
  bladeburner: Bladeburner;
}

export function OperationPage({ bladeburner }: OperationPageProps): React.ReactElement {
  const operations = Object.values(bladeburner.operations);
  return (
    <>
      <Typography>
        Carry out operations for the Bladeburner division. Failing an operation will reduce your Bladeburner rank. It
        will also cause you to lose HP, which can lead to hospitalization. In general, operations are harder and more
        punishing than contracts, but are also more rewarding.
        <br />
        <br />
        Operations can affect the chaos level and Synthoid population of your current city. The exact effects vary
        between different Operations.
        <br />
        <br />
        For operations, you can use a team. You must first recruit team members. Having a larger team will improve your
        chances of success.
        <br />
        <br />
        You can unlock higher-level operations by successfully completing them. Higher-level operations are more
        difficult, but grant more rank and experience.
      </Typography>
      {operations.map((operation) => (
        <OperationElem key={operation.name} bladeburner={bladeburner} action={operation} />
      ))}
    </>
  );
}
