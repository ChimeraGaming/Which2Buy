# Which Handheld Should I Buy?

[Live Site](https://chimeragaming.github.io/Which2Buy/)

I made this for people trying to figure out which handheld actually makes sense without getting pushed straight to the most expensive option.

If you are buying your first device, it helps narrow things down. If you already own something, it helps you figure out whether an upgrade is worth it or if you should just keep what you have.

The goal is simple. Pick what you actually play, estimate the storage you really need, and get a recommendation that feels honest.

## What It Does

- Lets you pick the systems you actually care about
- Estimates storage based on the games you plan to keep installed
- Factors in RAM, performance, and form factor
- Checks whether an SD card changes the better buy
- Lets you log your current handheld brand and model for ownership context
- Compares directly against your current device when that model is already in the live pool
- Shows a best fit, cheaper alternatives, and future proof options
- Explains when an upgrade is probably not worth it

## Included Files

- `index.html`
- `changelog.html`
- `styles.css`
- `app.js`
- `devices.js`
- `systems.js`
- `rules.js`

## Run It Locally

Open PowerShell in this folder and run:

```powershell
py -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## Notes

- The tool uses local config files for supported devices and systems
- It is meant to be honest, not just push the most expensive model
- The live recommendation pool currently covers official AYN, Retroid, ANBERNIC, AYANEO, Powkiddy, and Miyoo handhelds
- Xbox and PS3 are still very early use cases and should not be the only reason to buy a device
