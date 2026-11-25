-- El pedido guarda el nombre del plato comprado.
ALTER TABLE "OrderItem" ADD COLUMN "menuName" TEXT;
UPDATE "OrderItem" i SET "menuName" = m."name" FROM "Menu" m WHERE m."id" = i."menuId";
ALTER TABLE "OrderItem" ALTER COLUMN "menuName" SET NOT NULL;

-- Los cupos de una franja pasan a contar almuerzos en vez de pedidos. Si lo ya reservado
-- supera la capacidad, esta se amplía para no invalidar pedidos existentes.
UPDATE "PickupSlot" s
SET "bookedCount" = t."total", "capacity" = GREATEST(s."capacity", t."total")
FROM (
  SELECT o."pickupSlotId", SUM(i."qty")::int AS "total"
  FROM "Order" o
  JOIN "OrderItem" i ON i."orderId" = o."id"
  WHERE o."status" IN ('pending_payment', 'paid', 'delivered')
     OR (o."status" = 'expired' AND o."paidAt" IS NOT NULL)
  GROUP BY o."pickupSlotId"
) t
WHERE t."pickupSlotId" = s."id";
