const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const Category = require('../models/Category');
const Subcategory = require('../models/Subcategory');
const Field = require('../models/Field');
const User = require('../models/User');
const Record = require('../models/Record');
const Tracking = require('../models/Tracking');
const router = express.Router();

// All routes in this file are protected and require Admin/Manager roles
router.use(protect);

// @desc    Get all categories
// @route   GET /api/admin/categories
router.get('/categories', async (req, res) => {
    try {
        const categories = await Category.find();
        res.status(200).json({ success: true, data: categories });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
});

// @desc    Update (rename/redescribe) a category
// @route   PATCH /api/admin/categories/:id
router.patch('/categories/:id', authorize('Admin'), async (req, res) => {
    try {
        const { name, description } = req.body;
        const updated = await Category.findByIdAndUpdate(
            req.params.id,
            { ...(name && { name }), ...(description !== undefined && { description }) },
            { new: true, runValidators: true }
        );
        if (!updated) return res.status(404).json({ success: false, message: 'Category not found' });
        res.status(200).json({ success: true, data: updated });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
});

// @desc    Delete a category and its fields, subcategories, and records
// @route   DELETE /api/admin/categories/:id
router.delete('/categories/:id', authorize('Admin'), async (req, res) => {
    try {
        const RecordValue = require('../models/RecordValue');
        // Delete all records + their values for this category
        const records = await Record.find({ category_id: req.params.id });
        for (const record of records) {
            await RecordValue.deleteMany({ record_id: record._id });
        }
        await Record.deleteMany({ category_id: req.params.id });
        await Field.deleteMany({ category_id: req.params.id });
        await Subcategory.deleteMany({ category_id: req.params.id });
        await Category.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: 'Category and all related data deleted' });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
});

// @route   POST /api/admin/categories
router.post('/categories', authorize('Admin'), async (req, res) => {
    try {
        const category = await Category.create(req.body);

        // Auto-seed mandatory base fields for every category
        await Field.insertMany([
            { category_id: category._id, field_name: 'Name', field_type: 'Text', required: true, is_system: true, field_order: 0 },
            { category_id: category._id, field_name: 'Phone Number', field_type: 'Phone', required: true, is_system: true, field_order: 1 }
        ]);

        res.status(201).json({ success: true, data: category });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
});


// @desc    Get subcategories for a category
// @route   GET /api/admin/categories/:categoryId/subcategories
router.get('/categories/:categoryId/subcategories', async (req, res) => {
    try {
        const subcategories = await Subcategory.find({ category_id: req.params.categoryId });
        res.status(200).json({ success: true, data: subcategories });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
});

// @desc    Add subcategory
router.post('/subcategories', authorize('Admin'), async (req, res) => {
    try {
        const subcategory = await Subcategory.create(req.body);
        res.status(201).json({ success: true, data: subcategory });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
});

// @desc    Get fields for a category
// @route   GET /api/admin/categories/:categoryId/fields
router.get('/categories/:categoryId/fields', async (req, res) => {
    try {
        const fields = await Field.find({ category_id: req.params.categoryId }).sort('field_order');
        res.status(200).json({ success: true, data: fields });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
});

// @desc    Add/Update field
router.post('/fields', authorize('Admin'), async (req, res) => {
    try {
        const field = await Field.create(req.body);
        res.status(201).json({ success: true, data: field });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
});

// @desc    Update a field
// @route   PATCH /api/admin/fields/:id
router.patch('/fields/:id', authorize('Admin'), async (req, res) => {
    try {
        const { field_name, field_type, required, options } = req.body;
        const updated = await Field.findByIdAndUpdate(
            req.params.id,
            {
                ...(field_name && { field_name }),
                ...(field_type && { field_type }),
                ...(required !== undefined && { required }),
                ...(options !== undefined && { options }),
            },
            { new: true, runValidators: true }
        );
        if (!updated) return res.status(404).json({ success: false, message: 'Field not found' });
        res.status(200).json({ success: true, data: updated });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
});

// @desc    Delete a field
// @route   DELETE /api/admin/fields/:id
router.delete('/fields/:id', authorize('Admin'), async (req, res) => {
    try {
        const RecordValue = require('../models/RecordValue');
        await RecordValue.deleteMany({ field_id: req.params.id });
        await Field.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: 'Field deleted' });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
});

const { Parser } = require('json2csv');

// @desc    Export records as CSV
// @route   GET /api/admin/export
router.get('/export', authorize('Admin', 'Manager'), async (req, res) => {
    try {
        const records = await Record.find()
            .populate('category_id', 'name')
            .populate('subcategory_id', 'name')
            .populate('agent_id', 'name');

        // This is a simplified export. A real one would join RecordValues.
        const fields = ['_id', 'category_id.name', 'subcategory_id.name', 'agent_id.name', 'latitude', 'longitude', 'created_at'];
        const json2csvParser = new Parser({ fields });
        const csv = json2csvParser.parse(records);

        res.header('Content-Type', 'text/csv');
        res.attachment('sales_data_export.csv');
        return res.send(csv);
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
});

// @desc    Get dashboard stats
// @route   GET /api/admin/stats
router.get('/stats', authorize('Admin', 'Manager'), async (req, res) => {
    try {
        const totalRecords = await Record.countDocuments();
        const activeAgents = await User.countDocuments({ role: 'Field Agent' });

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todaySubmissions = await Record.countDocuments({ created_at: { $gte: today } });

        const recentSubmissions = await Record.find()
            .populate('category_id', 'name')
            .populate('agent_id', 'name email')
            .sort('-created_at')
            .limit(8);

        // Top Performers: agents ranked by total submission count
        const topPerformers = await Record.aggregate([
            { $match: { agent_id: { $ne: null } } },
            { $group: { _id: '$agent_id', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 },
            { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'agent' } },
            { $unwind: { path: '$agent', preserveNullAndEmptyArrays: true } },
            { $match: { agent: { $ne: null } } },
            { $project: { _id: 1, count: 1, 'agent.name': 1, 'agent.email': 1 } }
        ]);

        res.status(200).json({
            success: true,
            data: {
                totalRecords,
                activeAgents,
                todaySubmissions,
                recentSubmissions,
                topPerformers
            }
        });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
});

// @desc    Get all records with their field values
router.get('/records', authorize('Admin', 'Manager'), async (req, res) => {
    try {
        const RecordValue = require('../models/RecordValue');
        const Field = require('../models/Field');

        const records = await Record.find()
            .populate('category_id', 'name')
            .populate('subcategory_id', 'name')
            .populate('agent_id', 'name email')
            .sort('-created_at');

        // Attach field values to each record
        const enriched = await Promise.all(records.map(async (record) => {
            const values = await RecordValue.find({ record_id: record._id })
                .populate('field_id', 'field_name field_type');
            const fieldData = values.reduce((acc, rv) => {
                if (rv.field_id) acc[rv.field_id.field_name] = rv.value;
                return acc;
            }, {});
            return { ...record.toObject(), fieldData };
        }));

        res.status(200).json({ success: true, data: enriched });
    } catch (err) {
        console.error('FETCH RECORDS ERROR:', err);
        res.status(400).json({ success: false, message: err.message });
    }
});


// @desc    Get all agents with metrics
router.get('/agents', authorize('Admin', 'Manager'), async (req, res) => {
    try {
        const agents = await User.aggregate([
            { $match: { role: 'Field Agent' } },
            {
                $lookup: {
                    from: 'records',
                    localField: '_id',
                    foreignField: 'agent_id',
                    as: 'submissions'
                }
            },
            {
                $project: {
                    name: 1,
                    email: 1,
                    phone: 1,
                    role: 1,
                    is_active: 1,
                    createdAt: 1,
                    totalSubmissions: { $size: { $ifNull: ['$submissions', []] } },
                    lastActive: { $max: '$submissions.created_at' }
                }
            },
            { $sort: { totalSubmissions: -1, name: 1 } }
        ]);
        res.status(200).json({ success: true, data: agents });
    } catch (err) {
        console.error('FETCH AGENTS ERROR:', err);
        res.status(400).json({ success: false, message: err.message });
    }
});

// @desc    Update agent status
router.patch('/agents/:id/status', authorize('Admin'), async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'Agent not found' });

        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            { is_active: !user.is_active },
            { new: true, runValidators: true }
        );

        res.status(200).json({ success: true, data: updatedUser });
    } catch (err) {
        console.error('STATUS_TOGGLE_FAIL:', err);
        res.status(400).json({ success: false, message: err.message });
    }
});

// @desc    Delete agent
router.delete('/agents/:id', authorize('Admin'), async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: 'Agent deleted' });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
});


// @desc    Update agent details
router.patch('/agents/:id', authorize('Admin'), async (req, res) => {
    try {
        const { name, email, phone } = req.body;

        const updateData = {};
        if (name) updateData.name = name;
        if (email) updateData.email = email;
        if (phone) updateData.phone = phone;

        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!updatedUser) return res.status(404).json({ success: false, message: 'Agent not found' });

        res.status(200).json({ success: true, data: updatedUser });
    } catch (err) {
        console.error('AGENT_UPDATE_FAIL:', err);
        res.status(400).json({ success: false, message: err.message });
    }
});

// @desc    Delete a record (and its field values)
// @route   DELETE /api/admin/records/:id
router.delete('/records/:id', authorize('Admin'), async (req, res) => {
    try {
        const RecordValue = require('../models/RecordValue');
        await RecordValue.deleteMany({ record_id: req.params.id });
        await Record.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: 'Record deleted' });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
});

// @desc    Delete a field
// @route   DELETE /api/admin/fields/:id
router.delete('/fields/:id', authorize('Admin'), async (req, res) => {
    try {
        await Field.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: 'Field deleted' });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
});

// @desc    Get tracking data: all agents with their last known location (from their most recent record)
// @route   GET /api/admin/tracking
router.get('/tracking', authorize('Admin', 'Manager'), async (req, res) => {
    try {
        const agents = await User.find({ role: 'Field Agent' }, 'name email is_active');

        const agentsWithLocation = await Promise.all(agents.map(async (agent) => {
            const lastRecord = await Record.findOne({ agent_id: agent._id, latitude: { $ne: null }, longitude: { $ne: null } })
                .sort('-created_at')
                .select('latitude longitude created_at category_id')
                .populate('category_id', 'name');

            const lastTracking = await Tracking.findOne({
                agent_id: agent._id,
                latitude: { $ne: null, $exists: true },
                longitude: { $ne: null, $exists: true }
            }).sort('-timestamp');

            let lastLoc = null;

            if (lastRecord && lastTracking) {
                const recDate = new Date(lastRecord.created_at);
                const trackDate = new Date(lastTracking.timestamp);
                if (recDate >= trackDate) {
                    lastLoc = {
                        latitude: lastRecord.latitude,
                        longitude: lastRecord.longitude,
                        lastSeen: lastRecord.created_at,
                        category: lastRecord.category_id?.name || 'Unknown'
                    };
                } else {
                    lastLoc = {
                        latitude: lastTracking.latitude,
                        longitude: lastTracking.longitude,
                        lastSeen: lastTracking.timestamp,
                        category: 'Live Tracking'
                    };
                }
            } else if (lastRecord) {
                lastLoc = {
                    latitude: lastRecord.latitude,
                    longitude: lastRecord.longitude,
                    lastSeen: lastRecord.created_at,
                    category: lastRecord.category_id?.name || 'Unknown'
                };
            } else if (lastTracking) {
                lastLoc = {
                    latitude: lastTracking.latitude,
                    longitude: lastTracking.longitude,
                    lastSeen: lastTracking.timestamp,
                    category: 'Live Tracking'
                };
            }

            return {
                _id: agent._id,
                name: agent.name,
                email: agent.email,
                is_active: agent.is_active,
                lastLocation: lastLoc
            };
        }));

        res.status(200).json({ success: true, data: agentsWithLocation });
    } catch (err) {
        console.error('TRACKING FETCH ERROR:', err);
        res.status(400).json({ success: false, message: err.message });
    }
});

// @desc    Bulk import records from Excel (pre-parsed on client)
// @route   POST /api/admin/import
router.post('/import', authorize('Admin', 'Manager'), async (req, res) => {
    try {
        const { category_id, rows } = req.body;
        // rows: Array of objects { fieldName: value, ... }
        if (!category_id || !Array.isArray(rows) || rows.length === 0) {
            return res.status(400).json({ success: false, message: 'category_id and rows[] are required' });
        }

        const RecordValue = require('../models/RecordValue');

        // Fetch fields for this category (for matching by name)
        const fields = await Field.find({ category_id });
        const fieldMap = {};
        fields.forEach(f => { fieldMap[f.field_name.trim().toLowerCase()] = f; });

        const created = [];
        for (const row of rows) {
            // Create the base record (agent = importer, no GPS)
            const record = await Record.create({
                category_id,
                agent_id: req.user.id,
                latitude: null,
                longitude: null,
            });

            // Create RecordValues for each column that matches a field
            const rvDocs = [];
            for (const [colName, value] of Object.entries(row)) {
                const field = fieldMap[colName.trim().toLowerCase()];
                if (field && value !== undefined && value !== '') {
                    rvDocs.push({ record_id: record._id, field_id: field._id, value: String(value) });
                }
            }
            if (rvDocs.length > 0) await RecordValue.insertMany(rvDocs);
            created.push(record._id);
        }

        res.status(201).json({ success: true, message: `Imported ${created.length} records`, count: created.length });
    } catch (err) {
        console.error('IMPORT ERROR:', err);
        res.status(400).json({ success: false, message: err.message });
    }
});

// @desc    Get current admin profile
// @route   GET /api/admin/profile
router.get('/profile', async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        res.status(200).json({ success: true, data: user });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
});

// @desc    Update admin profile (name, email, phone)
// @route   PATCH /api/admin/profile
router.patch('/profile', async (req, res) => {
    try {
        const { name, email, phone } = req.body;
        const updateData = {};
        if (name) updateData.name = name;
        if (email) updateData.email = email;
        if (phone) updateData.phone = phone;

        const user = await User.findByIdAndUpdate(req.user.id, updateData, { new: true, runValidators: true });
        res.status(200).json({ success: true, data: user, message: 'Profile updated successfully' });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
});

// @desc    Change admin password
// @route   PATCH /api/admin/password
router.patch('/password', async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, message: 'Please provide current and new password' });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
        }

        const user = await User.findById(req.user.id).select('+password');
        const isMatch = await user.matchPassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Current password is incorrect' });
        }

        user.password = newPassword;
        await user.save();
        res.status(200).json({ success: true, message: 'Password changed successfully' });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
});

// @desc    Get system stats for settings page
// @route   GET /api/admin/system-stats
router.get('/system-stats', authorize('Admin'), async (req, res) => {
    try {
        const Record = require('../models/Record');
        const totalRecords = await Record.countDocuments();
        const totalAgents = await User.countDocuments({ role: 'Field Agent' });
        const totalAdmins = await User.countDocuments({ role: { $in: ['Admin', 'Manager'] } });

        const dbStatus = 'Connected';
        res.status(200).json({
            success: true,
            data: { totalRecords, totalAgents, totalAdmins, dbStatus, serverTime: new Date().toISOString() }
        });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
});

module.exports = router;
