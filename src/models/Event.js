const { supabase, supabaseAdmin } = require('../config/database');
const { logger } = require('../utils/logger');

// Use admin client to bypass RLS policies for server-side operations
const db = supabaseAdmin || supabase;

class Event {
    static async create(eventData) {
        try {
            const { title, description, event_date, location, created_by, max_participants = null, registration_required = false, target_audience = 'all' } = eventData;
            const insertData = { title, description, event_date, location, created_by, max_participants, registration_required, target_audience };
            const { data, error } = await db
                .from('events')
                .insert([insertData])
                .select()
                .single();

            if (error) {
                logger.error('Supabase error creating event:', error);
                return { success: false, error };
            }

            return { success: true, data };
        } catch (error) {
            logger.error('Error creating event:', error.message);
            return { success: false, error: error.message };
        }
    }

    static async findById(id) {
        try {
            const { data, error } = await db
                .from('events')
                .select(`
                    *,
                    users!events_created_by_fkey(
                        name,
                        email
                    )
                `)
                .eq('id', id)
                .single();

            if (error) {
                if (error.code === 'PGRST116') { // Supabase returns this code for no rows found
                    return { success: false, error: 'Event not found' };
                }
                logger.error('Supabase error finding event by ID:', error.message);
                return { success: false, error: error.message };
            }

            return { success: true, data };
        } catch (error) {
            logger.error('Error finding event by ID:', error.message);
            return { success: false, error: error.message };
        }
    }

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
            // Show events that are for 'all' or match the user's department
            if (userRole && userRole !== 'admin' && userRole !== 'administrator' && userRole !== 'sys_admin') {
                if (userDepartment) {
                    // Show events for 'all' or user's specific department
                    query = query.or(`target_audience.eq.all,target_audience.eq.${userDepartment}`);
                } else {
                    // If no department info, show only 'all' events
                    query = query.eq('target_audience', 'all');
                }
            }

            // Apply filters (only for columns that exist)
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

    static async update(id, updateData) {
        try {
            const allowedFields = [
                'title',
                'description',
                'event_date',
                'location',
                'max_participants',
                'registration_required',
                'target_audience'
            ];
            const filteredUpdate = {};
            allowedFields.forEach(field => {
                if (updateData[field] !== undefined) filteredUpdate[field] = updateData[field];
            });

            const { data, error } = await db
                .from('events')
                .update(filteredUpdate)
                .eq('id', id)
                .select()
                .single();

            if (error) {
                logger.error('Supabase error updating event:', error.message);
                return { success: false, error: error.message };
            }
            if (!data) {
                return { success: false, error: 'Event not found' };
            }

            return { success: true, data };
        } catch (error) {
            logger.error('Error updating event:', error.message);
            return { success: false, error: error.message };
        }
    }

    static async delete(id) {
        try {
            const { data, error } = await supabase
                .from('events')
                .delete()
                .eq('id', id)
                .select()
                .single();

            if (error) {
                logger.error('Supabase error deleting event:', error.message);
                return { success: false, error: error.message };
            }
            if (!data) {
                return { success: false, error: 'Event not found' };
            }

            return { success: true, data };
        } catch (error) {
            logger.error('Error deleting event:', error.message);
            return { success: false, error: error.message };
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
            if (userRole && userRole !== 'admin' && userRole !== 'administrator' && userRole !== 'sys_admin') {
                if (userDepartment) {
                    // Show events for 'all' or user's specific department
                    query = query.or(`target_audience.eq.all,target_audience.eq.${userDepartment}`);
                } else {
                    // If no department info, show only 'all' events
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
            if (userRole && userRole !== 'admin' && userRole !== 'administrator' && userRole !== 'sys_admin') {
                if (userDepartment) {
                    // Show events for 'all' or user's specific department
                    query = query.or(`target_audience.eq.all,target_audience.eq.${userDepartment}`);
                } else {
                    // If no department info, show only 'all' events
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

    static async findByCreator(created_by, page = 1, limit = 10) {
        try {
            const offset = (page - 1) * limit;
            const { data, error, count } = await supabase
                .from('events')
                .select(`
                    *,
                    users!events_created_by_fkey(
                        name,
                        email
                    )
                `, { count: 'exact' })
                .eq('created_by', created_by)
                .order('event_date', { ascending: true })
                .range(offset, offset + limit - 1);

            if (error) {
                logger.error('Supabase error finding events by creator:', error.message);
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
            logger.error('Error finding events by creator:', error.message);
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
            if (userRole && userRole !== 'admin' && userRole !== 'administrator' && userRole !== 'sys_admin') {
                if (userDepartment) {
                    // Show events for 'all' or user's specific department
                    query = query.or(`target_audience.eq.all,target_audience.eq.${userDepartment}`);
                } else {
                    // If no department info, show only 'all' events
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

    static async rsvpToEvent(eventId, userId, status) {
        try {
            const { data, error } = await supabase
                .from('event_participants')
                .upsert({ event_id: eventId, user_id: userId, status })
                .select()
                .single();

            if (error) {
                logger.error('Supabase error in rsvpToEvent:', error.message);
                return { success: false, error: error.message };
            }

            // Check if the upserted row exists and determine the action
            const action = (data.created_at !== data.responded_at) ? 'updated' : 'created';

            return { success: true, data, action };
        } catch (error) {
            logger.error('Error in rsvpToEvent:', error.message);
            return { success: false, error: error.message };
        }
    }

    static async getEventParticipants(eventId, page = 1, limit = 20) {
        try {
            const offset = (page - 1) * limit;
            const { data, error, count } = await supabase
                .from('event_participants')
                .select(`
                    *,
                    users!event_participants_user_id_fkey(
                        name,
                        email,
                        profile_picture
                    )
                `, { count: 'exact' })
                .eq('event_id', eventId)
                .order('responded_at', { ascending: false })
                .range(offset, offset + limit - 1);

            if (error) {
                logger.error('Supabase error in getEventParticipants:', error.message);
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
            logger.error('Error in getEventParticipants:', error.message);
            return { success: false, error: error.message };
        }
    }

    static async getUserRsvpStatus(eventId, userId) {
        try {
            const { data, error } = await supabase
                .from('event_participants')
                .select('status')
                .eq('event_id', eventId)
                .eq('user_id', userId)
                .single();

            if (error && error.code === 'PGRST116') {
                return { success: true, data: null, status: 'not_responded' };
            }
            if (error) {
                logger.error('Supabase error in getUserRsvpStatus:', error.message);
                return { success: false, error: error.message };
            }

            return { success: true, data, status: data.status };
        } catch (error) {
            logger.error('Error in getUserRsvpStatus:', error.message);
            return { success: false, error: error.message };
        }
    }

    static async getUserRsvpEvents(userId, page = 1, limit = 20) {
        try {
            const offset = (page - 1) * limit;

            const { data, error, count } = await supabase
                .from('event_participants')
                .select(`
                    status,
                    responded_at,
                    events!event_participants_event_id_fkey(
                        *,
                        users!events_created_by_fkey(
                            name
                        )
                    )
                `, { count: 'exact' })
                .eq('user_id', userId)
                .order('event_date', { ascending: true, foreignTable: 'events' })
                .range(offset, offset + limit - 1);

            if (error) {
                logger.error('Supabase error in getUserRsvpEvents:', error.message);
                return { success: false, error: error.message };
            }

            const formattedData = data.map(item => ({
                ...item.events,
                rsvp_status: item.status,
                responded_at: item.responded_at
            }));

            return {
                success: true,
                data: formattedData,
                pagination: {
                    page,
                    limit,
                    total: count,
                    pages: Math.ceil(count / limit),
                },
            };
        } catch (error) {
            logger.error('Error in getUserRsvpEvents:', error.message);
            return { success: false, error: error.message };
        }
    }

    static async removeRsvp(eventId, userId) {
        try {
            const { data, error } = await supabase
                .from('event_participants')
                .delete()
                .eq('event_id', eventId)
                .eq('user_id', userId)
                .select()
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    return { success: false, error: 'RSVP not found' };
                }
                logger.error('Supabase error in removeRsvp:', error.message);
                return { success: false, error: error.message };
            }
            if (!data) {
                return { success: false, error: 'RSVP not found' };
            }

            return { success: true, data };
        } catch (error) {
            logger.error('Error in removeRsvp:', error.message);
            return { success: false, error: error.message };
        }
    }

    static async getEventStats(eventId = null) {
        try {
            let query;
            if (eventId) {
                // Fetch stats for a specific event using the RPC
                query = supabase.rpc('get_event_stats', { event_id_param: eventId });
            } else {
                // Fetch overall stats using the view
                query = supabase.from('events_with_stats_view').select('*');
            }

            const { data, error } = await query;

            if (error) {
                logger.error('Supabase RPC/View error in getEventStats:', error.message);
                return { success: false, error: error.message };
            }

            return { success: true, data: data[0] }; // data[0] if it's a single result (RPC) or the first row of view
        } catch (error) {
            logger.error('Error in getEventStats:', error.message);
            return { success: false, error: error.message };
        }
    }

    static async getEventsWithParticipantCounts(page = 1, limit = 10, filters = {}) {
        try {
            const offset = (page - 1) * limit;

            // This requires a database VIEW or RPC for a single query.
            // For a pure Supabase client solution, you'd fetch events and then
            // participant counts in separate queries, which is less efficient.
            // The following uses a Supabase VIEW called `events_with_stats_view`
            // to combine the data.
            const { data, error, count } = await supabase
                .from('events_with_stats_view')
                .select('*', { count: 'exact' })
                .order('event_date', { ascending: true })
                .range(offset, offset + limit - 1);

            if (error) {
                logger.error('Supabase error in getEventsWithParticipantCounts:', error.message);
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
            logger.error('Error in getEventsWithParticipantCounts:', error.message);
            return { success: false, error: error.message };
        }
    }
}

module.exports = Event;