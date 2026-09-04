<?php
/**
 * KalaSearch PHP API — admin authentication.
 *
 * - Bootstrap credentials live in kalasearch-config.php / env (never frontend).
 * - After the first in-panel password change, the bcrypt hash is stored in
 *   MySQL table admin_credentials and that row wins over the config file
 *   (so cPanel does not need to rewrite a file outside public_html).
 * - password_verify() against password_hash() bcrypt. Legacy plaintext
 *   ADMIN_PASSWORD is accepted only when no hash is configured.
 * - Sessions are random 32-byte tokens; only an HMAC-SHA256 hash is stored.
 */

const KS_ADMIN_CREDENTIALS_DDL = <<<'SQL'
CREATE TABLE IF NOT EXISTS admin_credentials (
  id            TINYINT UNSIGNED NOT NULL PRIMARY KEY DEFAULT 1,
  username      VARCHAR(100)     NOT NULL,
  password_hash VARCHAR(255)     NOT NULL,
  updated_at    DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
SQL;

function ks_ensure_admin_credentials_table(): void
{
    static $ready = false;
    if ($ready) {
        return;
    }
    ks_db()->exec(KS_ADMIN_CREDENTIALS_DDL);
    $ready = true;
}

/** DB override row, or null to use the config-file bootstrap. */
function ks_admin_credentials_row(): ?array
{
    $c = ks_config();
    if ($c['db_name'] === '' || $c['db_user'] === '') {
        return null;
    }
    try {
        ks_ensure_admin_credentials_table();
        $stmt = ks_db()->query('SELECT username, password_hash FROM admin_credentials WHERE id = 1 LIMIT 1');
        $row = $stmt->fetch();
        if (!is_array($row)) {
            return null;
        }
        $username = trim((string) ($row['username'] ?? ''));
        $hash = trim((string) ($row['password_hash'] ?? ''));
        if ($username === '' || $hash === '') {
            return null;
        }
        return ['username' => $username, 'password_hash' => $hash];
    } catch (Throwable $e) {
        error_log('[kalasearch-api] admin_credentials read: ' . $e->getMessage());
        return null;
    }
}

function ks_effective_admin_username(): string
{
    $row = ks_admin_credentials_row();
    if ($row !== null) {
        return $row['username'];
    }
    return (string) ks_config()['admin_username'];
}

/** True when admin auth is configured at all (DB override or config bootstrap). */
function ks_admin_configured(): bool
{
    if (ks_config()['admin_session_secret'] === '') {
        return false;
    }
    $row = ks_admin_credentials_row();
    if ($row !== null) {
        return true;
    }
    $c = ks_config();
    return $c['admin_username'] !== ''
        && ($c['admin_password_hash'] !== '' || $c['admin_password'] !== '');
}

/** True when the optional Owner (Hiboss) account is configured. */
function ks_owner_configured(): bool
{
    $c = ks_config();
    return $c['owner_username'] !== ''
        && ($c['owner_password_hash'] !== '' || $c['owner_password'] !== '')
        && $c['admin_session_secret'] !== '';
}

/**
 * Timing-safe username compare against the effective admin account.
 * The username lives only in backend config / MySQL — never in the frontend.
 */
function ks_admin_username_matches(string $username): bool
{
    $expected = ks_effective_admin_username();
    return $username !== '' && $expected !== '' && hash_equals($expected, $username);
}

function ks_owner_username_matches(string $username): bool
{
    $expected = ks_config()['owner_username'];
    return $username !== '' && $expected !== '' && hash_equals($expected, $username);
}

function ks_verify_admin_password(string $password): bool
{
    if ($password === '') {
        return false;
    }
    $row = ks_admin_credentials_row();
    if ($row !== null) {
        return password_verify($password, $row['password_hash']);
    }
    $c = ks_config();
    if ($c['admin_password_hash'] !== '') {
        return password_verify($password, $c['admin_password_hash']);
    }
    return $c['admin_password'] !== '' && hash_equals($c['admin_password'], $password);
}

function ks_verify_owner_password(string $password): bool
{
    $c = ks_config();
    if ($c['owner_password_hash'] !== '') {
        return password_verify($password, $c['owner_password_hash']);
    }
    return $c['owner_password'] !== '' && hash_equals($c['owner_password'], $password);
}

/**
 * Validate a proposed new admin password. Returns an error code or null.
 * Pure — unit-testable without MySQL.
 */
function ks_validate_new_password(string $newPassword, string $confirm): ?string
{
    if ($newPassword === '') {
        return 'new_password_required';
    }
    if (strlen($newPassword) < 4 || strlen($newPassword) > 200) {
        return 'password_too_short';
    }
    if (!hash_equals($newPassword, $confirm)) {
        return 'password_mismatch';
    }
    return null;
}

/**
 * Persist a new bcrypt hash in MySQL (admin_credentials) and revoke every
 * session except the caller. Does not write kalasearch-config.php.
 *
 * @return array{ok:bool,status?:int,error?:string}
 */
function ks_change_admin_password(string $currentPassword, string $newPassword, string $confirm, string $keepToken): array
{
    if (!ks_verify_admin_password($currentPassword)) {
        return ['ok' => false, 'status' => 401, 'error' => 'invalid_current_password'];
    }
    $error = ks_validate_new_password($newPassword, $confirm);
    if ($error !== null) {
        return ['ok' => false, 'status' => 400, 'error' => $error];
    }
    $hash = password_hash($newPassword, PASSWORD_DEFAULT);
    if (!is_string($hash) || $hash === '') {
        return ['ok' => false, 'status' => 500, 'error' => 'server_error'];
    }
    $username = ks_effective_admin_username();
    if ($username === '') {
        return ['ok' => false, 'status' => 503, 'error' => 'admin_not_configured'];
    }
    ks_ensure_admin_credentials_table();
    $stmt = ks_db()->prepare(
        'INSERT INTO admin_credentials (id, username, password_hash, updated_at)
              VALUES (1, ?, ?, UTC_TIMESTAMP())
         ON DUPLICATE KEY UPDATE
              username = VALUES(username),
              password_hash = VALUES(password_hash),
              updated_at = UTC_TIMESTAMP()'
    );
    $stmt->execute([$username, $hash]);
    ks_revoke_other_admin_sessions($keepToken);
    return ['ok' => true];
}

function ks_revoke_other_admin_sessions(string $keepToken): void
{
    $secret = ks_config()['admin_session_secret'];
    if ($keepToken === '' || $secret === '') {
        ks_db()->exec('UPDATE admin_sessions SET revoked_at = UTC_TIMESTAMP() WHERE revoked_at IS NULL');
        return;
    }
    $keepHash = hash_hmac('sha256', $keepToken, $secret);
    $stmt = ks_db()->prepare(
        'UPDATE admin_sessions SET revoked_at = UTC_TIMESTAMP()
          WHERE revoked_at IS NULL AND token_hash <> ?'
    );
    $stmt->execute([$keepHash]);
}

/** Issue a new session token (row inserted into admin_sessions). */
function ks_issue_admin_token(?string $username = null): string
{
    $c = ks_config();
    $token = bin2hex(random_bytes(32));
    $tokenHash = hash_hmac('sha256', $token, $c['admin_session_secret']);
    $ttl = max(1, (int) $c['session_ttl_days']);
    $expiresAt = gmdate('Y-m-d H:i:s', time() + $ttl * 86400);
    $who = $username !== null && $username !== '' ? $username : ks_effective_admin_username();

    $stmt = ks_db()->prepare(
        'INSERT INTO admin_sessions (token_hash, username, expires_at) VALUES (?, ?, ?)'
    );
    $stmt->execute([$tokenHash, $who, $expiresAt]);
    return $token;
}

/** True when the presented token is valid: exists, not revoked, not expired. */
function ks_verify_admin_token(?string $token): bool
{
    if ($token === null || $token === '' || ks_config()['admin_session_secret'] === '') {
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
    if ($token === null || $token === '' || ks_config()['admin_session_secret'] === '') {
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
    $header = $_SERVER['HTTP_AUTHORIZATION']
        ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION']
        ?? '';
    if ($header === '' && function_exists('apache_request_headers')) {
        $headers = apache_request_headers();
        $header = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    }
    if (preg_match('/^Bearer\s+(.+)$/i', $header, $m)) {
        return trim($m[1]);
    }
    return '';
}
