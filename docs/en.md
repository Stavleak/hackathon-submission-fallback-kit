# Fallback submission playbook

## Decide before opening registration

Specify one primary channel, one alternate channel and the incident lead who can activate it. Describe which materials teams must include, the file limit, access restrictions and the confirmation they will receive. Publish the deadline with an explicit offset and named time zone. A fallback channel does not itself extend that deadline.

Use a managed intake form or private upload destination if those are available. An email inbox is suitable only if staffing, attachment limits, permissions and receipts have been tested. Avoid a public chat for private participant files.

## Rehearse with a fictional team

Disable access to the primary test path, send the planned notice and submit a harmless sample through the alternate path. Have another staff member issue the receipt. Reconcile the file and received time into the main submission record. Verify that a retry does not create a duplicate submission.

## Activate with a traceable notice

Record the observed failure, incident identifier, activation time and decision owner. Send the same notice to every affected participant channel. State the current deadline exactly and the next update time. Any extension is a separate authorized decision with a reason and scope.

## Issue the receipt

The organizer's receipt records team reference, received time with offset, channel, incident reference, fixed version or archive digest, materials received and status. Confirm receipt independently of the decision to accept the project. Preserve the source record instead of replacing it with the later import time.

## Freeze and verify the files

Keep the original files and an immutable manifest. Calculate hashes over the exact bytes received. The provided verifier checks relative paths, sizes and hashes, without extracting archives or executing code. Its 25 MiB per-file limit is a local tool limit, not a statement about the limits of your event or Stavleak.

The JSON Schema describes structure. Run the CLI for cross-field checks and actual file verification. Neither check authenticates the receipt or confirms permission to publish the files.

## Reconcile after recovery

Match each receipt to one event/team submission. Retain the original arrival timestamp, source and artifact digest. Mark duplicates for a human decision. Record import time separately. If the organizer accepts an exception, link it to the published rule or the authorized change log.

Close the incident with counts for received, reconciled, duplicated and unresolved records. Check that assigned judges can access the accepted fixed version. Keep private materials in the event's authorized storage and follow its retention decision.
