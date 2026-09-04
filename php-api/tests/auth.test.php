<?php
/**
 * KalaSearch PHP API — admin authentication unit tests (no MySQL required).
 * Run:  php php-api/tests/auth.test.php
 *
 * Covers configuration detection, username matching, bcrypt password_verify,
 * rejection of wrong username/password, and Bearer header extraction.
 * Session insert/select against MySQL is covered by scripts/php-e2e-test.sh.
 */

$tmp = sys_get_temp_dir() . '/ks-auth-test-' . bin2hex(random_bytes(4)) . '.php';
$testPassword = 'unit-test-pass-only';
$testHash = password_hash($testPassword, PASSWORD_DEFAULT);

$writeConfig = static function (array $overrides) use ($tmp, $testHash): void {
    $config = array_merge([
        'db_host' => '127.0.0.1',
        'db_name' => '',
        'db_user' => '',
        'db_password' => '',
        'admin_username' => 'admin',
        'admin_password_hash' => $testHash,
        'admin_password' => '',
        'admin_session_secret' => 'unit-test-session-secret-not-for-production',
        'session_ttl_days' => 7,
        'owner_username' => '',
        'owner_password_hash' => '',
        'owner_password' => '',
    ], $overrides);
    file_put_contents($tmp, "<?php\nreturn " . var_export($config, true) . ";\n");
};

$writeConfig([]);
putenv('KALA_CONFIG_FILE=' . $tmp);
foreach (['ADMIN_USERNAME', 'ADMIN_PASSWORD', 'ADMIN_PASSWORD_HASH', 'ADMIN_SESSION_SECRET'] as $envName) {
    putenv($envName);
}

require __DIR__ . '/../lib/bootstrap.php';
ks_config_reset();

$pass = 0;
$fail = 0;
function check(string $label, bool $condition): void
{
    global $pass, $fail;
    if ($condition) {
        $pass++;
        echo "  ok  $label\n";
    } else {
        $fail++;
        echo "FAIL  $label\n";
    }
}

echo "== ks_admin_configured ==\n";
check('configured when username + hash + secret set', ks_admin_configured() === true);

$writeConfig([
    'admin_username' => '',
    'admin_password_hash' => '',
    'admin_session_secret' => '',
]);
ks_config_reset();
check('missing admin configuration detected', ks_admin_configured() === false);

$writeConfig([
        'admin_username' => 'admin',
        'admin_password_hash' => '',
    'admin_password' => '',
    'admin_session_secret' => 'unit-test-session-secret-not-for-production',
]);
ks_config_reset();
check('username+secret without password is NOT configured', ks_admin_configured() === false);

$writeConfig([]);
ks_config_reset();

echo "== username matching ==\n";
check('bootstrap username admin is accepted', ks_admin_username_matches('admin') === true);
check('wrong username rejected', ks_admin_username_matches('karen') === false);
check('case-sensitive: Admin rejected', ks_admin_username_matches('Admin') === false);
check('empty username rejected', ks_admin_username_matches('') === false);

echo "== ks_validate_new_password ==\n";
check('empty new password', ks_validate_new_password('', 'x') === 'new_password_required');
check('too short', ks_validate_new_password('ab', 'ab') === 'password_too_short');
check('mismatch', ks_validate_new_password('abcd', 'abce') === 'password_mismatch');
check('valid new password', ks_validate_new_password('abcd', 'abcd') === null);

echo "== password_verify (bcrypt hash) ==\n";
check('correct password accepted', ks_verify_admin_password($testPassword) === true);
check('wrong password rejected', ks_verify_admin_password('wrong-password') === false);
check('empty password rejected', ks_verify_admin_password('') === false);
check('hash is a bcrypt string', str_starts_with((string) ks_config()['admin_password_hash'], '$2') === true);
check('raw test password is not stored as the hash', ks_config()['admin_password_hash'] !== $testPassword);
check('legacy plaintext field stays empty when a hash is set', ks_config()['admin_password'] === '');

echo "== Bearer header (cPanel CGI/PHP-FPM variants) ==\n";
$_SERVER['HTTP_AUTHORIZATION'] = 'Bearer abc.def';
check('HTTP_AUTHORIZATION', ks_bearer_token() === 'abc.def');
unset($_SERVER['HTTP_AUTHORIZATION']);
$_SERVER['REDIRECT_HTTP_AUTHORIZATION'] = 'Bearer redirected-token';
check('REDIRECT_HTTP_AUTHORIZATION fallback', ks_bearer_token() === 'redirected-token');
unset($_SERVER['REDIRECT_HTTP_AUTHORIZATION']);
$_SERVER['HTTP_AUTHORIZATION'] = 'Basic nope';
check('non-bearer rejected', ks_bearer_token() === '');
unset($_SERVER['HTTP_AUTHORIZATION']);

echo "== config never echoes secrets ==\n";
ob_start();
$configured = ks_admin_configured();
$out = ob_get_clean();
check('ks_admin_configured is silent', $out === '');
check('still configured after bearer tests', $configured === true);

@unlink($tmp);
putenv('KALA_CONFIG_FILE');

echo "\n$pass passed, $fail failed\n";
exit($fail === 0 ? 0 : 1);
