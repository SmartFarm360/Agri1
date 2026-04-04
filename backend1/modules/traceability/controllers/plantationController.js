const model = require('../models/plantationModel');
const db = require('../../../config/db');

exports.create = async (req, res) => {
  try {
    const name = req.body?.name ?? req.body?.farm_name;
    if (req.body?.farm_id === undefined || !name) {
      return res.status(400).json({ error: 'farm_id and name (or farm_name) are required' });
    }

    const payload = { ...(req.body || {}), user_id: req.user.user_id };
    const hasPolygon = Object.prototype.hasOwnProperty.call(payload, 'polygon_coordinates');

    if (!hasPolygon) {
      const farmId = Number(payload.farm_id);
      if (!Number.isInteger(farmId)) {
        return res.status(400).json({ error: 'Invalid farm_id' });
      }

      const farmResult = await db.query(
        'SELECT polygon_coordinates FROM farms WHERE farm_id = $1 AND user_id = $2;',
        [farmId, req.user.user_id]
      );

      if (farmResult.rows.length === 0) {
        return res.status(400).json({ error: 'Invalid farm_id for this user' });
      }

      if (farmResult.rows[0].polygon_coordinates !== undefined) {
        payload.polygon_coordinates = farmResult.rows[0].polygon_coordinates;
      }
    }

    const result = await model.createPlantation(payload);
    res.json(result.rows[0]);
  } catch (err) {
    if (err?.code === '23503') {
      return res.status(400).json({ error: 'Invalid farm_id or user_id (foreign key constraint)' });
    }
    res.status(500).json({ error: err.message });
  }
};

exports.list = async (req, res) => {
  try {
    const filters = {
      user_id: req.user.user_id,
      farm_id: req.query.farm_id ? Number(req.query.farm_id) : undefined,
      status: req.query.status,
    };
    const result = await model.listPlantations(filters);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id' });

    const result = await model.getPlantationById(id);
    const row = result.rows[0];
    if (!row) return res.status(404).json({ error: 'Plantation not found' });
    if (row.user_id !== req.user.user_id) return res.status(404).json({ error: 'Plantation not found' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id' });

    const result = await model.updatePlantation(id, req.body || {});
    const row = result.rows[0];
    if (!row) return res.status(404).json({ error: 'Plantation not found' });
    if (row.user_id !== req.user.user_id) return res.status(404).json({ error: 'Plantation not found' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id' });

    const result = await model.deletePlantation(id);
    const row = result.rows[0];
    if (!row) return res.status(404).json({ error: 'Plantation not found' });
    if (row.user_id !== req.user.user_id) return res.status(404).json({ error: 'Plantation not found' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
