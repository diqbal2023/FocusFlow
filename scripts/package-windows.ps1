[CmdletBinding()]
param(
    [string]$CertificateThumbprint = $env:FOCUSFLOW_CERT_THUMBPRINT,
    [switch]$CreateDevelopmentCertificate,
    [string]$OutputDirectory
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$repoRoot = Split-Path -Parent $PSScriptRoot
$manifestPath = Join-Path $repoRoot 'windows\FocusFlow.Package\Package.appxmanifest'
$packageProject = Join-Path $repoRoot 'windows\FocusFlow.Package\FocusFlow.Package.wapproj'
$solutionPath = Join-Path $repoRoot 'windows\FocusFlow.sln'
$solutionDirectory = (Join-Path $repoRoot 'windows').TrimEnd('\') + '\'

if (-not $OutputDirectory) {
    $OutputDirectory = Join-Path $repoRoot 'artifacts\windows\FocusFlow-v1.0.0-x64'
}
$OutputDirectory = [System.IO.Path]::GetFullPath($OutputDirectory)

$vswhere = Join-Path ${env:ProgramFiles(x86)} 'Microsoft Visual Studio\Installer\vswhere.exe'
if (-not (Test-Path $vswhere)) {
    throw "vswhere.exe was not found at '$vswhere'. Install Visual Studio with MSBuild and C++ desktop tools."
}

$msbuild = & $vswhere -latest -products * -requires Microsoft.Component.MSBuild -find 'MSBuild\**\Bin\MSBuild.exe' |
    Select-Object -First 1
if (-not $msbuild -or -not (Test-Path $msbuild)) {
    throw 'A supported MSBuild installation was not found.'
}

[xml]$manifest = Get-Content -Raw $manifestPath
$publisher = $manifest.Package.Identity.Publisher
if (-not $publisher) {
    throw 'The package manifest does not define an Identity Publisher.'
}

if ($CreateDevelopmentCertificate) {
    if ($CertificateThumbprint) {
        throw 'Use either -CreateDevelopmentCertificate or -CertificateThumbprint, not both.'
    }

    $certificate = New-SelfSignedCertificate `
        -Type Custom `
        -Subject $publisher `
        -FriendlyName 'FocusFlow local MSIX development signing' `
        -CertStoreLocation 'Cert:\CurrentUser\My' `
        -KeyAlgorithm RSA `
        -KeyLength 2048 `
        -HashAlgorithm SHA256 `
        -KeyUsage DigitalSignature `
        -KeyExportPolicy NonExportable `
        -TextExtension @('2.5.29.37={text}1.3.6.1.5.5.7.3.3') `
        -NotAfter (Get-Date).AddYears(2)

    $temporaryCertificate = Join-Path $env:TEMP "FocusFlow-$([guid]::NewGuid()).cer"
    try {
        Export-Certificate -Cert $certificate -FilePath $temporaryCertificate -Force | Out-Null
        Import-Certificate -FilePath $temporaryCertificate -CertStoreLocation 'Cert:\CurrentUser\Root' |
            Out-Null
        Import-Certificate -FilePath $temporaryCertificate -CertStoreLocation 'Cert:\CurrentUser\TrustedPeople' |
            Out-Null
    }
    finally {
        Remove-Item $temporaryCertificate -Force -ErrorAction SilentlyContinue
    }
    $CertificateThumbprint = $certificate.Thumbprint
}

if (-not $CertificateThumbprint) {
    throw 'Provide -CertificateThumbprint, set FOCUSFLOW_CERT_THUMBPRINT, or use -CreateDevelopmentCertificate.'
}

$CertificateThumbprint = $CertificateThumbprint.Replace(' ', '').ToUpperInvariant()
$signingCertificate = Get-Item "Cert:\CurrentUser\My\$CertificateThumbprint" -ErrorAction Stop
if (-not $signingCertificate.HasPrivateKey) {
    throw 'The selected certificate does not have a private key.'
}
if ($signingCertificate.Subject -ne $publisher) {
    throw "Certificate subject '$($signingCertificate.Subject)' does not match manifest publisher '$publisher'."
}
if ($signingCertificate.NotAfter -le (Get-Date)) {
    throw 'The selected certificate has expired.'
}

New-Item -ItemType Directory -Force -Path $OutputDirectory | Out-Null
$appxPackageDir = $OutputDirectory.TrimEnd('\') + '\'

$commonProperties = @(
    '/p:Configuration=Release',
    '/p:Platform=x64',
    '/p:UseBundle=true',
    '/p:UseHermes=true',
    '/p:AppxBundle=Never',
    "/p:SolutionDir=$solutionDirectory"
)

Write-Host "Restoring $solutionPath"
& $msbuild $solutionPath /restore /m @commonProperties
if ($LASTEXITCODE -ne 0) {
    throw "MSBuild restore failed with exit code $LASTEXITCODE."
}

Write-Host "Building and packaging $solutionPath"
& $msbuild $solutionPath `
    /restore `
    /t:Rebuild `
    /m `
    @commonProperties `
    '/p:GenerateAppxPackageOnBuild=true' `
    '/p:UapAppxPackageBuildMode=SideloadOnly' `
    '/p:AppxPackageSigningEnabled=true' `
    "/p:PackageCertificateThumbprint=$CertificateThumbprint" `
    "/p:AppxPackageDir=$appxPackageDir"
if ($LASTEXITCODE -ne 0) {
    throw "Release package build failed with exit code $LASTEXITCODE."
}

$generatedPackage = Get-ChildItem -Path $OutputDirectory -Filter '*.msix' -File -Recurse |
    Where-Object Name -ne 'FocusFlow.msix' |
    Sort-Object LastWriteTimeUtc -Descending |
    Select-Object -First 1
if (-not $generatedPackage) {
    $generatedPackage = Get-ChildItem -Path (Split-Path $packageProject) -Filter '*.msix' -File -Recurse |
        Where-Object Name -ne 'FocusFlow.msix' |
        Sort-Object LastWriteTimeUtc -Descending |
        Select-Object -First 1
}
if (-not $generatedPackage) {
    throw 'MSBuild succeeded, but no generated .msix package was found.'
}

$releasePackage = Join-Path $OutputDirectory 'FocusFlow.msix'
Copy-Item $generatedPackage.FullName $releasePackage -Force

$signature = Get-AuthenticodeSignature $releasePackage
if ($signature.Status -ne 'Valid') {
    throw "The generated MSIX signature is not valid: $($signature.StatusMessage)"
}
$publicCertificate = Join-Path $OutputDirectory 'FocusFlow.cer'
Export-Certificate -Cert $signature.SignerCertificate -FilePath $publicCertificate -Force | Out-Null
$x64Dependencies = Get-ChildItem -Path $OutputDirectory -Directory -Recurse |
    Where-Object { $_.Name -eq 'x64' -and $_.Parent.Name -eq 'Dependencies' } |
    Select-Object -First 1
$dependencyArchive = Join-Path $OutputDirectory 'FocusFlow-dependencies-x64.zip'
if ($x64Dependencies) {
    Compress-Archive -Path (Join-Path $x64Dependencies.FullName '*') -DestinationPath $dependencyArchive -Force
}

Write-Host "Release package: $releasePackage"
Write-Host "Public certificate: $publicCertificate"
if ($x64Dependencies) {
    Write-Host "x64 dependencies: $dependencyArchive"
}
Write-Host "Generated package: $($generatedPackage.FullName)"
Write-Host "Signer: $($signature.SignerCertificate.Subject)"
