<?php
/**
 * KalaSearch PHP API — configuration loader.
 *
 * Resolution order (later sources win):
 *   1. Built-in defaults
 *   2. Local config file (first existing of):
 *        - path from env KALA_CONFIG_FILE
 *        - <one level above public_html>/kalasearch-config.php   (RECOMMENDED on cPanel)
 *        - <api dir>/kalasearch-config.php
 *        - <api dir>/config.local.php                            (last resort)
 *   3. Environment variables (DB_HOST, DB_NAME, DB_USER, DB_PASSWORD,
 *      ADMIN_USERNAME, ADMIN_PASSWORD_HASH, ADMIN_PASSWORD, ADMIN_SESSION_SECRET,
 *      KALA_SESSION_TTL_DAYS)
 *
 * The config file must `return [ ... ];` an array of the same keys shown in
 * config.example.php. NEVER put the real config inside public_html.
 */

function ks_config(): array
{
    static $config = null;
    if ($config !== null) {
        return $config;
    }

    $apiDir = dirname(__DIR__);

    $defaults = [
        'db_host'              => '127.0.0.1',
        'db_name'              => '',
        'db_user'              => '',
        'db_password'          => '',
        'admin_username'       => '',
        'admin_password_hash'  => '',   // bcrypt (password_hash) — recommended
        'admin_password'       => '',   // legacy plaintext, only when no hash is set
        'admin_session_secret' => '',   // HMAC pepper for session tokens
        'session_ttl_days'     => 7,
        'owner_username'       => '',   // optional Owner (Hiboss) account
        'owner_password_hash'  => '',
        'owner_password'       => '',
    ];

    // --- 2. local config file -------------------------------------------
    $loaded = $defaults;

    $candidates = [];
    $envFile = getenv('KALA_CONFIG_FILE');
    if (is_string($envFile) && $envFile !== '') {
        $candidates[] = $envFile;
    }
    $candidates[] = dirname($apiDir) . '/../kalasearch-config.php'; // outside public_html
    $candidates[] = $apiDir . '/kalasearch-config.php';
    $candidates[] = $apiDir . '/config.local.php';

    foreach ($candidates as $file) {
        if (is_file($file)) {
            $fileConfig = require $file;
            if (is_array($fileConfig)) {
                $loaded = array_merge($loaded, $fileConfig);
            }
            break; // first existing file wins; env still overrides below
        }
    }

    // --- 3. environment overrides ---------------------------------------
    $envMap = [
        'db_host'              => 'DB_HOST',
        'db_name'              => 'DB_NAME',
        'db_user'              => 'DB_USER',
        'db_password'          => 'DB_PASSWORD',
        'admin_username'       => 'ADMIN_USERNAME',
        'admin_password_hash'  => 'ADMIN_PASSWORD_HASH',
        'admin_password'       => 'ADMIN_PASSWORD',
        'admin_session_secret' => 'ADMIN_SESSION_SECRET',
        'session_ttl_days'     => 'KALA_SESSION_TTL_DAYS',
        'owner_username'       => 'OWNER_USERNAME',
        'owner_password_hash'  => 'OWNER_PASSWORD_HASH',
        'owner_password'       => 'OWNER_PASSWORD',
    ];
    foreach ($envMap as $key => $envName) {
        $value = getenv($envName);
        if (is_string($value) && $value !== '') {
            if ($key === 'session_ttl_days') {
                $value = max(1, (int) $value);
            }
            $loaded[$key] = $value;
        }
    }

    $config = $loaded;
    return $config;
}