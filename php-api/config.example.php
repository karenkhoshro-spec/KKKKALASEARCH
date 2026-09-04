<?php
/**
 * KalaSearch PHP API — configuration TEMPLATE.
 *
 * HOW TO USE (cPanel):
 *   1. Copy this file to a location OUTSIDE public_html, e.g.
 *        /home/USERNAME/kalasearch-config.php     (i.e. public_html/../kalasearch-config.php)
 *      The API looks for it automatically at:
 *        - path from env KALA_CONFIG_FILE
 *        - one level above public_html:  ../kalasearch-config.php   (RECOMMENDED)
 *        - inside the api dir as config.local.php                    (last resort)
 *   2. Fill in real values. NEVER commit this file, and never place it inside
 *      public_html (the included api/.htaccess blocks it as a safety net).
 *
 * Environment variables override these values where the host supports them
 * (DB_HOST, DB_NAME, DB_USER, DB_PASSWORD, ADMIN_USERNAME,
 *  ADMIN_PASSWORD_HASH, ADMIN_PASSWORD, ADMIN_SESSION_SECRET).
 *
 * Generate an admin hash with:
 *   php -r "echo password_hash('YOUR_PASSWORD', PASSWORD_DEFAULT), PHP_EOL;"
 */

return [
    // --- MySQL / MariaDB (created in cPanel → MySQL Databases) ----------
    'db_host'              => '127.0.0.1',       // or 'localhost', or 'host:port'
    'db_name'              => 'karenk_kalasearch',
    'db_user'              => 'karenk_kalasearch',
    'db_password'          => 'CHANGE_ME_STRONG_DB_PASSWORD',

    // --- Admin login -----------------------------------------------------
    // Bootstrap username (case-sensitive). NOT compiled into the React app.
    // After a password change in /admin, MySQL admin_credentials overrides
    // this file. NEVER write the raw password here — only a bcrypt hash.
    'admin_username'       => 'admin',
    // bcrypt hash from password_hash() — the ONLY recommended form.
    'admin_password_hash'  => '',                // e.g. '$2y$10$....'
    // Legacy plaintext fallback (used ONLY when admin_password_hash is '').
    // Migrate to the hash above as soon as possible.
    'admin_password'       => '',

    // HMAC pepper used to hash session tokens before storing them in MySQL.
    'admin_session_secret' => 'CHANGE_ME_LONG_RANDOM_STRING',

    // Session lifetime in days (tokens expire server-side; default 7).
    'session_ttl_days'     => 7,

    // --- Owner (Hiboss) account — OPTIONAL -------------------------------
    // Separate credentials for the /Hiboss owner panel. Leave empty to keep
    // Hiboss locked (no owner session can ever be issued). Same hash rules as
    // the admin account: prefer owner_password_hash; owner_password is the
    // legacy plaintext fallback used only when the hash is empty.
    'owner_username'       => '',
    'owner_password_hash'  => '',
    'owner_password'       => '',
];