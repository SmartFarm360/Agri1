const model = require('../models/cropModel');

exports.create = async (req, res) => {
  try {
    if (req.body?.plantation_id === undefined || req.body?.user_id === undefined || !req.body?.crop_name) {
      return res.status(400).json({ error: 'plantation_id, user_id, and crop_name are required' });
    }
    const result = await model.createCrop(req.body);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.list = async (req, res) => {
  try {
    const filters = {
      user_id: req.query.user_id ? Number(req.query.user_id) : undefined,
      plantation_id: req.query.plantation_id ? Number(req.query.plantation_id) : undefined,
      crop_name: req.query.crop_name,
    };
    const result = await model.listCrops(filters);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id' });

    const result = await model.getCropById(id);
    const row = result.rows[0];
    if (!row) return res.status(404).json({ error: 'Crop not found' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id' });

    const result = await model.updateCrop(id, req.body || {});
    const row = result.rows[0];
    if (!row) return res.status(404).json({ error: 'Crop not found' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id' });

    const result = await model.deleteCrop(id);
    const row = result.rows[0];
    if (!row) return res.status(404).json({ error: 'Crop not found' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
