<?php
/**
 * KalaSearch PHP API — bootstrap.
 * Loads every module, hardens error handling (never leak internals to the
 * client), and forces UTC for consistent API timestamps.
 */

declare(strict_types=1);

error_reporting(E_ALL);
ini_set('display_errors', '0');   // API responses must never leak internals
ini_set('log_errors', '1');
date_default_timezone_set('UTC');

require __DIR__ . '/config.php';
require __DIR__ . '/util.php';
require __DIR__ . '/db.php';
require __DIR__ . '/auth.php';
require __DIR__ . '/orders.php';

/**
 * Last-resort handler: log the real error server-side, return a generic
 * {"error":"server_error"} to the client. Never expose stack traces or DB
 * credentials.
 */
set_exception_handler(function (Throwable $e): void {
    error_log('[kalasearch-api] ' . get_class($e) . ': ' . $e->getMessage() . "\n" . $e->getTraceAsString());
    if (!headers_sent()) {
        http_response_code(500);
        header('Content-Type: application/json; charset=utf-8');
        header('Cache-Control: no-store');
    }
    echo json_encode(['error' => 'server_error'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
});

// Turn PHP warnings/notices into exceptions so they land in the handler too.
set_error_handler(function (int $severity, string $message, string $file, int $line): bool {
    if (!(error_reporting() & $severity)) {
        return false;
    }
    throw new ErrorException($message, 0, $severity, $file, $line);
});