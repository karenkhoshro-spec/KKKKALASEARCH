<?php
/**
 * KalaSearch PHP API — front controller.
 * Deployed as public_html/api/index.php; every /api/* request is routed here
 * by the api/.htaccess rewrite. Response shapes match the Node.js API
 * (server/orderHandler.mjs) exactly, so the React frontend needs no changes.
 *
 * Routes:
 *   OPTIONS /api/*                    → 204
 *   GET     /api/health               → {"ok":true}
 *   POST    /api/orders               → 201 {order} | 400/413 {error}
 *   GET     /api/customer/orders?phone=… → 200 {orders:[…]}
 *   GET     /api/orders/:orderNumber?phone=… (or admin bearer) → 200 {order} | 404
 *   POST    /api/admin/login          → 200 {token} | 401/503 {error}
 *   POST    /api/admin/logout         (bearer) → 200 {ok:true} | 401
 *   GET     /api/admin/session        (bearer) → 200 {ok:true} | 401
 *   GET     /api/admin/orders         (bearer) → 200 {orders:[…]} | 401
 *   POST    /api/admin/change-password (bearer) → 200 {ok:true} | 400/401
 *   PATCH   /api/admin/orders/:orderNumber/status (bearer) → 200 {order} | 400/404/401
 */

require __DIR__ . '/lib/bootstrap.php';

$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
$path = ks_request_path();

// CORS: the app is same-origin only — no Access-Control-* headers are sent,
// so cross-origin browsers cannot call the API at all.
if ($method === 'OPTIONS' && str_starts_with($path, '/api/')) {
    http_response_code(204);
    exit;
}

// --------------------------------------------------------------------------
// Health check — lightweight, no DB dependency, no internals exposed.
// --------------------------------------------------------------------------
if ($method === 'GET' && $path === '/api/health') {
    ks_send(200, ['ok' => true]);
}

// --------------------------------------------------------------------------
// Read + parse the request body (with the same 512 KB cap as Node).
// --------------------------------------------------------------------------
$body = [];
$needsBody = in_array($method, ['POST', 'PATCH', 'PUT'], true);
if ($needsBody) {
    $raw = ks_read_body();
    if ($raw === null) {
        ks_send_error(413, 'payload_too_large');
    }
    if (trim($raw) !== '') {
        $body = json_decode($raw, true);
        if (!is_array($body)) {
            ks_send_error(400, 'invalid_json');
        }
    }
}

// --------------------------------------------------------------------------
// Customer routes
// --------------------------------------------------------------------------
if ($method === 'POST' && $path === '/api/orders') {
    $result = ks_create_order($body);
    if ($result['ok']) {
        ks_send(201, ['order' => $result['order']]);
    }
    ks_send_error($result['status'], $result['error']);
}

if ($method === 'GET' && $path === '/api/customer/orders') {
    ks_send(200, ['orders' => ks_list_customer_orders($_GET['phone'] ?? '')]);
}

if ($method === 'GET' && preg_match('#^/api/orders/([^/]+)$#', $path, $m)) {
    $orderNumber = rawurldecode($m[1]);
    $result = ks_get_order($orderNumber, $_GET['phone'] ?? '', ks_verify_admin_token(ks_bearer_token()));
    if ($result['ok']) {
        ks_send(200, ['order' => $result['order']]);
    }
    ks_send_error($result['status'], $result['error']);
}

// --------------------------------------------------------------------------
// Admin routes
// --------------------------------------------------------------------------
if ($method === 'POST' && $path === '/api/admin/login') {
    if (!ks_admin_configured()) {
        ks_send_error(503, 'admin_not_configured');
    }
    $username = (string) ($body['username'] ?? '');
    $password = (string) ($body['password'] ?? '');
    if (!ks_admin_username_matches($username) || !ks_verify_admin_password($password)) {
        ks_send_error(401, 'invalid_credentials');
    }
    ks_send(200, ['token' => ks_issue_admin_token()]);
}

if ($method === 'POST' && $path === '/api/admin/owner-login') {
    if (!ks_owner_configured()) {
        ks_send_error(503, 'owner_not_configured');
    }
    $username = (string) ($body['username'] ?? '');
    $password = (string) ($body['password'] ?? '');
    if (!ks_owner_username_matches($username) || !ks_verify_owner_password($password)) {
        ks_send_error(401, 'invalid_credentials');
    }
    ks_send(200, ['token' => ks_issue_admin_token($username), 'role' => 'owner']);
}

if ($method === 'POST' && $path === '/api/admin/logout') {
    $token = ks_bearer_token();
    if (!ks_verify_admin_token($token)) {
        ks_send_error(401, 'unauthorized');
    }
    ks_revoke_admin_token($token);
    ks_send(200, ['ok' => true]);
}

if ($method === 'GET' && $path === '/api/admin/session') {
    $token = ks_bearer_token();
    if (!ks_verify_admin_token($token)) {
        ks_send_error(401, 'unauthorized');
    }
    ks_send(200, ['ok' => true, 'role' => ks_session_role($token)]);
}

if ($method === 'GET' && $path === '/api/admin/orders') {
    if (!ks_verify_admin_token(ks_bearer_token())) {
        ks_send_error(401, 'unauthorized');
    }
    ks_send(200, ['orders' => ks_list_admin_orders()]);
}

if ($method === 'POST' && $path === '/api/admin/change-password') {
    $token = ks_bearer_token();
    if (!ks_verify_admin_token($token)) {
        ks_send_error(401, 'unauthorized');
    }
    $current = (string) ($body['currentPassword'] ?? '');
    $new = (string) ($body['newPassword'] ?? '');
    $confirm = (string) ($body['confirmPassword'] ?? '');
    $result = ks_change_admin_password($current, $new, $confirm, $token);
    if ($result['ok']) {
        ks_send(200, ['ok' => true]);
    }
    ks_send_error($result['status'], $result['error']);
}

if ($method === 'PATCH' && preg_match('#^/api/admin/orders/([^/]+)/status$#', $path, $m)) {
    if (!ks_verify_admin_token(ks_bearer_token())) {
        ks_send_error(401, 'unauthorized');
    }
    $result = ks_update_order_status(rawurldecode($m[1]), (string) ($body['status'] ?? ''));
    if ($result['ok']) {
        ks_send(200, ['order' => $result['order']]);
    }
    ks_send_error($result['status'], $result['error']);
}

// --------------------------------------------------------------------------
// Unknown /api/* route
// --------------------------------------------------------------------------
if (str_starts_with($path, '/api/')) {
    ks_send_error(404, 'not_found');
}

// Non-API request reached the front controller (should not happen behind the
// .htaccess rewrite) — answer 404 instead of serving the SPA from PHP.
ks_send_error(404, 'not_found');