// AdminEventController.js - Fixed default value
class AdminEventController {
    static async createEvent(req, res) {
        try {
            const {
                title,
                description,
                event_date,
                location,
                max_participants,
                registration_required,
                target_audience
            } = req.body;

            const created_by = req.user?.id || req.user?.user_id;

            if (!created_by) {
                return errorResponse(res, 401, 'User not authenticated');
            }

            if (!title || !event_date || !location) {
                return errorResponse(res, 400, 'Title, event date, and location are required');
            }

            const validTargetAudiences = [
                'all',
                'Civil Engineering',
                'Creative Arts',
                'Mechanical Engineering',
                'Electrical & Electronics Engineering',
                'Information & Communication Technology (ICT)',
                'Mining Engineering',
                'Transport and Logistics'
            ];

            if (target_audience && !validTargetAudiences.includes(target_audience)) {
                return errorResponse(res, 400, `Invalid target_audience. Must be one of: ${validTargetAudiences.join(', ')}.`);
            }

            const eventData = {
                title: title.trim(),
                description: description?.trim() || null,
                event_date,
                location: location.trim(),
                created_by,
                max_participants: max_participants ? parseInt(max_participants) : null,
                registration_required: !!registration_required,
                target_audience: target_audience || 'all'  // Changed from 'both' to 'all'
            };

            const { data, error } = await supabase
                .from('events')
                .insert([eventData])
                .select()
                .single();

            if (error) {
                logger.error('Supabase error creating event:', error);
                return errorResponse(res, 500, 'Failed to create event', error.message);
            }

            return response(res, 201, 'Event created successfully', data);
        } catch (error) {
            logger.error('Error in admin createEvent:', error);
            return errorResponse(res, 500, 'Internal server error', error.message);
        }
    }
}

// LecturerEventController.js - Fixed default value and date validation
class LecturerEventController {
    static async createEvent(req, res) {
        try {
            const {
                title,
                description,
                event_date,
                location,
                max_participants,
                registration_required,
                target_audience
            } = req.body;
            const created_by = req.user.id;

            if (!title || !event_date || !location) {
                return errorResponse(res, 400, 'Title, event date, and location are required');
            }

            const validTargetAudiences = [
                'all',
                'Civil Engineering',
                'Creative Arts',
                'Mechanical Engineering',
                'Electrical & Electronics Engineering',
                'Information & Communication Technology (ICT)',
                'Mining Engineering',
                'Transport and Logistics'
            ];

            if (target_audience && !validTargetAudiences.includes(target_audience)) {
                return errorResponse(res, 400, `Invalid target_audience. Must be one of: ${validTargetAudiences.join(', ')}.`);
            }

            const eventDate = new Date(event_date);
            if (eventDate <= new Date()) {
                return errorResponse(res, 400, 'Event date must be in the future');
            }

            const eventData = {
                title: title.trim(),
                description: description?.trim() || null,
                event_date: eventDate.toISOString(),
                location: location?.trim() || null,
                created_by,
                max_participants: max_participants ? parseInt(max_participants) : null,
                registration_required: !!registration_required,
                target_audience: target_audience || 'all'  // Changed from 'both' to 'all'
            };

            const result = await Event.create(eventData);

            if (!result.success) {
                logger.error('Failed to create event:', result.error);
                return errorResponse(res, 500, 'Failed to create event', result.error);
            }

            return response(res, 201, 'Event created successfully', result.data);
        } catch (error) {
            logger.error('Error in lecturer createEvent:', error.message);
            return errorResponse(res, 500, 'Internal server error', error.message);
        }
    }
}

// Updated Event Model - Added user department parameter
class Event {
    static async findAll(page = 1, limit = 10, filters = {}, userRole = null, userDepartment = null) {
        try {
            let query = db.from('events')
                .select(`
                    *,
                    users!events_created_by_fkey(
                        name,
                        email
                    )
                `, { count: 'exact' });

            // Apply role-based filtering for target_audience
            if (userRole && userRole !== 'admin' && userRole !== 'administrator' && userRole !== 'sys_admin' && userRole !== 'lecturer') {
                if (userDepartment) {
                    // Show events for 'all' or user's specific department
                    query = query.or(`target_audience.eq.all,target_audience.eq.${userDepartment}`);
                } else {
                    // If no department info, show only 'all' events
                    query = query.eq('target_audience', 'all');
                }
            }
            // Lecturers and admins see all events

            // Apply filters
            if (filters.title) {
                query = query.ilike('title', `%${filters.title}%`);
            }
            if (filters.location) {
                query = query.ilike('location', `%${filters.location}%`);
            }
            if (filters.created_by) {
                query = query.eq('created_by', filters.created_by);
            }
            if (filters.event_date_from) {
                query = query.gte('event_date', filters.event_date_from);
            }
            if (filters.event_date_to) {
                query = query.lte('event_date', filters.event_date_to);
            }
            if (filters.target_audience) {
                query = query.eq('target_audience', filters.target_audience);
            }

            const offset = (page - 1) * limit;
            query = query
                .order('event_date', { ascending: true })
                .range(offset, offset + limit - 1);

            const { data, error, count } = await query;

            if (error) {
                logger.error('Supabase error finding all events:', error.message);
                return { success: false, error: error.message };
            }

            return {
                success: true,
                data: data,
                pagination: {
                    page,
                    limit,
                    total: count,
                    pages: Math.ceil(count / limit)
                }
            };
        } catch (error) {
            logger.error('Error finding all events:', error.message);
            return { success: false, error: error.message };
        }
    }

    // Updated controller methods that need to pass userDepartment
    static async getAllEvents(req, res) {
        const { page, limit, title, location, created_by, event_date_from, event_date_to, target_audience } = req.query;
        const userRole = req.user?.role;
        const userDepartment = req.user?.department; // Get department from authenticated user

        const filters = {};
        if (title) filters.title = title;
        if (location) filters.location = location;
        if (created_by) filters.created_by = created_by;
        if (event_date_from) filters.event_date_from = event_date_from;
        if (event_date_to) filters.event_date_to = event_date_to;
        if (target_audience) filters.target_audience = target_audience;

        try {
            const result = await Event.findAll(
                parseInt(page) || 1,
                parseInt(limit) || 10,
                filters,
                userRole,
                userDepartment // Pass department
            );

            if (!result.success) {
                logger.error('Error fetching all events in controller:', result.error);
                return errorResponse(res, 400, result.error.message || 'Failed to fetch events');
            }
            response(res, 200, 'Events fetched successfully', result.data, result.pagination);
        } catch (error) {
            logger.error('Exception fetching all events:', error.message);
            errorResponse(res, 500, error.message);
        }
    }

    static async findUpcoming(limit = 10, userRole = null, userDepartment = null) {
        try {
            let query = supabase
                .from('events')
                .select(`
                    *,
                    users!events_created_by_fkey(
                        name,
                        email
                    )
                `)
                .gte('event_date', new Date().toISOString());

            // Apply role-based filtering for target_audience
            if (userRole && userRole !== 'admin' && userRole !== 'administrator' && userRole !== 'sys_admin' && userRole !== 'lecturer') {
                if (userDepartment) {
                    query = query.or(`target_audience.eq.all,target_audience.eq.${userDepartment}`);
                } else {
                    query = query.eq('target_audience', 'all');
                }
            }

            const { data, error } = await query
                .order('event_date', { ascending: true })
                .limit(limit);

            if (error) {
                logger.error('Supabase error finding upcoming events:', error.message);
                return { success: false, error: error.message };
            }

            return { success: true, data };
        } catch (error) {
            logger.error('Error finding upcoming events:', error.message);
            return { success: false, error: error.message };
        }
    }

    static async findPast(limit = 10, userRole = null, userDepartment = null) {
        try {
            let query = supabase
                .from('events')
                .select(`
                    *,
                    users!events_created_by_fkey(
                        name,
                        email
                    )
                `)
                .lt('event_date', new Date().toISOString());

            // Apply role-based filtering for target_audience
            if (userRole && userRole !== 'admin' && userRole !== 'administrator' && userRole !== 'sys_admin' && userRole !== 'lecturer') {
                if (userDepartment) {
                    query = query.or(`target_audience.eq.all,target_audience.eq.${userDepartment}`);
                } else {
                    query = query.eq('target_audience', 'all');
                }
            }

            const { data, error } = await query
                .order('event_date', { ascending: false })
                .limit(limit);

            if (error) {
                logger.error('Supabase error finding past events:', error.message);
                return { success: false, error: error.message };
            }

            return { success: true, data };
        } catch (error) {
            logger.error('Error finding past events:', error.message);
            return { success: false, error: error.message };
        }
    }

    static async searchEvents(searchTerm, page = 1, limit = 10, userRole = null, userDepartment = null) {
        try {
            const offset = (page - 1) * limit;

            let query = supabase
                .from('events')
                .select(`
                    *,
                    users!events_created_by_fkey(
                        name,
                        email
                    )
                `, { count: 'exact' })
                .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,location.ilike.%${searchTerm}%`);

            // Apply role-based filtering for target_audience
            if (userRole && userRole !== 'admin' && userRole !== 'administrator' && userRole !== 'sys_admin' && userRole !== 'lecturer') {
                if (userDepartment) {
                    query = query.or(`target_audience.eq.all,target_audience.eq.${userDepartment}`);
                } else {
                    query = query.eq('target_audience', 'all');
                }
            }

            const { data, error, count } = await query
                .order('event_date', { ascending: true })
                .range(offset, offset + limit - 1);

            if (error) {
                logger.error('Supabase error searching events:', error.message);
                return { success: false, error: error.message };
            }

            return {
                success: true,
                data,
                pagination: {
                    page,
                    limit,
                    total: count,
                    pages: Math.ceil(count / limit),
                },
            };
        } catch (error) {
            logger.error('Error searching events:', error.message);
            return { success: false, error: error.message };
        }
    }
}