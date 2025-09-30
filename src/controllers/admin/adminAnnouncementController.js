const Announcement = require('../../models/Announcement');
const { response, errorResponse } = require('../../utils/responseHandlers');
const { logger } = require('../../utils/logger');

module.exports = {
    async create(req, res) {
        try {
            const { content } = req.body;
            const created_by = req.user.id; // Assuming user is authenticated and ID is available

            if (!content) {
                return errorResponse(res, 400, 'Announcement content is required.');
            }

            const result = await Announcement.create({ content, created_by });

            if (!result.success) {
                logger.error('Failed to create announcement:', result.error);
                return errorResponse(res, 400, result.error);
            }

            response(res, 201, 'Announcement created successfully', result.data);
        } catch (err) {
            logger.error('Error creating announcement:', err.message);
            errorResponse(res, 500, 'Internal server error', err.message);
        }
    },

    async list(req, res) {
        try {
            const result = await Announcement.list();

            if (!result.success) {
                logger.error('Failed to fetch announcements:', result.error);
                return errorResponse(res, 400, result.error);
            }

            response(res, 200, 'Announcements fetched successfully', result.data);
        } catch (err) {
            logger.error('Error fetching announcements:', err.message);
            errorResponse(res, 500, 'Internal server error', err.message);
        }
    },

    async update(req, res) {
        try {
            const { id } = req.params;
            const { content } = req.body;

            if (!content) {
                return errorResponse(res, 400, 'Announcement content is required.');
            }

            const result = await Announcement.update(id, { content });

            if (!result.success) {
                logger.error('Failed to update announcement:', result.error);
                return errorResponse(res, 400, result.error);
            }

            response(res, 200, 'Announcement updated successfully', result.data);
        } catch (err) {
            logger.error('Error updating announcement:', err.message);
            errorResponse(res, 500, 'Internal server error', err.message);
        }
    },

    async delete(req, res) {
        try {
            const { id } = req.params;
            const result = await Announcement.delete(id);

            if (!result.success) {
                logger.error('Failed to delete announcement:', result.error);
                return errorResponse(res, 400, result.error);
            }

            response(res, 200, 'Announcement deleted successfully', result.data);
        } catch (err) {
            logger.error('Error deleting announcement:', err.message);
            errorResponse(res, 500, 'Internal server error', err.message);
        }
    },
};
