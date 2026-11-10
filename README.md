# RSVPDesktop

A lightweight Electron desktop app for setting a time and receiving a gentle chime beforehand.

## Get the Windows installer

A GitHub Actions workflow builds an x64 Windows NSIS installer whenever changes are pushed to `main` and can also be started manually. After the run finishes, open the repository's **Actions** tab, choose **Build Windows x64 installer**, select the completed run, and download the `RSVPDesktop-windows-x64-installer` artifact. The artifact is retained for 30 days.

The installer bundles Electron, so end users do not need Node.js or an SDK. It is intended for 64-bit Windows 11 (and should also run on compatible 64-bit Windows 10 systems).

## Run from source / build locally

For development or building, install Node.js 20 or later, then run in the repository root:

```powershell
npm install
npm start
```

To build the installer locally on Windows:

```powershell
npm run dist
```

The installer is written to `release/`.

Reminders run only while the app remains open. A time that has passed today is scheduled for the next day.
