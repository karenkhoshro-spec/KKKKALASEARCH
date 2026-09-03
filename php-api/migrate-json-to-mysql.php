<?php
/**
 * KalaSearch — one-time migration: data/orders.json → MySQL.
 *
 * OPTIONAL. Only needed if you want to carry existing JSON orders into the
 * new cPanel/MySQL production database. A clean deployment can skip this.
 *
 * Usage (from the project root):
 *   php php-api/migrate-json-to-mysql.php [path/to/orders.json]
 *
 * The default input is data/orders.json. Existing order numbers are skipped
 * (idempotent — safe to run more than once). Requires a working DB config.
 */

declare(strict_types=1);

require __DIR__ . '/lib/bootstrap.php';

$input = $argv[1] ?? dirname(__DIR__) . '/data/orders.json';
if (!is_file($input)) {
    fwrite(STDERR, "Input file not found: $input\n");
    exit(1);
}
$raw = file_get_contents($input);
$orders = json_decode($raw, true);
if (!is_array($orders)) {
    fwrite(STDERR, "Invalid JSON in $input\n");
    exit(1);
}

$pdo = ks_db();
$exists = $pdo->prepare('SELECT 1 FROM orders WHERE order_number = ? LIMIT 1');
$insertOrder = $pdo->prepare(
    'INSERT INTO orders
       (order_number, customer_name, phone, email, province, city, address,
        postal_code, notes, status, payment_status, total, created_at,
        status_updated_at, document_filename)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
);
$insertItem = $pdo->prepare(
    'INSERT INTO order_items
       (order_id, position, product_id, product_code, sku, name, model,
        variation, color, quantity, unit_price, image)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
);

$inserted = 0;
$skipped = 0;

foreach ($orders as $order) {
    $orderNumber = (string) ($order['orderNumber'] ?? '');
    if ($orderNumber === '') {
        $skipped++;
        continue;
    }
    $exists->execute([$orderNumber]);
    if ($exists->fetchColumn() !== false) {
        $skipped++;
        continue;
    }

    $customer = is_array($order['customer'] ?? null) ? $order['customer'] : [];
    $items = is_array($order['items'] ?? null) ? $order['items'] : [];
    $created = $order['createdAt'] ?? gmdate('Y-m-d H:i:s');
    $createdAt = gmdate('Y-m-d H:i:s', strtotime((string) $created));
    $statusUpdatedAt = null;
    if (!empty($order['statusUpdatedAt'])) {
        $statusUpdatedAt = gmdate('Y-m-d H:i:s', strtotime((string) $order['statusUpdatedAt']));
    }

    $pdo->beginTransaction();
    try {
        $insertOrder->execute([
            $orderNumber,
            mb_substr(trim((string) ($customer['name'] ?? '')), 0, 200),
            ks_normalize_phone($customer['phone'] ?? ''),
            isset($customer['email']) && $customer['email'] !== '' ? mb_substr(trim((string) $customer['email']), 0, 254) : null,
            mb_substr(trim((string) ($customer['province'] ?? '')), 0, 120),
            mb_substr(trim((string) ($customer['city'] ?? '')), 0, 120),
            mb_substr(trim((string) ($customer['address'] ?? '')), 0, 600),
            preg_replace('/\D/', '', (string) ($customer['postalCode'] ?? '')),
            mb_substr(trim((string) ($customer['notes'] ?? '')), 0, 2000),
            (string) ($order['status'] ?? 'registered'),
            (string) ($order['paymentStatus'] ?? 'unpaid'),
            number_format((float) ($order['total'] ?? 0), 2, '.', ''),
            $createdAt,
            $statusUpdatedAt,
            $orderNumber . '.pdf',
        ]);
        $orderId = (int) $pdo->lastInsertId();

        foreach ($items as $i => $item) {
            if (!is_array($item)) {
                continue;
            }
            $unitPrice = (float) ($item['unitPrice'] ?? $item['price'] ?? 0);
            $insertItem->execute([
                $orderId,
                $i,
                mb_substr((string) ($item['productId'] ?? ''), 0, 200),
                mb_substr((string) ($item['productCode'] ?? ''), 0, 200),
                mb_substr((string) ($item['sku'] ?? ''), 0, 200),
                mb_substr((string) ($item['name'] ?? $item['model'] ?? ''), 0, 200),
                mb_substr((string) ($item['model'] ?? ''), 0, 200),
                mb_substr((string) ($item['variation'] ?? ''), 0, 120),
                mb_substr((string) ($item['color'] ?? ''), 0, 120),
                max(1, (int) ($item['quantity'] ?? 1)),
                number_format($unitPrice, 2, '.', ''),
                mb_substr((string) ($item['image'] ?? ''), 0, 2048),
            ]);
        }
        $pdo->commit();
        $inserted++;
        echo "inserted $orderNumber\n";
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        fwrite(STDERR, "failed for $orderNumber: " . $e->getMessage() . "\n");
        $skipped++;
    }
}

echo "Done. inserted=$inserted skipped=$skipped\n";