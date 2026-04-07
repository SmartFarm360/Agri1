const db = require("../../../config/db");

let cachedUserNameColumn = null;
let cachedSupplierTableExists = null;

async function resolveUserNameColumn() {
  if (cachedUserNameColumn !== null) return cachedUserNameColumn;

  const result = await db.query(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users'
      AND column_name IN ('full_name', 'username', 'name')
    ORDER BY CASE
      WHEN column_name = 'full_name' THEN 0
      WHEN column_name = 'username' THEN 1
      ELSE 2
    END
    LIMIT 1
  `);

  cachedUserNameColumn = result.rows[0]?.column_name || "";
  return cachedUserNameColumn;
}

async function supplierProfileTableExists() {
  if (cachedSupplierTableExists !== null) return cachedSupplierTableExists;

  const result = await db.query(`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = 'supplier_profiles'
    ) AS exists
  `);

  cachedSupplierTableExists = Boolean(result.rows[0]?.exists);
  return cachedSupplierTableExists;
}

async function getSupplierOperatingAreas(userId) {
  if (!(await supplierProfileTableExists())) return [];

  const result = await db.query(
    `
    SELECT
      supplier_id,
      supplier_type,
      village,
      district,
      state,
      pincode,
      crops_handled,
      sourcing_type,
      avg_daily_volume,
      has_transport,
      transport_type,
      storage_facility,
      storage_type
    FROM supplier_profiles
    WHERE user_id = $1
    ORDER BY supplier_id ASC
    `,
    [userId],
  );

  return result.rows.map((row) => ({
    supplierId: Number(row.supplier_id),
    supplierType: row.supplier_type || "",
    village: row.village || "",
    district: row.district || "",
    state: row.state || "",
    pincode: row.pincode || "",
    cropsHandled: Array.isArray(row.crops_handled) ? row.crops_handled : [],
    sourcingType: row.sourcing_type || "",
    avgDailyVolume: row.avg_daily_volume || "",
    hasTransport: Boolean(row.has_transport),
    transportType: row.transport_type || "",
    storageFacility: Boolean(row.storage_facility),
    storageType: row.storage_type || "",
  }));
}

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function buildAreaLabel(area) {
  return [
    area?.village,
    area?.district,
    area?.state,
    area?.pincode,
  ]
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .join(", ");
}

function getMatchedAreaLabel(trace, operatingAreas) {
  if (!Array.isArray(operatingAreas) || operatingAreas.length === 0) return "";

  const exactFields = new Set([
    normalize(trace.packingPincode),
  ]);

  const fuzzyFields = [
    trace.packingCity,
    trace.packingState,
    trace.originLocation,
    trace.plantationLocation,
    trace.farmName,
  ]
    .map(normalize)
    .filter(Boolean);

  for (const area of operatingAreas) {
    const pincode = normalize(area?.pincode);
    if (pincode && exactFields.has(pincode)) {
      return buildAreaLabel(area);
    }

    const searchTerms = [area?.village, area?.district, area?.state]
      .map(normalize)
      .filter(Boolean);

    if (
      searchTerms.length > 0 &&
      searchTerms.every((term) =>
        fuzzyFields.some((fieldValue) => fieldValue.includes(term)),
      )
    ) {
      return buildAreaLabel(area);
    }

    if (
      searchTerms.length > 0 &&
      searchTerms.some((term) =>
        fuzzyFields.some((fieldValue) => fieldValue.includes(term)),
      )
    ) {
      return buildAreaLabel(area);
    }
  }

  return "";
}

exports.list = async (req, res) => {
  try {
    if (req.user.role !== "supplier") {
      return res
        .status(403)
        .json({ error: "Only supplier accounts can access supplier traces." });
    }

    const userNameColumn = await resolveUserNameColumn();
    const growerNameExpr = userNameColumn
      ? `COALESCE(u.${userNameColumn}, 'Grower')`
      : "'Grower'";
    const operatingAreas = await getSupplierOperatingAreas(req.user.user_id);

    const result = await db.query(`
      SELECT
        pk.id AS packing_id,
        pk.packing_date,
        pk.number_of_packages,
        pk.net_weight,
        pk.packing_size,
        pk.warehouse_name,
        pk.city,
        pk.state,
        pk.pincode,
        pk.country,
        pk.created_at AS packing_created_at,
        pl.id AS plantation_id,
        pl.name AS plantation_name,
        pl.location_description,
        pl.status AS plantation_status,
        pl.area_hectares,
        pl.created_at AS plantation_created_at,
        f.farm_id,
        f.farm_name,
        f.farm_location,
        u.user_id AS grower_user_id,
        ${growerNameExpr} AS grower_name,
        fp.farm_location AS registered_farm_location,
        fp.land_size AS registered_land_size,
        fp.crop_type AS registered_crop_type,
        h.id AS harvest_id,
        h.harvest_date,
        h.accepted_quantity,
        h.rejected_quantity,
        h.total_quantity,
        h.unit AS harvest_unit,
        c.id AS crop_id,
        c.crop_name,
        c.crop_variety,
        c.sowing_date,
        c.expected_harvest_date,
        assigned_patch.patch_id AS assigned_patch_id
      FROM packings pk
      INNER JOIN plantations pl ON pl.id = pk.plantation_id
      INNER JOIN users u ON u.user_id = pk.user_id
      LEFT JOIN farms f ON f.farm_id = pl.farm_id
      LEFT JOIN farmer_profiles fp ON fp.user_id = pk.user_id
      LEFT JOIN harvests h ON h.id = pk.harvest_id
      LEFT JOIN crops c ON c.id = h.crop_id
      LEFT JOIN LATERAL (
        SELECT p.patch_id
        FROM patches p
        CROSS JOIN LATERAL jsonb_array_elements(COALESCE(p.items, '[]'::jsonb)) item
        WHERE NULLIF(item->>'packing_id', '') IS NOT NULL
          AND (item->>'packing_id')::integer = pk.id
        ORDER BY p.created_at DESC
        LIMIT 1
      ) assigned_patch ON TRUE
      WHERE LOWER(COALESCE(u.role, '')) = 'farmer'
      ORDER BY pk.created_at DESC NULLS LAST, pk.id DESC
    `);

    let traces = result.rows.map((row) => {
      const originLocation =
        row.registered_farm_location ||
        row.farm_location ||
        row.location_description ||
        [row.city, row.state, row.pincode].filter(Boolean).join(", ");

      return {
        packingId: Number(row.packing_id),
        plantationId: Number(row.plantation_id),
        farmId: row.farm_id === null || row.farm_id === undefined ? null : Number(row.farm_id),
        growerUserId: Number(row.grower_user_id),
        plantationName: row.plantation_name || "Farm Trace",
        plantationLocation: row.location_description || "",
        plantationStatus: row.plantation_status || "Active",
        areaHectares: row.area_hectares === null ? null : Number(row.area_hectares),
        farmName: row.farm_name || row.plantation_name || "Farm",
        originLocation,
        growerName: row.grower_name || "Grower",
        cropId: row.crop_id === null || row.crop_id === undefined ? null : Number(row.crop_id),
        cropName: row.crop_name || row.registered_crop_type || "Crop",
        cropVariety: row.crop_variety || "",
        sowingDate: row.sowing_date,
        expectedHarvestDate: row.expected_harvest_date,
        harvestId: row.harvest_id === null || row.harvest_id === undefined ? null : Number(row.harvest_id),
        harvestDate: row.harvest_date,
        acceptedQuantity:
          row.accepted_quantity === null ? null : Number(row.accepted_quantity),
        rejectedQuantity:
          row.rejected_quantity === null ? null : Number(row.rejected_quantity),
        totalQuantity: row.total_quantity === null ? null : Number(row.total_quantity),
        harvestUnit: row.harvest_unit || "kg",
        packingDate: row.packing_date,
        packingSize: row.packing_size || "",
        numPackages:
          row.number_of_packages === null ? 0 : Number(row.number_of_packages),
        netWeight: row.net_weight === null ? 0 : Number(row.net_weight),
        warehouseName: row.warehouse_name || "Warehouse",
        packingCity: row.city || "",
        packingState: row.state || "",
        packingPincode: row.pincode || "",
        packingCountry: row.country || "",
        assignedPatchId: row.assigned_patch_id || "",
      };
    });

    if (operatingAreas.length > 0) {
      traces = traces
        .map((trace) => {
          const matchedArea = getMatchedAreaLabel(trace, operatingAreas);
          return matchedArea ? { ...trace, matchedArea } : null;
        })
        .filter(Boolean);
    }

    return res.json({
      operatingAreas,
      traces,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
