"use client";

import { useState } from "react";
import { Button, Field, Modal, Textarea } from "../ui";

/** Asks why before an action that is recorded in the order history. */
export function ReasonModal({
  title,
  message,
  action,
  busy,
  onSubmit,
  onClose,
}: {
  title: string;
  message: string;
  action: string;
  busy?: boolean;
  onSubmit: (reason: string) => void;
  onClose: () => void;
}) {
  const [reason, setReason] = useState("");
  return (
    <Modal title={title} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(reason.trim());
        }}
        className="flex flex-col gap-3"
      >
        <p className="text-sm text-text-mid">{message}</p>
        <Field label="Reason *">
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} required minLength={3} maxLength={500} autoFocus />
        </Field>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Back
          </Button>
          <Button variant="danger" type="submit" busy={busy} disabled={reason.trim().length < 3}>
            {action}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
