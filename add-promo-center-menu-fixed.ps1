param(
  [string]$ProjectRoot = (Get-Location).Path
)

$ErrorActionPreference = 'Stop'

$adminPage = Join-Path $ProjectRoot 'apps\restaurant\app\admin\page.tsx'
$restaurantDir = Join-Path $ProjectRoot 'apps\restaurant'

if (-not (Test-Path $adminPage)) {
  throw "File not found: $adminPage`nRun this script from the dawu-platform project root."
}

$content = Get-Content -Path $adminPage -Raw -Encoding UTF8
$original = $content

if ($content -notmatch 'href="/admin/promo-codes"') {
  $desktopInsert = @'
        <Link
          href="/admin/promo-codes"
          className="flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-black text-zinc-500 transition hover:bg-white/[0.05] hover:text-white"
        >
          Promo Center

          <span className="text-[9px] uppercase tracking-[0.14em] opacity-60">
            Live
          </span>
        </Link>

'@

  $desktopPattern = '(?ms)^(?<indent>\s*)<Link\s*\r?\n\s*href="/admin/restaurant-settings"'
  if ($content -notmatch $desktopPattern) {
    throw 'Could not find desktop Restaurant Settings link.'
  }

  $content = [regex]::Replace(
    $content,
    $desktopPattern,
    { param($m) $desktopInsert + $m.Value },
    1
  )

  $mobileInsert = @'
          <MobileAdminLink
            href="/admin/promo-codes"
            title="Promo Center"
            badge="Live"
            onClick={onClose}
          />

'@

  $mobilePattern = '(?ms)^(?<indent>\s*)<MobileAdminLink\s*\r?\n\s*href="/admin/restaurant-settings"'
  if ($content -notmatch $mobilePattern) {
    throw 'Could not find mobile Restaurant Settings link.'
  }

  $content = [regex]::Replace(
    $content,
    $mobilePattern,
    { param($m) $mobileInsert + $m.Value },
    1
  )

  $backup = "$adminPage.backup"
  Copy-Item $adminPage $backup -Force
  Set-Content -Path $adminPage -Value $content -Encoding UTF8

  Write-Host "Updated: $adminPage" -ForegroundColor Green
  Write-Host "Backup:  $backup" -ForegroundColor DarkGray
}
else {
  Write-Host 'Promo Center link already exists. No duplicate was added.' -ForegroundColor Yellow
}

Push-Location $restaurantDir
try {
  Write-Host ''
  Write-Host 'Running restaurant build...' -ForegroundColor Cyan
  npm run build

  if ($LASTEXITCODE -ne 0) {
    throw "Build failed with exit code $LASTEXITCODE"
  }

  Write-Host ''
  Write-Host 'Done. Promo Center was added to desktop and mobile admin menus.' -ForegroundColor Green
}
finally {
  Pop-Location
}
