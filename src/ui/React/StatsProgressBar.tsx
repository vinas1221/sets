import * as React from "react";
import LinearProgress from "@mui/material/LinearProgress";
import { TableCell, Tooltip, Typography } from "@mui/material";
import { useStyles } from "./CharacterOverview";
import { ISkillProgress } from "../../PersonObjects/formulas/skill";
import { formatExp } from "../formatNumber";

interface IProgressProps {
  min: number;
  max: number;
  current: number;
  remaining: number;
  progress: number;
  color?: React.CSSProperties["color"];
}

interface IStatsOverviewCellProps {
  progress: ISkillProgress;
  color?: React.CSSProperties["color"];
}

export function StatsProgressBar({
  min,
  max,
  current,
  remaining,
  progress,
  color,
}: IProgressProps): React.ReactElement {
  const tooltip = (
    <Typography sx={{ textAlign: "right" }}>
      <strong>Progress:</strong>&nbsp;
      {formatExp(current)} ({progress.toFixed(2)}%)
      <br />
      <strong>Remaining:</strong>&nbsp;
      {formatExp(remaining)} / {formatExp(max - min)}
    </Typography>
  );

  return (
    <Tooltip title={tooltip}>
      <LinearProgress
        variant="determinate"
        value={progress}
        sx={{
          backgroundColor: "#111111",
          "& .MuiLinearProgress-bar1Determinate": {
            backgroundColor: color,
          },
        }}
      />
    </Tooltip>
  );
}

export function StatsProgressOverviewCell({ progress: skill, color }: IStatsOverviewCellProps): React.ReactElement {
  const { classes } = useStyles();
  return (
    <TableCell
      component="th"
      scope="row"
      colSpan={2}
      classes={{ root: classes.cellNone }}
      style={{ paddingBottom: "2px", position: "relative", top: "-3px" }}
    >
      <StatsProgressBar
        min={skill.baseExperience}
        max={skill.nextExperience}
        current={skill.currentExperience}
        remaining={skill.remainingExperience}
        progress={skill.progress}
        color={color}
      />
    </TableCell>
  );
}
