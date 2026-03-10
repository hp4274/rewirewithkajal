$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Net.Http
$client = [System.Net.Http.HttpClient]::new()
$client.Timeout = [TimeSpan]::FromSeconds(30)

function Invoke-TimedHttp {
  param([string]$Url, [string]$Token)

  $req = [System.Net.Http.HttpRequestMessage]::new([System.Net.Http.HttpMethod]::Get, $Url)
  if ($Token) {
    $req.Headers.Authorization = [System.Net.Http.Headers.AuthenticationHeaderValue]::new('Bearer', $Token)
  }

  $sw = [System.Diagnostics.Stopwatch]::StartNew()
  try {
    $res = $client.SendAsync($req).GetAwaiter().GetResult()
    $null = $res.Content.ReadAsStringAsync().GetAwaiter().GetResult()
    $status = [int]$res.StatusCode
  } catch {
    $status = -1
  } finally {
    $sw.Stop()
    $req.Dispose()
  }

  [PSCustomObject]@{
    ms = [math]::Round($sw.Elapsed.TotalMilliseconds, 2)
    status = $status
  }
}

$registerJson = '{"email":"perf-admin-' + (Get-Random -Minimum 100000 -Maximum 999999) + '@example.com"}'
$regReq = [System.Net.Http.HttpRequestMessage]::new([System.Net.Http.HttpMethod]::Post, 'http://localhost:5000/api/auth/register')
$regReq.Content = [System.Net.Http.StringContent]::new($registerJson, [System.Text.Encoding]::UTF8, 'application/json')
$regRes = $client.SendAsync($regReq).GetAwaiter().GetResult()
$regBody = $regRes.Content.ReadAsStringAsync().GetAwaiter().GetResult()
$regReq.Dispose()
$token = (ConvertFrom-Json $regBody).token

$targets = @(
  @{ name = 'GET /api/health'; url = 'http://localhost:5000/api/health'; auth = $false },
  @{ name = 'GET /api/blogs/public'; url = 'http://localhost:5000/api/blogs/public?limit=20&page=1'; auth = $false },
  @{ name = 'GET /api/blogs'; url = 'http://localhost:5000/api/blogs?limit=100&page=1'; auth = $true },
  @{ name = 'GET /api/customers'; url = 'http://localhost:5000/api/customers?limit=100&page=1'; auth = $true },
  @{ name = 'GET /api/leads'; url = 'http://localhost:5000/api/leads?limit=100&page=1&sortBy=created_at&order=DESC'; auth = $true },
  @{ name = 'GET /api/admin/turnover'; url = 'http://localhost:5000/api/admin/turnover'; auth = $true },
  @{ name = 'GET /api/admin/historical-forms'; url = 'http://localhost:5000/api/admin/historical-forms?limit=100&page=1'; auth = $true }
)

$iterations = 20

Write-Output 'API BENCHMARK RESULTS'
foreach ($t in $targets) {
  $samples = @()
  for ($i = 0; $i -lt $iterations; $i++) {
    $tok = if ($t.auth) { $token } else { '' }
    $samples += Invoke-TimedHttp -Url $t.url -Token $tok
    Start-Sleep -Milliseconds 80
  }

  $sorted = $samples.ms | Sort-Object
  $p95 = $sorted[[math]::Min($sorted.Count - 1, [math]::Ceiling($sorted.Count * 0.95) - 1)]
  $p99 = $sorted[[math]::Min($sorted.Count - 1, [math]::Ceiling($sorted.Count * 0.99) - 1)]
  $avg = ($samples.ms | Measure-Object -Average).Average
  $statuses = ($samples.status | Group-Object | ForEach-Object { '{0}:{1}' -f $_.Name, $_.Count }) -join ','

  Write-Output ('{0} | avg={1} p95={2} p99={3} statuses={4}' -f $t.name, [math]::Round($avg, 2), [math]::Round($p95, 2), [math]::Round($p99, 2), $statuses)
}

$perfJson = $client.GetStringAsync('http://localhost:5000/api/health/perf').GetAwaiter().GetResult()
$perf = ConvertFrom-Json $perfJson

Write-Output 'PERF SNAPSHOT ROUTES'
$perf.routes |
  Sort-Object p95Ms -Descending |
  Select-Object -First 10 |
  ForEach-Object {
    Write-Output ('{0} | count={1} avg={2} p95={3} p99={4}' -f $_.route, $_.count, $_.avgMs, $_.p95Ms, $_.p99Ms)
  }
