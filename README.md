# RSVPDesktop

A lightweight Electron desktop app for daily named reminders with gentle synthesized alarms. Reminder definitions and window preferences are stored locally and restored when the app is reopened. Reminders run while the app is open.

## Features

- Create multiple named daily alarms, enable/disable or remove them.
- Pick a time by typing into the time field or use the analog clock: drag/click to select the hour and minute, then choose AM/PM.
- Choose among Soft chime, Mellow bells, and Singing bowl; preview sounds before saving.
- Set the lead time from 1 to 60 minutes.
- Alarm list and settings persist across app restarts on the same Windows account.

## Run from source

Install Node.js 20 or later, then run in the repository root:

```powershell
npm install
npm start
```

## Build the Windows 11 64-bit installer

On Windows, run:

```powershell
npm run dist
```

The x64 NSIS installer is generated in `release/`. The packaged app includes Electron, so end users do not need Node.js or an SDK.

Alarms are daily recurring. They are saved locally on the device and will be checked when the app is next opened; an alarm whose reminder window was missed while the app was closed will not play retroactively.
