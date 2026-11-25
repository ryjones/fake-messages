# fake-messages

A mock text message conversation builder, in the spirit of fake-text-message
generators. Fill in a contact, a status bar and a list of messages; the page
draws a phone screen and saves it as a PNG.

- Plain HTML, CSS and JavaScript: no build step, no dependencies, no network
  calls. The conversation is kept in the browser's `localStorage`.
- The screen is drawn on a `<canvas>` 1170 pixels wide, so the download is the
  preview, pixel for pixel. It starts at 1170 × 2532 and grows taller to fit
  the whole conversation instead of scrolling.
- Group chats: fill in the group name and the header shows it instead of the
  contact. List the other people under group members, comma separated; each
  received message then has a list to pick its sender from, shown above the
  bubble with a coloured avatar beside it. In a named group the contact is a
  member too, and the default sender. Members without a group name also make
  a group, titled by the contact field.
- Blue (iMessage) or green (SMS) bubbles, light or dark appearance, timestamp
  rows, Delivered / Read / Not Delivered receipts, contact photo or initials.
- Other styles from the same conversation: WhatsApp, Signal and LINE phone
  screens, and an irssi terminal window. These print a time on every message:
  each message has an optional time field, and a blank one carries on from the
  message or timestamp row above it. The receipt setting becomes ticks
  (WhatsApp, Signal) or "Read" (LINE).
- irssi draws a 1200 pixel wide terminal instead of a phone. Set your own nick
  in the editor. The group name field becomes the channel name (the `#` is
  added if missing); listing group members, or a contact name starting with
  `#`, also turns the window into a channel.
- Status bar with carrier (Kyivstar by default), signal, connection type,
  clock, battery level and charging state. The carrier is free text, with a
  pick list of the two largest carriers in Japan, the Netherlands, Singapore,
  Ukraine and the USA.

## Run locally

Open `index.html` in a browser, or serve the directory:

```sh
python3 -m http.server 8000
```

## GitHub Pages

In the repository settings, under **Pages**, choose **Deploy from a branch**,
branch `main`, folder `/ (root)`. The `.nojekyll` file tells Pages to serve the
files as they are.

## Use

This is for jokes, mockups and storyboards. Do not use generated images to
deceive, defraud or harass anyone.
