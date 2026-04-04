const model = require('../models/plantationModel');

exports.create = async (req, res) => {
  try {
    const name = req.body?.name ?? req.body?.farm_name;
    if (req.body?.farm_id === undefined || req.body?.user_id === undefined || !name) {
      return res.status(400).json({ error: 'farm_id, user_id, and name (or farm_name) are required' });
    }
    const result = await model.createPlantation(req.body);
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
      user_id: req.query.user_id ? Number(req.query.user_id) : undefined,
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
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
