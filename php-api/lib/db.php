<?php
/**
 * KalaSearch PHP API — PDO (MySQL/MariaDB) connection.
 * One shared connection, exceptions on errors, real prepared statements.
 */

function ks_db(): PDO
{
    static $pdo = null;
    if ($pdo !== null) {
        return $pdo;
    }

    $c = ks_config();
    if ($c['db_name'] === '' || $c['db_user'] === '') {
        throw new RuntimeException('database_not_configured');
    }

    $host = $c['db_host'];
    $port = null;
    if (str_contains($host, ':')) {
        [$host, $port] = explode(':', $host, 2);
    }

    $dsn = 'mysql:host=' . $host . ';dbname=' . $c['db_name'] . ';charset=utf8mb4';
    if ($port !== null && $port !== '') {
        $dsn .= ';port=' . $port;
    }

    $pdo = new PDO($dsn, $c['db_user'], $c['db_password'], [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ]);
    // Every connection writes/reads UTC so API timestamps are consistent.
    $pdo->exec("SET time_zone = '+00:00'");
    return $pdo;
}