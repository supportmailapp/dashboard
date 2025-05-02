# TODO

## Now

Revisialize routes-structure.

Routes-Structure:

`~` = `/g/{guildid}` (root)

- `~` | Display an overview of the config

  - Change language
  - Display ticket forum
  - Display alert channel
  - Cards to select to which sub-page to navigate

- `~/tickets` | Display the ticket config

  - "Toggle" button to enable/disable tickets
  - "Pause" button to pause tickets

    - either infinitly
    - or until a certain datetime (daisyui date input)
    - or for a certain duration (multiple (number input + duration select) = duration)

  - Display ticket forum with button to setup new one
  - Pings Section

    - \<div> as a container for all pings with select below to select pings

  - Anonymous Section

    - "Toggle" button to enable/disable anonymous replies (reponses form staff)
    - "Toggle" button to enable/disable anonymous tickets (ticket-creation by users)
    - Text input for the anonymous alias (name) of the staff (can't be edited if not premium)

  - Navigation Section | Show cards for all other configs, refer to sub-routes

    - `~/feedback` | Feedback config
    - `~/custom-messages` | Custom Messages

- `~/tickets/feedback` | Display the feedback config

  - If not set up, redirect (server) to `~~/setup` a button to setup the feedback post (request to bot-api)
  - show big error if feedback is present but no feedback-tags are set up (server: redirect to `~~/setup`)
  - \<div> as a container to show the feedback post
  - textarea to edit the "thank you" message (Markdown-Editor?)
  - \<div> for questions (Discord TextInputs)
  - NOTE: How to make reordering of questions possible?
  - upon clicking on a question, show a modal with the config of this question:

    - label (max: 45 chars)
    - style (select; [short, paragraph])
    - required (checkbox)
    - min/max length (2 number-inputs; min (min): 0, min (max): 1, max: 4000)
    - placeholder (max. 100 chars)

- `~/custom-messages` | Display the custom messages

  - Write CSS for discord copy
  - Display all custom messages with (table with pagination?)

    - Display custom message info (\_id, name, createdAt, updatedAt)
    - Display custom message in \<dialog> as markdown with controls
    - Button to add a new one (modal, same as the bot itself uses)
    - Dialog:

      - Tabs: Edit, Preview, Settings
      - Edit:

        - Components V2... (See [ICustomMessage](https://github.com/supportmailapp/global-types/blob/main/src/database/customMessage.ts))

- `~/reports` | Display the report config

  - "Toggle" button to enable/disable reports
  - "Pause" button to pause reports

    - either infinitly
    - or until a certain datetime (daisyui date input)
    - or for a certain duration (multiple (number input + duration select) = duration)

  - Display channel select for report channel with channel selected or empty
  - "Toggle" button for "Actions" (ban, kick, mute, warn)
  - Channels config

    - select ["include", "exclude"] for setting
    - \<div> as a container for all channels with select below to select channels/categories

  - Pings Section

    - \<div> as a container for all pings with select below to select pings

  - Mods Section (flex-row)

    - \<div> as a container for all mod-roles with select below to select roles
    - \<div> as a container for all mod-users with input to input user id or name (to add user)

  - Immune Section (flex-row)

    - \<div> as a container for all immune-roles with select below to select roles
    - \<div> as a container for all immune-users with input to input user id or name (to add user)

  - Limits Section (flex-col)

    - "Reports per User" - Number of open reports a user can receive (default: 1, max: 10)

      - Number input
      - Input validation (server-side)

    - "Reports per Reporter" - Number of open reports a user can create (default: 5, max: 50)

      - Number input
      - Input validation (server-side)

    - "Total Open Reports" - Number of open reports the guild can have (default: 20, max: 100)

      - Number input
      - Input validation (server-side)

    - Indicator showing current usage vs configured limits

      - Progress bar or gauge for each limit
      - Warning when approaching limits

  - Notifications Section

    - Multi-select for all things to show the reporter (leave empty for none)

      - Punishment (timeout, kick, ban, None (Ignored))
      - Report ID
      - Reason/Comment

    - Multi-select for all actions that should trigger a notification for the reporter (leave empty for none)

      - Timeout
      - Kick
      - Ban
      - None (Ignored)

- `~/tags` | Display the tags

  - button to add a new one (modal, same as the bot itself uses)
  - Display all tags with (table with pagination?)
  - Display tag info (\_id, name, createdAt, updatedAt)
  - Display tag content in \<dialog> as markdown with controls

- `~/blacklist` | Display blacklisted users & roles

  - Have a table with >all< blacklisted users & roles in a table (pagination?)
  - Cols:

    - type (user/role)
    - \_id
    - name? (click to fetch name)
    - all (is determined by other modules, or by clicking on it)
    - tickets
    - reports
    - tags

  - Make table horizontally scrollable (for mobile) = fixed width?

- `~/premium` | Premium info or purchase

  - Display premium options, if not premium sub
  - Otherwise display premium info

## Later

- Implement db migration code
  - `accessToken: JWTencoded<string>` should be converted to `tokens: JWTencoded<{ at: string, rt: string }>`
