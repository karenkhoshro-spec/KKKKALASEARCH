<?php
/**
 * KalaSearch PHP API — shared utilities.
 * Pure helpers (phone normalization, money, validation, item shaping) live
 * here so they are unit-testable without a database, and the response shape
 * mirrors the Node.js API exactly.
 */

const KS_ORDER_STATUSES = ['registered', 'preparing', 'ready_pickup', 'shipping', 'delivered'];
const KS_PAYMENT_STATUSES = ['unpaid'];
const KS_MAX_BODY_BYTES = 512 * 1024; // same cap as the Node server

/** Field length caps — identical to server/orderHandler.mjs MAX_LEN. */
const KS_MAX_LEN = [
    'name' => 200,
    'code' => 200,
    'sku' => 200,
    'variation' => 120,
    'notes' => 2000,
    'address' => 600,
    'city' => 120,
    'province' => 120,
    'email' => 254,
    'image' => 2048,
];

function ks_clamp(string $value, string $key): string
{
    $max = KS_MAX_LEN[$key] ?? 200;
    return mb_substr(trim($value), 0, $max);
}

/** +9891xxxxxxxx for valid Iranian mobiles, '' otherwise. Matches Node normalizePhone. */
function ks_normalize_phone($input): string
{
    $d = preg_replace('/\D/', '', (string) $input);
    if (str_starts_with($d, '0098')) {
        $d = substr($d, 4);
    } elseif (str_starts_with($d, '98') && strlen($d) >= 12) {
        $d = substr($d, 2);
    }
    if (str_starts_with($d, '0')) {
        $d = substr($d, 1);
    }
    $d = substr($d, 0, 10);
    return (strlen($d) === 10 && str_starts_with($d, '9')) ? '+98' . $d : '';
}

/**
 * Money is stored DECIMAL(14,2) but toman prices are whole numbers in this
 * app, so serialize as int when whole (identical JSON to the Node server).
 */
function ks_money($value)
{
    $f = (float) $value;
    return $f === floor($f) && abs($f) < 9.0e15 ? (int) $f : $f;
}

/** True when a raw order-item payload is sane enough to be persisted. */
function ks_is_valid_item($item): bool
{
    if (!is_array($item)) {
        return false;
    }
    $code = trim((string) ($item['productCode'] ?? $item['productId'] ?? $item['sku'] ?? ''));
    if ($code === '') {
        return false;
    }
    $name = trim((string) ($item['name'] ?? $item['model'] ?? ''));
    if ($name === '') {
        return false;
    }
    $quantity = filter_var($item['quantity'] ?? null, FILTER_VALIDATE_INT);
    if ($quantity === false || $quantity < 1 || $quantity > 9999) {
        return false;
    }
    $unitPrice = filter_var($item['unitPrice'] ?? $item['price'] ?? null, FILTER_VALIDATE_FLOAT);
    if ($unitPrice === false || !is_finite($unitPrice) || $unitPrice < 0) {
        return false;
    }
    return true;
}

/**
 * Optional server-side image mapping (a copy of src/data/productImages.json).
 * Only used as a fallback for order items whose stored snapshot has no image
 * (e.g. orders migrated from JSON). Deploy as public_html/api/images-mapping.json.
 */
function ks_image_mapping(): array
{
    static $mapping = null;
    if ($mapping === null) {
        $mapping = [];
        $file = dirname(__DIR__) . '/images-mapping.json';
        if (is_file($file)) {
            $raw = @file_get_contents($file);
            $parsed = $raw !== false ? json_decode($raw, true) : null;
            if (is_array($parsed)) {
                $mapping = $parsed;
            }
        }
    }
    return $mapping;
}

/** Resolve an image for a product code: stored snapshot first, mapping second. */
function ks_image_for_code(string $code, string $storedImage = ''): string
{
    $stored = trim($storedImage);
    if ($stored !== '') {
        return $stored;
    }
    $digits = preg_replace('/\D/', '', $code);
    if ($digits === '') {
        return '';
    }
    $mapped = ks_image_mapping()[$digits] ?? '';
    return is_string($mapped) ? $mapped : '';
}

/** Shape an order item exactly like the Node server's publicItem(). */
function ks_public_item(array $item): array
{
    $unitPrice = (float) ($item['unitPrice'] ?? $item['price'] ?? 0);
    if (!is_finite($unitPrice) || $unitPrice < 0) {
        $unitPrice = 0.0;
    }
    $quantity = max(1, (int) ($item['quantity'] ?? 1));
    $name = trim((string) ($item['name'] ?? $item['model'] ?? ''));
    $code = (string) ($item['productCode'] ?? $item['productId'] ?? $item['sku'] ?? '');
    $image = ks_image_for_code($code, (string) ($item['image'] ?? ''));

    $money = ks_money($unitPrice);
    return [
        'productId'   => ks_clamp((string) ($item['productId'] ?? ''), 'code'),
        'productCode' => ks_clamp((string) ($item['productCode'] ?? $code), 'code'),
        'sku'         => ks_clamp((string) ($item['sku'] ?? ''), 'sku'),
        'name'        => ks_clamp($name, 'name'),
        'model'       => ks_clamp((string) ($item['model'] ?? $name), 'name'),
        'variation'   => ks_clamp((string) ($item['variation'] ?? ''), 'variation'),
        'color'       => ks_clamp((string) ($item['color'] ?? ''), 'variation'),
        'quantity'    => $quantity,
        'image'       => mb_substr($image, 0, KS_MAX_LEN['image']),
        'unitPrice'   => $money,
        'price'       => $money,
        'lineTotal'   => ks_money($unitPrice * $quantity),
    ];
}

/**
 * Pure payload validation — returns null when OK, otherwise the exact error
 * code string used by the Node API.
 */
function ks_validate_order_payload($payload): ?string
{
    if (!is_array($payload)) {
        return 'invalid_json';
    }
    $customer = is_array($payload['customer'] ?? null) ? $payload['customer'] : [];
    $items = is_array($payload['items'] ?? null) ? $payload['items'] : [];

    $name = trim((string) ($customer['name'] ?? ''));
    $phone = ks_normalize_phone($customer['phone'] ?? '');
    $city = trim((string) ($customer['city'] ?? ''));
    $address = trim((string) ($customer['address'] ?? ''));
    $email = trim((string) ($customer['email'] ?? ''));

    // Required checkout fields (mirrors the Node server). Province, postal code
    // and email were removed from the customer form and are optional; legacy
    // clients may still send them and they are accepted.
    if ($name === '') {
        return 'name_required';
    }
    if ($phone === '') {
        return 'invalid_phone';
    }
    if ($city === '') {
        return 'city_required';
    }
    if ($address === '') {
        return 'address_required';
    }
    if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        return 'invalid_email';
    }
    if (count($items) === 0) {
        return 'items_required';
    }
    if (count($items) > 100) {
        return 'too_many_items';
    }
    foreach ($items as $item) {
        if (!ks_is_valid_item($item)) {
            return 'items_invalid';
        }
    }
    return null;
}

// ---------------------------------------------------------------------------
// HTTP helpers
// ---------------------------------------------------------------------------

function ks_send(int $status, array $body): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');
    echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function ks_send_error(int $status, string $code): never
{
    ks_send($status, ['error' => $code]);
}

/**
 * Reads the raw request body with the same 512 KB cap as the Node server.
 * Returns the raw string, or null when the body exceeds the cap.
 */
function ks_read_body(): ?string
{
    $raw = file_get_contents('php://input');
    if ($raw === false) {
        $raw = '';
    }
    if (strlen($raw) > KS_MAX_BODY_BYTES) {
        return null;
    }
    return $raw;
}

/**
 * Resolve the public /api/... path across Apache, LiteSpeed, and cPanel
 * rewrite variants. Some hosts replace REQUEST_URI with /api/index.php after
 * the front-controller rewrite; without this helper every admin login would
 * 404 and the SPA would (previously) show "wrong password".
 *
 * $server is injectable so the helper is unit-testable without a web SAPI.
 */
function ks_request_path(?array $server = null): string
{
    $s = $server ?? $_SERVER;

    $from = static function (?string $raw): string {
        if ($raw === null || $raw === '') {
            return '';
        }
        $path = parse_url($raw, PHP_URL_PATH);
        if (!is_string($path) || $path === '') {
            $path = explode('?', $raw, 2)[0];
        }
        return $path;
    };

    $candidates = [];
    $candidates[] = $from($s['REQUEST_URI'] ?? null);
    $candidates[] = $from($s['REDIRECT_URL'] ?? null);
    $candidates[] = $from($s['REDIRECT_REDIRECT_URL'] ?? null);
    $candidates[] = $from($s['UNENCODED_URL'] ?? null);
    if (isset($s['THE_REQUEST']) && is_string($s['THE_REQUEST'])
        && preg_match('#^[A-Z]+\s+(\S+)#', $s['THE_REQUEST'], $m)) {
        $candidates[] = $from($m[1]);
    }

    $path = '';
    foreach ($candidates as $candidate) {
        if ($candidate === '') {
            continue;
        }
        $stripped = preg_replace('#/index\.php#', '', $candidate) ?? $candidate;
        if ($stripped !== '' && $stripped !== '/api' && str_contains($stripped, '/api/')) {
            $path = $stripped;
            break;
        }
        if ($path === '') {
            $path = $stripped !== '' ? $stripped : $candidate;
        }
    }

    $pathInfo = $s['PATH_INFO'] ?? '';
    if (is_string($pathInfo) && $pathInfo !== '') {
        if ($path === '' || $path === '/api' || !str_contains($path, '/api/')) {
            $info = str_starts_with($pathInfo, '/') ? $pathInfo : '/' . $pathInfo;
            $path = str_starts_with($info, '/api/') ? $info : '/api' . $info;
        }
    }

    $path = preg_replace('#/index\.php#', '', $path) ?? $path;
    if ($path === '') {
        $path = '/';
    }

    // Front controller lives at /api/index.php — a URI of /admin/login is
    // the same route as /api/admin/login.
    $script = $from($s['SCRIPT_NAME'] ?? null);
    if ($path !== '/' && !str_starts_with($path, '/api') && str_contains($script, '/api')) {
        $path = '/api' . (str_starts_with($path, '/') ? $path : '/' . $path);
    }

    if ($path !== '/' && str_ends_with($path, '/')) {
        $path = rtrim($path, '/');
    }

    return $path;
}