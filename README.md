# RSVPDesktop

A lightweight Electron desktop app for alarms and reminders. It opens separate configuration and live alarm-monitor windows. Named alarms, settings, and imported reminders persist locally between app restarts.

## Features

- Configure multiple named daily alarms, edit/remove/enable them, choose one of three gentle sounds, and select times by typing or with the draggable analog clock.
- View each alarm's time and live time-remaining countdown in a separate monitor window.
- Paste reminder lines such as `Fafnir/Nidhogg (4): 5:55:42 PM in 7 hours`; the trailing count is ignored, the relative duration schedules a one-time reminder, and imported alarms are saved across restarts.
- Window opacity and alarm flash preferences.

## Run from source

Install Node.js 20 or later, then from the repository root:

```powershell
npm install
npm start
```

## Build the Windows 11 64-bit installer

On Windows:

```powershell
npm run dist
```

The x64 NSIS installer is generated in `release/`. The packaged app includes Electron, so end users do not need Node.js or an SDK.

Text import accepts one reminder per line in the format `Name: h:mm[:ss] AM/PM in N hours` or `... in N minutes`. The relative duration is used to calculate the one-time reminder instant; imported reminders use the currently selected sound and five-minute lead time by default. Existing daily alarms continue repeating daily. Reminders are evaluated while the app is running and checked when it opens; missed reminders that are already past their target are marked complete rather than played late.
