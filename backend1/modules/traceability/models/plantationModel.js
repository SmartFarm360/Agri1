const db = require('../../../config/db');
const { buildWhere, buildUpdate } = require('../services/sqlBuilder');

function normalizePolygon(value) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value === 'string') {
    try {
      return JSON.stringify(JSON.parse(value));
    } catch {
      return JSON.stringify(value);
    }
  }
  return JSON.stringify(value);
}

exports.createPlantation = async (data) => {
  const name = data.name ?? data.farm_name;
  const location_description = data.location_description ?? data.farm_location ?? null;
  const area_hectares = data.area_hectares ?? data.land_size ?? null;
  const polygon = data.polygon_coordinates === undefined ? null : normalizePolygon(data.polygon_coordinates);

  const query = `
    INSERT INTO plantations (
      farm_id,
      user_id,
      name,
      location_description,
      polygon_coordinates,
      area_hectares,
      status
    )
    VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7, 'active'))
    RETURNING *;
  `;

  return db.query(query, [
    data.farm_id,
    data.user_id,
    name,
    location_description,
    polygon,
    area_hectares,
    data.status ?? null,
  ]);
};

exports.listPlantations = async (filters = {}) => {
  const { where, values } = buildWhere(
    {
      user_id: filters.user_id,
      farm_id: filters.farm_id,
      status: filters.status,
    },
    1
  );

  const query = `
    SELECT *
    FROM plantations
    ${where}
    ORDER BY created_at DESC;
  `;

  return db.query(query, values);
};

exports.getPlantationById = async (id) => {
  return db.query('SELECT * FROM plantations WHERE id = $1;', [id]);
};

exports.updatePlantation = async (id, data) => {
  const hasPolygon = Object.prototype.hasOwnProperty.call(data || {}, 'polygon_coordinates');
  const built = buildUpdate({
    table: 'plantations',
    idColumn: 'id',
    idValue: id,
    data: {
      ...data,
      polygon_coordinates: hasPolygon
        ? data.polygon_coordinates === null
          ? null
          : normalizePolygon(data.polygon_coordinates)
        : undefined,
    },
    allowedFields: [
      'farm_id',
      'user_id',
      'name',
      'location_description',
      'polygon_coordinates',
      'area_hectares',
      'status',
    ],
    setUpdatedAt: true,
  });

  if (!built) return db.query('SELECT * FROM plantations WHERE id = $1;', [id]);
  return db.query(built.query, built.values);
};

exports.deletePlantation = async (id) => {
  return db.query('DELETE FROM plantations WHERE id = $1 RETURNING *;', [id]);
};
