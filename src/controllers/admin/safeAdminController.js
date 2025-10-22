const { supabase } = require('../../config/database');
const { response, errorResponse } = require('../../utils/responseHandlers');
const { logger } = require('../../utils/logger');

class SafeAdminController {
    /**
     * Safe dashboard summary with direct database queries
     */
    static async getDashboardSummary(req, res) {
        try {
            logger.info('Starting safe admin dashboard summary...');

            // Direct database queries with fallbacks
            const queries = [
                // Total users
                supabase.from('users').select('id', { count: 'exact', head: true }),
                // New users (last 30 days)
                supabase.from('users').select('id', { count: 'exact', head: true })
                    .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
                // Total appointments  
                supabase.from('appointments').select('id', { count: 'exact', head: true }),
                // Pending appointments
                supabase.from('appointments').select('id', { count: 'exact', head: true })
                    .eq('status', 'pending'),
                // Events (if table exists)
                supabase.from('events').select('id', { count: 'exact', head: true }),
                // Posts (if table exists) 
                supabase.from('posts').select('id', { count: 'exact', head: true }),
                // Forums (if table exists)
                supabase.from('forums').select('id', { count: 'exact', head: true }),
                // Students
                supabase.from('users').select('id', { count: 'exact', head: true })
                    .eq('role', 'student'),
                // Lecturers
                supabase.from('users').select('id', { count: 'exact', head: true })
                    .eq('role', 'lecturer')
            ];

            const results = await Promise.allSettled(queries);

            const safeGetCount = (result, fallback = 0) => {
                if (result.status === 'fulfilled' && !result.value.error) {
                    return result.value.count || fallback;
                }
                return fallback;
            };

            const summary = {
                totalUsers: safeGetCount(results[0]),
                newUsersLast30Days: safeGetCount(results[1]),
                totalAppointments: safeGetCount(results[2]),
                pendingAppointments: safeGetCount(results[3]),
                totalEvents: safeGetCount(results[4]),
                totalPosts: safeGetCount(results[5]),
                totalForums: safeGetCount(results[6]),
                totalStudents: safeGetCount(results[7]),
                totalLecturers: safeGetCount(results[8]),
                upcomingEvents: 0, // Calculate later if needed
                generatedAt: new Date().toISOString()
            };

            logger.info('Safe admin dashboard summary completed:', summary);
            response(res, 200, 'Dashboard summary retrieved successfully', summary);

        } catch (error) {
            logger.error('Error in safe dashboard summary:', error);
            // Return minimal fallback data instead of error
            const fallbackSummary = {
                totalUsers: 0,
                newUsersLast30Days: 0,
                totalAppointments: 0,
                pendingAppointments: 0,
                totalEvents: 0,
                totalPosts: 0,
                totalForums: 0,
                totalStudents: 0,
                totalLecturers: 0,
                upcomingEvents: 0,
                generatedAt: new Date().toISOString(),
                note: 'Fallback data - some services may be unavailable'
            };
            response(res, 200, 'Dashboard summary retrieved with fallbacks', fallbackSummary);
        }
    }

    /**
     * Safe appointments list
     */
    static async getAppointmentsList(req, res) {
        try {
            logger.info('Starting safe admin appointments list...');
            
            const { page = 1, limit = 10, status, q } = req.query;
            const offset = (page - 1) * limit;

            let query = supabase
                .from('appointments')
                .select(`
                    *,
                    requester:requester_id(id, name, email, role),
                    appointee:appointee_id(id, name, email, role)  
                `, { count: 'exact' });

            if (status) {
                query = query.eq('status', status);
            }

            // Apply pagination
            query = query
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);

            const { data, error, count } = await query;

            if (error) {
                logger.error('Database error in appointments list:', error);
                return response(res, 200, 'Appointments retrieved with empty data', {
                    data: [],
                    pagination: { page: 1, limit: 10, total: 0, totalPages: 0 }
                });
            }

            // Transform appointments for frontend
            const transformedData = (data || []).map(apt => ({
                id: apt.id,
                lecturer_name: apt.appointee?.name || apt.appointee?.email || 'Unknown Staff',
                student_name: apt.requester?.name || apt.requester?.email || 'Unknown Student', 
                date: apt.appointment_date,
                time: apt.start_time,
                appointment_time: apt.appointment_time,
                status: apt.status,
                reason: apt.reason,
                location: apt.location,
                created_at: apt.created_at,
                updated_at: apt.updated_at
            }));

            const totalPages = Math.ceil((count || 0) / limit);

            const result = {
                success: true,
                data: transformedData,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: count || 0,
                    totalPages
                }
            };

            logger.info(`Safe admin appointments list completed: ${transformedData.length} appointments`);
            response(res, 200, 'Appointments retrieved successfully', result.data, result.pagination);

        } catch (error) {
            logger.error('Error in safe appointments list:', error);
            response(res, 200, 'Appointments retrieved with empty fallback', {
                data: [],
                pagination: { page: 1, limit: 10, total: 0, totalPages: 0 }
            });
        }
    }
}

module.exports = SafeAdminController;