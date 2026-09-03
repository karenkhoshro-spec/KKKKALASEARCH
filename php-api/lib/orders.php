<?php
/**
 * KalaSearch PHP API — order persistence (MySQL).
 * Prepared statements everywhere; order + items are inserted in one
 * transaction; money is ALWAYS recomputed server-side (client totals are
 * never trusted); items are immutable product snapshots.
 */

/** Unique order number KS-YYYYMMDD-XXXXXX; retries on the (rare) collision. */
function ks_generate_order_number(): string
{
    $date = gmdate('Ymd');
    $pdo = ks_db();
    for ($i = 0; $i < 20; $i++) {
        $orderNumber = 'KS-' . $date . '-' . strtoupper(substr(bin2hex(random_bytes(3)), 0, 6));
        $stmt = $pdo->prepare('SELECT 1 FROM orders WHERE order_number = ? LIMIT 1');
        $stmt->execute([$orderNumber]);
        if ($stmt->fetchColumn() === false) {
            return $orderNumber;
        }
    }
    return 'KS-' . $date . '-' . strtoupper(dechex(time()));
}

/** UTC DATETIME from MySQL row → ISO-8601 with Z, same as Node toISOString(). */
function ks_iso(?string $mysqlDatetime): ?string
{
    if ($mysqlDatetime === null || $mysqlDatetime === '') {
        return null;
    }
    $ts = strtotime($mysqlDatetime . ' UTC');
    return $ts === false ? null : gmdate('Y-m-d\TH:i:s.v\Z', $ts);
}

/** Map an order row + its items to the exact public JSON shape. */
function ks_public_order(array $row, array $items): array
{
    $orderNumber = $row['order_number'];
    $createdAt = ks_iso($row['created_at']);
    $document = [
        'kind' => 'proforma',
        'filename' => $row['document_filename'] ?? ($orderNumber . '.pdf'),
        'generatedAt' => $createdAt,
        'available' => true,
    ];

    $order = [
        'orderNumber' => $orderNumber,
        'createdAt' => $createdAt,
        'status' => $row['status'],
        'paymentStatus' => $row['payment_status'] ?? 'unpaid',
        'customer' => [
            'name' => $row['customer_name'],
            'phone' => $row['phone'],
            'email' => $row['email'] ?? '',
            'province' => $row['province'],
            'city' => $row['city'],
            'address' => $row['address'],
            'postalCode' => $row['postal_code'] ?? '',
            'notes' => $row['notes'] ?? '',
        ],
        'items' => array_map('ks_public_item', $items),
        'total' => ks_money($row['total']),
        'document' => $document,
    ];

    $statusUpdatedAt = ks_iso($row['status_updated_at'] ?? null);
    if ($statusUpdatedAt !== null) {
        $order['statusUpdatedAt'] = $statusUpdatedAt; // Node omits the key when unset
    }
    return $order;
}

function ks_items_for_order(int $orderId): array
{
    $stmt = ks_db()->prepare(
        'SELECT product_id, product_code, sku, name, model, variation, color,
                quantity, unit_price, image
           FROM order_items WHERE order_id = ? ORDER BY position ASC'
    );
    $stmt->execute([$orderId]);
    $items = [];
    foreach ($stmt->fetchAll() as $r) {
        $items[] = [
            'productId' => $r['product_id'],
            'productCode' => $r['product_code'],
            'sku' => $r['sku'],
            'name' => $r['name'],
            'model' => $r['model'],
            'variation' => $r['variation'],
            'color' => $r['color'],
            'quantity' => (int) $r['quantity'],
            'unitPrice' => $r['unit_price'],
            'price' => $r['unit_price'],
            'image' => $r['image'],
        ];
    }
    return $items;
}

/**
 * Create an order. Returns the same shape as the Node handler:
 *   ['ok' => true,  'status' => 201, 'order' => [...]]  or
 *   ['ok' => false, 'status' => 400, 'error' => 'code']
 */
function ks_create_order($payload): array
{
    $error = ks_validate_order_payload($payload);
    if ($error !== null) {
        return ['ok' => false, 'status' => 400, 'error' => $error];
    }

    $customer = is_array($payload['customer'] ?? null) ? $payload['customer'] : [];
    $rawItems = is_array($payload['items'] ?? null) ? $payload['items'] : [];

    // Server is the source of truth for money — recompute every row and the
    // grand total from unit price × quantity, never trust client totals.
    $items = array_map('ks_public_item', $rawItems);
    $total = 0.0;
    foreach ($items as $item) {
        $total += (float) $item['lineTotal'];
    }

    $now = gmdate('Y-m-d H:i:s');
    $orderNumber = ks_generate_order_number();
    $email = trim((string) ($customer['email'] ?? ''));

    $pdo = ks_db();
    $pdo->beginTransaction();
    try {
        $stmt = $pdo->prepare(
            'INSERT INTO orders
               (order_number, customer_name, phone, email, province, city, address,
                postal_code, notes, status, payment_status, total, created_at,
                document_filename)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $orderNumber,
            ks_clamp((string) ($customer['name'] ?? ''), 'name'),
            ks_normalize_phone($customer['phone'] ?? ''),
            $email !== '' ? ks_clamp($email, 'email') : null,
            ks_clamp((string) ($customer['province'] ?? ''), 'province'),
            ks_clamp((string) ($customer['city'] ?? ''), 'city'),
            ks_clamp((string) ($customer['address'] ?? ''), 'address'),
            preg_replace('/\D/', '', (string) ($customer['postalCode'] ?? '')),
            ks_clamp((string) ($customer['notes'] ?? ''), 'notes'),
            'registered',
            'unpaid',
            number_format($total, 2, '.', ''),
            $now,
            $orderNumber . '.pdf',
        ]);
        $orderId = (int) $pdo->lastInsertId();

        $itemStmt = $pdo->prepare(
            'INSERT INTO order_items
               (order_id, position, product_id, product_code, sku, name, model,
                variation, color, quantity, unit_price, image)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        foreach ($items as $i => $item) {
            $itemStmt->execute([
                $orderId,
                $i,
                $item['productId'],
                $item['productCode'],
                $item['sku'],
                $item['name'],
                $item['model'],
                $item['variation'],
                $item['color'],
                $item['quantity'],
                number_format((float) $item['unitPrice'], 2, '.', ''),
                $item['image'],
            ]);
        }
        $pdo->commit();
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $e;
    }

    $row = ks_order_row_by_number($orderNumber);
    return ['ok' => true, 'status' => 201, 'order' => ks_public_order($row, ks_items_for_order((int) $row['id']))];
}

function ks_order_row_by_number(string $orderNumber): ?array
{
    $stmt = ks_db()->prepare('SELECT * FROM orders WHERE order_number = ? LIMIT 1');
    $stmt->execute([$orderNumber]);
    $row = $stmt->fetch();
    return is_array($row) ? $row : null;
}

/** Admin: full order (regardless of phone). Customer: only with matching phone. */
function ks_get_order(string $orderNumber, string $phone = '', bool $admin = false): array
{
    $row = ks_order_row_by_number($orderNumber);
    if ($row === null) {
        return ['ok' => false, 'status' => 404, 'error' => 'not_found'];
    }
    if (!$admin) {
        $normalized = ks_normalize_phone($phone);
        if ($normalized === '' || $normalized !== $row['phone']) {
            return ['ok' => false, 'status' => 404, 'error' => 'not_found'];
        }
    }
    return ['ok' => true, 'status' => 200, 'order' => ks_public_order($row, ks_items_for_order((int) $row['id']))];
}

function ks_list_admin_orders(): array
{
    $rows = ks_db()->query('SELECT * FROM orders ORDER BY created_at DESC, id DESC')->fetchAll();
    $orders = [];
    foreach ($rows as $row) {
        $orders[] = ks_public_order($row, ks_items_for_order((int) $row['id']));
    }
    return $orders;
}

function ks_list_customer_orders(string $phone): array
{
    $normalized = ks_normalize_phone($phone);
    if ($normalized === '') {
        return [];
    }
    $stmt = ks_db()->prepare('SELECT * FROM orders WHERE phone = ? ORDER BY created_at DESC, id DESC');
    $stmt->execute([$normalized]);
    $orders = [];
    foreach ($stmt->fetchAll() as $row) {
        $orders[] = ks_public_order($row, ks_items_for_order((int) $row['id']));
    }
    return $orders;
}

function ks_update_order_status(string $orderNumber, string $status): array
{
    if (!in_array($status, KS_ORDER_STATUSES, true)) {
        return ['ok' => false, 'status' => 400, 'error' => 'invalid_status'];
    }
    $row = ks_order_row_by_number($orderNumber);
    if ($row === null) {
        return ['ok' => false, 'status' => 404, 'error' => 'not_found'];
    }
    $stmt = ks_db()->prepare(
        'UPDATE orders SET status = ?, status_updated_at = UTC_TIMESTAMP()
          WHERE order_number = ?'
    );
    $stmt->execute([$status, $orderNumber]);

    $updated = ks_order_row_by_number($orderNumber);
    return ['ok' => true, 'status' => 200, 'order' => ks_public_order($updated, ks_items_for_order((int) $updated['id']))];
}