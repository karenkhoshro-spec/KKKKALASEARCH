<?php
/**
 * KalaSearch PHP API — admin authentication.
 *
 * - Credentials live ONLY in backend config/env (never the frontend).
 * - Password is verified with password_verify() against ADMIN_PASSWORD_HASH
 *   (bcrypt via password_hash). Legacy plaintext ADMIN_PASSWORD is accepted
 *   only when no hash is configured — migrate by setting the hash.
 * - Sessions are secure random 32-byte tokens; only an HMAC-SHA256 hash of
 *   the token is stored in MySQL (a DB leak never yields usable tokens).
 * - Tokens expire after 7 days; logout revokes the token permanently.
 */

/** True when admin auth is configured at all. */
function ks_admin_configured(): bool
{
    $c = ks_config();
    return $c['admin_username'] !== ''
        && ($c['admin_password_hash'] !== '' || $c['admin_password'] !== '')
        && $c['admin_session_secret'] !== '';
}

/** True when the optional Owner (Hiboss) account is configured. */
function ks_owner_configured(): bool
{
    $c = ks_config();
    return $c['owner_username'] !== ''
        && ($c['owner_password_hash'] !== '' || $c['owner_password'] !== '')
        && $c['admin_session_secret'] !== '';
}

function ks_verify_admin_password(string $password): bool
{
    $c = ks_config();
    if ($c['admin_password_hash'] !== '') {
        return password_verify($password, $c['admin_password_hash']);
    }
    // Legacy plaintext fallback — documented migration path is ADMIN_PASSWORD_HASH.
    return hash_equals($c['admin_password'], $password);
}

function ks_verify_owner_password(string $password): bool
{
    $c = ks_config();
    if ($c['owner_password_hash'] !== '') {
        return password_verify($password, $c['owner_password_hash']);
    }
    // Legacy plaintext fallback — documented migration path is OWNER_PASSWORD_HASH.
    return hash_equals($c['owner_password'], $password);
}

/** Issue a new session token (row inserted into admin_sessions). */
function ks_issue_admin_token(?string $username = null): string
{
    $c = ks_config();
    $token = bin2hex(random_bytes(32));
    $tokenHash = hash_hmac('sha256', $token, $c['admin_session_secret']);
    $ttl = max(1, (int) $c['session_ttl_days']);
    $expiresAt = gmdate('Y-m-d H:i:s', time() + $ttl * 86400);
    $who = $username !== null && $username !== '' ? $username : $c['admin_username'];

    $stmt = ks_db()->prepare(
        'INSERT INTO admin_sessions (token_hash, username, expires_at) VALUES (?, ?, ?)'
    );
    $stmt->execute([$tokenHash, $who, $expiresAt]);
    return $token;
}

/** True when the presented token is valid: exists, not revoked, not expired. */
function ks_verify_admin_token(?string $token): bool
{
    if ($token === null || $token === '' || !ks_admin_configured()) {
        return false;
    }
    $tokenHash = hash_hmac('sha256', $token, ks_config()['admin_session_secret']);
    $stmt = ks_db()->prepare(
        'SELECT 1 FROM admin_sessions
          WHERE token_hash = ? AND revoked_at IS NULL AND expires_at > UTC_TIMESTAMP()
          LIMIT 1'
    );
    $stmt->execute([$tokenHash]);
    return $stmt->fetchColumn() !== false;
}

/**
 * Role of a valid session token: "owner" for the configured Owner account,
 * "admin" otherwise. Returns '' when the token is invalid.
 */
function ks_session_role(?string $token): string
{
    if ($token === null || $token === '' || !ks_admin_configured()) {
        return '';
    }
    $tokenHash = hash_hmac('sha256', $token, ks_config()['admin_session_secret']);
    $stmt = ks_db()->prepare(
        'SELECT username FROM admin_sessions
          WHERE token_hash = ? AND revoked_at IS NULL AND expires_at > UTC_TIMESTAMP()
          LIMIT 1'
    );
    $stmt->execute([$tokenHash]);
    $username = $stmt->fetchColumn();
    if ($username === false) {
        return '';
    }
    return ks_config()['owner_username'] !== '' && $username === ks_config()['owner_username']
        ? 'owner'
        : 'admin';
}

/** Permanently revoke a session token (logout). */
function ks_revoke_admin_token(?string $token): void
{
    if ($token === null || $token === '') {
        return;
    }
    $tokenHash = hash_hmac('sha256', $token, ks_config()['admin_session_secret']);
    $stmt = ks_db()->prepare(
        'UPDATE admin_sessions SET revoked_at = UTC_TIMESTAMP()
          WHERE token_hash = ? AND revoked_at IS NULL'
    );
    $stmt->execute([$tokenHash]);
}

function ks_bearer_token(): string
{
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if ($header === '' && function_exists('apache_request_headers')) {
        $headers = apache_request_headers();
        $header = $headers['Authorization'] ?? '';
    }
    if (preg_match('/^Bearer\s+(.+)$/i', $header, $m)) {
        return trim($m[1]);
    }
    return '';
}