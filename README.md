# fake-messages

A mock text message conversation builder, in the spirit of fake-text-message
generators. Fill in a contact, a status bar and a list of messages; the page
draws a phone screen and saves it as a PNG.

- Plain HTML, CSS and JavaScript: no build step, no dependencies, no network
  calls. The conversation is kept in the browser's `localStorage`.
- The screen is drawn on a `<canvas>` 1170 pixels wide, so the download is the
  preview, pixel for pixel. It starts at 1170 × 2532 and grows taller to fit
  the whole conversation instead of scrolling.
- Group chats: give a received message a sender name and the name is shown
  above the bubble, with a coloured avatar beside it.
- Blue (iMessage) or green (SMS) bubbles, light or dark appearance, timestamp
  rows, Delivered / Read / Not Delivered receipts, contact photo or initials.
- Other styles from the same conversation: WhatsApp, Signal and LINE phone
  screens, and an irssi terminal window. These print a time on every message:
  each message has an optional time field, and a blank one carries on from the
  message or timestamp row above it. The receipt setting becomes ticks
  (WhatsApp, Signal) or "Read" (LINE).
- irssi draws a 1200 pixel wide terminal instead of a phone. Set your own nick
  in the editor; a sender name on any message, or a contact name starting with
  `#`, turns the window into a channel.
- Status bar with carrier (Kyivstar by default), signal, connection type,
  clock, battery level and charging state.

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
