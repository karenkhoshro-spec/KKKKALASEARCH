<?php
/**
 * KalaSearch PHP API — unit tests for the pure helpers (no DB required).
 * Run:  php php-api/tests/util.test.php
 * Exit code 0 = all pass, 1 = failures.
 */

require __DIR__ . '/../lib/bootstrap.php';

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

echo "== ks_normalize_phone ==\n";
check('09123456789 → +989123456789', ks_normalize_phone('09123456789') === '+989123456789');
check('+989123456789 unchanged', ks_normalize_phone('+989123456789') === '+989123456789');
check('989123456789 → +989123456789', ks_normalize_phone('989123456789') === '+989123456789');
check('00989123456789 → +989123456789', ks_normalize_phone('00989123456789') === '+989123456789');
check('bare 9123456789 → +989123456789', ks_normalize_phone('9123456789') === '+989123456789');
check('short number rejected', ks_normalize_phone('12345') === '');
check('landline rejected', ks_normalize_phone('0211234567') === '');
check('junk rejected', ks_normalize_phone('abcdef') === '');
check('spaces/dashes stripped', ks_normalize_phone('0912 345-6789') === '+989123456789');

echo "== ks_money ==\n";
check('whole → int', ks_money(692000.0) === 692000);
check('decimal stays float', ks_money(123.5) === 123.5);
check('decimal string → int', ks_money('692000.00') === 692000);
check('lineTotal math', ks_money(120000 * 3) === 360000);

echo "== ks_clamp ==\n";
check('short string untouched', ks_clamp('abc', 'name') === 'abc');
check('long string truncated', mb_strlen(ks_clamp(str_repeat('x', 500), 'name')) === 200);
check('Persian text not broken', mb_substr(ks_clamp('پارس کالا ' . str_repeat('ی', 300), 'name'), -1, 1, 'UTF-8') !== '');

echo "== ks_validate_order_payload ==\n";
$valid = [
    'customer' => [
        'name' => 'علی رضایی',
        'phone' => '09123456789',
        'province' => 'تهران',
        'city' => 'تهران',
        'address' => 'خیابان آزادی',
        'postalCode' => '1234567890',
    ],
    'items' => [[
        'productCode' => '8039010',
        'name' => 'سبد خرید',
        'quantity' => 2,
        'unitPrice' => 120000,
    ]],
];
check('valid payload → null', ks_validate_order_payload($valid) === null);
check('missing name', ks_validate_order_payload(['customer' => [], 'items' => []]) === 'name_required');
$noPhone = $valid;
$noPhone['customer']['phone'] = '123';
check('invalid phone', ks_validate_order_payload($noPhone) === 'invalid_phone');
$noProvince = $valid;
$noProvince['customer']['province'] = '';
check('empty province allowed (optional)', ks_validate_order_payload($noProvince) === null);
$noCity = $valid;
$noCity['customer']['city'] = '';
check('city required', ks_validate_order_payload($noCity) === 'city_required');
$noAddress = $valid;
$noAddress['customer']['address'] = '';
check('address required', ks_validate_order_payload($noAddress) === 'address_required');
$badPostal = $valid;
$badPostal['customer']['postalCode'] = '123';
check('short postal ignored (optional)', ks_validate_order_payload($badPostal) === null);
$badEmail = $valid;
$badEmail['customer']['email'] = 'not-an-email';
check('invalid email', ks_validate_order_payload($badEmail) === 'invalid_email');
$noItems = $valid;
$noItems['items'] = [];
check('items required', ks_validate_order_payload($noItems) === 'items_required');
$tooMany = $valid;
$tooMany['items'] = array_fill(0, 101, $valid['items'][0]);
check('too many items', ks_validate_order_payload($tooMany) === 'too_many_items');
$badItem = $valid;
$badItem['items'] = [['name' => 'no code', 'quantity' => 1, 'unitPrice' => 1]];
check('item without code → items_invalid', ks_validate_order_payload($badItem) === 'items_invalid');
$badQty = $valid;
$badQty['items'] = [[
    'productCode' => '8039010', 'name' => 'x', 'quantity' => 0, 'unitPrice' => 1,
]];
check('zero quantity → items_invalid', ks_validate_order_payload($badQty) === 'items_invalid');
$badPrice = $valid;
$badPrice['items'] = [[
    'productCode' => '8039010', 'name' => 'x', 'quantity' => 1, 'unitPrice' => -5,
]];
check('negative price → items_invalid', ks_validate_order_payload($badPrice) === 'items_invalid');

echo "== ks_public_item ==\n";
$item = ks_public_item([
    'productCode' => '8039010',
    'name' => 'سبد خرید',
    'variation' => 'قرمز',
    'quantity' => 3,
    'unitPrice' => 120000,
    'image' => 'https://img.example/4030.jpg',
]);
check('lineTotal computed', $item['lineTotal'] === 360000);
check('unitPrice = price', $item['unitPrice'] === $item['price']);
check('stored image wins', $item['image'] === 'https://img.example/4030.jpg');
check('variation preserved', $item['variation'] === 'قرمز');

$noImage = ks_public_item([
    'productCode' => '8039010',
    'name' => 'x',
    'quantity' => 1,
    'unitPrice' => 100,
]);
check('no image → empty string (not broken)', $noImage['image'] === '');

echo "== ks_image_for_code ==\n";
check('stored image preferred over mapping', ks_image_for_code('8039010', 'https://stored.example/a.jpg') === 'https://stored.example/a.jpg');
check('empty code → empty', ks_image_for_code('', '') === '');

echo "\n$pass passed, $fail failed\n";
exit($fail === 0 ? 0 : 1);