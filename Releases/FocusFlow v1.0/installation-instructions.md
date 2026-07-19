# FocusFlow v1.0 - Windows Installation

## Package

- Installer: `FocusFlow.msix`
- Signer certificate: not a GitHub Release asset (export from MSIX or use local `artifacts/windows/FocusFlow-v1.0.0-x64/FocusFlow.cer`)
- Runtime prerequisites: Windows App Runtime 1.8 / VCLibs (often already installed; local `FocusFlow-dependencies-x64.zip` artifact if needed)
- Version: `1.0.0.0`
- Architecture: x64
- Publisher: `CN=catsr` (local development signing)
- Supported OS: Windows 10 version 1903 (build 18362) or newer; Windows 11 is supported

GitHub Release **FocusFlow v1.0** (`v1.0.0`) attaches exactly three files: `FocusFlow.msix`, `installation-instructions.md`, and `release-notes.md`. Published at https://github.com/diqbal2023/FocusFlow/releases/tag/v1.0.0

## Prerequisites

1. Use a 64-bit Windows 10/11 computer.
2. Install current Windows updates.
3. Use an administrator account to trust the development certificate for the local computer.
4. Download `FocusFlow.msix` from the GitHub Release; obtain the signer `.cer` by export (below) or from local packaging artifacts.
5. Ensure Microsoft Windows App Runtime 1.8 and Microsoft Visual C++ package frameworks are installed. They are often already present via Windows Update/Microsoft Store. `FocusFlow-dependencies-x64.zip` is not a GitHub Release asset; use it from local `artifacts/windows/FocusFlow-v1.0.0-x64/` if the installer reports a missing runtime.

The package includes FocusFlow, its production Hermes JavaScript bundle, and the native SQLite module. Metro and a development server are not required.

## Trust the development certificate

The public certificate is not attached to the GitHub Release. Export it from the signed MSIX, then trust that file:

```powershell
$sig = Get-AuthenticodeSignature -FilePath .\FocusFlow.msix
Export-Certificate -Cert $sig.SignerCertificate -FilePath .\FocusFlow.cer
```

Or use `artifacts/windows/FocusFlow-v1.0.0-x64/FocusFlow.cer` from the same local release build. Only trust a .cer that matches this release signer (CN=catsr).

1. Double-click `FocusFlow.cer`.
2. Select **Install Certificate**.
3. Select **Local Machine** and approve the administrator prompt.
4. Select **Place all certificates in the following store**.
5. Choose **Trusted People**, complete the wizard, and accept the security warning only after confirming the certificate subject is `CN=catsr`.

For a production release, replace this local certificate with an organization-controlled code-signing certificate. Never distribute a PFX or private key.

## Install and launch

1. If Windows reports a missing `Microsoft.WindowsAppRuntime.1.8` dependency, obtain `FocusFlow-dependencies-x64.zip` from local packaging artifacts (not the GitHub Release) and install its `.msix` first.
2. Double-click `FocusFlow.msix`.
3. Select **Install**.
4. Launch FocusFlow from the installer or the Start menu.

PowerShell alternative:

```powershell
Add-AppxPackage -Path .\FocusFlow.msix
```

The Start menu entry and installed display name are **FocusFlow**.

## Data and offline behavior

FocusFlow stores settings and tasks locally in the package's `LocalState` SQLite database. Normal package updates preserve this data. FocusFlow is offline-first and the release manifest does not request internet access.

On first launch (empty settings), FocusFlow shows a lightweight Welcome / Productivity Setup wizard for timer durations, daily goals, theme, and notification preference. Completing it saves settings and does not appear again unless you use Restore Defaults in Settings.

Uninstalling can remove local app data. Back up important information before uninstalling. The application does not currently provide export/backup.

## Uninstall

1. Close FocusFlow.
2. Open **Settings > Apps > Installed apps**.
3. Find **FocusFlow**, open its menu, and select **Uninstall**.

During Stage 20 the existing development registration was replaced (with application data preserved) by the signed package, which installed, launched, and retained all local data. Stage 21 retained that evidence; a from-scratch second physical machine was not available.

## Troubleshooting

- **The root certificate is not trusted / 0x800B0109:** export or obtain `FocusFlow.cer`, then install it into the **Local Machine > Trusted People** store. Current-user trust was insufficient on the Stage 20 test computer; the machine-level trust step resolved installation.
- **Package already installed / version conflict:** close FocusFlow, then retry. Do not remove the old package unless local data has been backed up.
- **A development version blocks installation / 0x80073CFB:** an unpackaged development registration of FocusFlow exists. Back up your data, then remove it with `Remove-AppxPackage -Package <full-name> -PreserveApplicationData` and install the MSIX again.
- **Windows protected your PC / SmartScreen:** verify the package source, filename, signer (`CN=catsr`), and release checksum before continuing. A local development certificate has no public reputation.
- **Wrong architecture:** this release asset is x64 only.
- **App will not launch:** confirm Windows build 18362 or newer, install Windows updates, and check Event Viewer > Applications and Services Logs > Microsoft > Windows > AppModel-Runtime.
- **Release build does not need Metro:** do not start `npm start`; the JavaScript/Hermes bundle is embedded.

## Known limitations

- Notification and sound settings are stored preferences. Native Windows notification delivery is deferred and was not verified.
- System tray and launch-on-startup behavior were not approved requirements and are not implemented.
- Session state and statistics completion history do not persist across restarts.
- React Native `0.86.0` and React Native Windows `0.84.0` have an existing peer-version mismatch; the validated package retains that dependency set.

