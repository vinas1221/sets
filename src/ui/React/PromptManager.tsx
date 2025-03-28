import React, { useState, useEffect } from "react";
import { EventEmitter } from "../../utils/EventEmitter";
import { Modal } from "./Modal";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import { KEY } from "../../utils/KeyboardEventKey";

export const PromptEvent = new EventEmitter<[Prompt]>();

interface Prompt {
  txt: string;
  options?: { type?: string; choices?: string[] };
  resolve: (result: boolean | string) => void;
}

export function PromptManager({ hidden }: { hidden: boolean }): React.ReactElement {
  const [prompt, setPrompt] = useState<Prompt | null>(null);

  const resolveCurrentPromptWithDefaultValue = (currentPrompt: Prompt) => {
    if (["text", "select"].includes(currentPrompt.options?.type ?? "")) {
      currentPrompt.resolve("");
    } else {
      currentPrompt.resolve(false);
    }
  };

  useEffect(() => {
    return PromptEvent.subscribe((newPrompt: Prompt) => {
      setPrompt((currentPrompt) => {
        if (currentPrompt) {
          resolveCurrentPromptWithDefaultValue(currentPrompt);
        }
        return newPrompt;
      });
    });
  }, []);

  function close(): void {
    if (prompt === null) {
      return;
    }
    resolveCurrentPromptWithDefaultValue(prompt);
    setPrompt(null);
  }

  const types: Record<string, (props: IContentProps) => React.ReactElement> = {
    text: PromptMenuText,
    select: PromptMenuSelect,
  };

  let PromptContent = PromptMenuBoolean;
  if (prompt?.options?.type && ["text", "select"].includes(prompt.options.type)) {
    PromptContent = types[prompt.options.type];
  }
  const resolve = (value: boolean | string): void => {
    prompt?.resolve(value);
    setPrompt(null);
  };

  return (
    <Modal open={!hidden && prompt !== null} onClose={close}>
      {prompt && (
        <>
          <pre>
            <Typography>{prompt.txt}</Typography>
          </pre>
          <PromptContent prompt={prompt} resolve={resolve} />
        </>
      )}
    </Modal>
  );
}

interface IContentProps {
  prompt: Prompt;
  resolve: (value: boolean | string) => void;
}

function PromptMenuBoolean({ resolve }: IContentProps): React.ReactElement {
  const yes = (): void => resolve(true);
  const no = (): void => resolve(false);

  return (
    <>
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", paddingTop: "10px" }}>
        <Button style={{ marginRight: "auto" }} onClick={yes}>
          Yes
        </Button>
        <Button onClick={no}>No</Button>
      </div>
    </>
  );
}

function PromptMenuText({ prompt, resolve }: IContentProps): React.ReactElement {
  const [value, setValue] = useState("");

  const submit = (): void => {
    resolve(value);
    setValue("");
  };

  useEffect(() => {
    setValue("");
  }, [prompt]);

  const onInput = (event: React.ChangeEvent<HTMLInputElement>): void => {
    setValue(event.target.value);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>): void => {
    event.stopPropagation();

    if (event.key === KEY.ENTER) {
      event.preventDefault();
      submit();
    }
  };

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", paddingTop: "10px" }}>
        <TextField
          autoFocus
          value={value}
          onInput={onInput}
          onKeyDown={onKeyDown}
          style={{ flex: "1 0 auto" }}
          InputProps={{
            endAdornment: <Button onClick={submit}>Confirm</Button>,
          }}
        />
      </div>
    </>
  );
}

function PromptMenuSelect({ prompt, resolve }: IContentProps): React.ReactElement {
  const [value, setValue] = useState("");

  const submit = (): void => {
    resolve(value);
    setValue("");
  };

  useEffect(() => {
    setValue("");
  }, [prompt]);

  const onChange = (event: SelectChangeEvent): void => {
    setValue(event.target.value);
  };

  const getItems = (choices: string[]): React.ReactElement[] => {
    const content: React.ReactElement[] = [];
    for (const i of choices) {
      content.push(
        <MenuItem key={i} value={i}>
          {i}
        </MenuItem>,
      );
    }
    return content;
  };

  if (!Array.isArray(prompt.options?.choices)) {
    return <Typography>Error: Please provide an array of string choices</Typography>;
  }

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", paddingTop: "10px" }}>
        <Select
          onChange={onChange}
          value={prompt.options?.choices.includes(value) ? value : ""}
          style={{ flex: "1 0 auto" }}
        >
          {getItems(prompt.options?.choices || [])}
        </Select>
        <Button onClick={submit} disabled={value === ""}>
          Confirm
        </Button>
      </div>
    </>
  );
}
