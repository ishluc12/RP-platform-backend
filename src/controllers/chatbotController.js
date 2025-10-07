const Appointment = require('../models/Appointment');
const StaffAvailability = require('../models/StaffAvailability');
const User = require('../models/User');
const { response, errorResponse } = require('../utils/responseHandlers');
const { logger } = require('../utils/logger');

/**
 * Chatbot Controller - Handles intelligent queries from users
 * Fetches real data from database based on user role and query type
 */
class ChatbotController {
    /**
     * Main chatbot query handler
     * Analyzes user query and returns relevant data
     */
    static async query(req, res) {
        try {
            const { message, queryType } = req.body;
            const user = req.user; // From auth middleware

            if (!message && !queryType) {
                return errorResponse(res, 400, 'Message or queryType is required');
            }

            logger.info(`Chatbot query from user ${user.id} (${user.role}): ${message || queryType}`);

            // Determine query type if not explicitly provided
            const detectedType = queryType || ChatbotController.detectQueryType(message);

            let result;
            switch (detectedType) {
                case 'my_appointments':
                    result = await ChatbotController.getMyAppointments(user);
                    break;
                case 'my_availability':
                    result = await ChatbotController.getMyAvailability(user);
                    break;
                case 'upcoming_appointments':
                    result = await ChatbotController.getUpcomingAppointments(user);
                    break;
                case 'cancelled_appointments':
                    result = await ChatbotController.getCancelledAppointments(user);
                    break;
                case 'pending_appointments':
                    result = await ChatbotController.getPendingAppointments(user);
                    break;
                case 'accepted_appointments':
                    result = await ChatbotController.getAcceptedAppointments(user);
                    break;
                case 'staff_availability':
                    result = await ChatbotController.getStaffAvailability(user);
                    break;
                case 'appointment_stats':
                    result = await ChatbotController.getAppointmentStats(user);
                    break;
                case 'help':
                    result = await ChatbotController.getHelp(user);
                    break;
                default:
                    result = {
                        response: "I'm not sure what you're asking. Try asking about 'my appointments', 'my availability', 'upcoming appointments', or type 'help' for more options.",
                        suggestions: ['My appointments', 'My availability', 'Upcoming appointments', 'Help']
                    };
            }

            response(res, 200, 'Chatbot response generated', result);
        } catch (error) {
            logger.error('Chatbot query error:', error.message);
            errorResponse(res, 500, 'Failed to process chatbot query', error.message);
        }
    }

    /**
     * Detect query type from natural language message
     */
    static detectQueryType(message) {
        const msg = message.toLowerCase();

        if (msg.includes('my appointment') || msg.includes('appointment for me')) return 'my_appointments';
        if (msg.includes('my availability') || msg.includes('my schedule')) return 'my_availability';
        if (msg.includes('upcoming') || msg.includes('next appointment')) return 'upcoming_appointments';
        if (msg.includes('cancelled') || msg.includes('canceled')) return 'cancelled_appointments';
        if (msg.includes('pending') || msg.includes('waiting')) return 'pending_appointments';
        if (msg.includes('accepted') || msg.includes('confirmed')) return 'accepted_appointments';
        if (msg.includes('staff availability') || msg.includes('lecturer availability')) return 'staff_availability';
        if (msg.includes('stats') || msg.includes('statistics') || msg.includes('summary')) return 'appointment_stats';
        if (msg.includes('help') || msg.includes('what can you do')) return 'help';

        return 'unknown';
    }

    /**
     * Get all appointments for the user
     */
    static async getMyAppointments(user) {
    try {
        let appointments;
        
        if (user.role === 'student') {
            const result = await Appointment.listByRequester(user.id);
            appointments = result.data || [];
        } else if (['lecturer', 'administrator', 'admin', 'sys_admin'].includes(user.role)) {
            const result = await Appointment.listByAppointee(user.id);
            appointments = result.data || [];
        } else {
            return {
                response: "You don't have permission to view appointments.",
                data: []
            };
        }
        // REMOVED THE DUPLICATE LINE HERE

        const total = appointments.length;
        const pending = appointments.filter(a => a.status === 'pending').length;
        const accepted = appointments.filter(a => a.status === 'accepted').length;
        const cancelled = appointments.filter(a => a.status === 'cancelled' || a.status === 'declined').length;

        return {
            response: `You have ${total} total appointment(s): ${pending} pending, ${accepted} accepted, ${cancelled} cancelled/declined.`,
            data: {
                total,
                pending,
                accepted,
                cancelled,
                appointments: appointments.slice(0, 5)
            },
            suggestions: ['Show pending', 'Show accepted', 'Show cancelled', 'Upcoming appointments']
        };
    } catch (error) {
        logger.error('Error fetching appointments:', error);
        return {
            response: 'Sorry, I could not fetch your appointments at this time.',
            error: error.message
        };
    }
}

    /**
     * Get user's availability (for staff only)
     */
    static async getMyAvailability(user) {
        if (!['lecturer', 'administrator', 'admin', 'sys_admin'].includes(user.role)) {
            return {
                response: 'Availability management is only available for staff members (lecturers and administrators).',
                suggestions: ['My appointments', 'Upcoming appointments', 'Help']
            };
        }

        try {
            const result = await StaffAvailability.findByStaffId(user.id);
            const slots = result.data || [];

            const activeSlots = slots.filter(s => s.is_active);
            const inactiveSlots = slots.filter(s => !s.is_active);

            const dayNames = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
            const schedule = slots.map(slot => 
                `${dayNames[slot.day_of_week]}: ${slot.start_time.slice(0, 5)} - ${slot.end_time.slice(0, 5)} ${slot.is_active ? '(Active)' : '(Inactive)'}`
            ).join('\n');

            return {
                response: `You have ${activeSlots.length} active availability slot(s) and ${inactiveSlots.length} inactive slot(s).\n\n${schedule || 'No availability slots set.'}`,
                data: {
                    totalSlots: slots.length,
                    activeSlots: activeSlots.length,
                    inactiveSlots: inactiveSlots.length,
                    slots
                },
                suggestions: ['My appointments', 'Upcoming appointments', 'Appointment stats']
            };
        } catch (error) {
            logger.error('Error fetching availability:', error);
            return {
                response: 'Sorry, I could not fetch your availability at this time.',
                error: error.message
            };
        }
    }

    /**
     * Get upcoming appointments
     */
    static async getUpcomingAppointments(user) {
        try {
            let appointments;
            
            if (user.role === 'student') {
                const result = await Appointment.findUpcomingAppointments(user.id, 'requester', { page: 1, limit: 10 });
                appointments = result.data?.appointments || [];
            } else {
                const result = await Appointment.findUpcomingAppointments(user.id, 'appointee', { page: 1, limit: 10 });
                appointments = result.data?.appointments || [];
            }

            if (appointments.length === 0) {
                return {
                    response: 'You have no upcoming appointments.',
                    data: { appointments: [] },
                    suggestions: ['My appointments', 'Appointment stats', 'Help']
                };
            }

            const appointmentList = appointments.slice(0, 5).map(apt => {
                const date = new Date(apt.appointment_time).toLocaleString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
                const withPerson = user.role === 'student' 
                    ? `with ${apt.appointee?.name || 'Staff'}`
                    : `with ${apt.requester?.name || 'Student'}`;
                return `• ${date} ${withPerson} [${apt.status}]`;
            }).join('\n');

            return {
                response: `You have ${appointments.length} upcoming appointment(s):\n\n${appointmentList}`,
                data: { appointments },
                suggestions: ['Show pending', 'Show accepted', 'My availability']
            };
        } catch (error) {
            logger.error('Error fetching upcoming appointments:', error);
            return {
                response: 'Sorry, I could not fetch upcoming appointments at this time.',
                error: error.message
            };
        }
    }

    /**
     * Get cancelled appointments
     */
    static async getCancelledAppointments(user) {
        try {
            let appointments;
            
            if (user.role === 'student') {
                const result = await Appointment.listByRequester(user.id);
                appointments = result.data || [];
            } else {
                const result = await Appointment.listByAppointee(user.id);
                appointments = result.data || [];
            }

            const cancelled = appointments.filter(a => 
                a.status === 'cancelled' || a.status === 'declined'
            );

            if (cancelled.length === 0) {
                return {
                    response: 'You have no cancelled appointments.',
                    data: { appointments: [] },
                    suggestions: ['My appointments', 'Upcoming appointments', 'Help']
                };
            }

            return {
                response: `You have ${cancelled.length} cancelled/declined appointment(s).`,
                data: { appointments: cancelled },
                suggestions: ['My appointments', 'Upcoming appointments', 'Show accepted']
            };
        } catch (error) {
            logger.error('Error fetching cancelled appointments:', error);
            return {
                response: 'Sorry, I could not fetch cancelled appointments.',
                error: error.message
            };
        }
    }

    /**
     * Get pending appointments
     */
    static async getPendingAppointments(user) {
        try {
            let appointments;
            
            if (user.role === 'student') {
                const result = await Appointment.listByRequester(user.id);
                appointments = result.data || [];
            } else {
                const result = await Appointment.listByAppointee(user.id);
                appointments = result.data || [];
            }

            const pending = appointments.filter(a => a.status === 'pending');

            if (pending.length === 0) {
                return {
                    response: 'You have no pending appointments.',
                    data: { appointments: [] },
                    suggestions: ['My appointments', 'Upcoming appointments', 'Help']
                };
            }

            return {
                response: `You have ${pending.length} pending appointment(s) waiting for confirmation.`,
                data: { appointments: pending },
                suggestions: ['Show accepted', 'Show cancelled', 'My appointments']
            };
        } catch (error) {
            logger.error('Error fetching pending appointments:', error);
            return {
                response: 'Sorry, I could not fetch pending appointments.',
                error: error.message
            };
        }
    }

    /**
     * Get accepted appointments
     */
    static async getAcceptedAppointments(user) {
        try {
            let appointments;
            
            if (user.role === 'student') {
                const result = await Appointment.listByRequester(user.id);
                appointments = result.data || [];
            } else {
                const result = await Appointment.listByAppointee(user.id);
                appointments = result.data || [];
            }

            const accepted = appointments.filter(a => a.status === 'accepted');

            if (accepted.length === 0) {
                return {
                    response: 'You have no accepted appointments.',
                    data: { appointments: [] },
                    suggestions: ['My appointments', 'Show pending', 'Help']
                };
            }

            return {
                response: `You have ${accepted.length} accepted appointment(s).`,
                data: { appointments: accepted },
                suggestions: ['Upcoming appointments', 'Show pending', 'My appointments']
            };
        } catch (error) {
            logger.error('Error fetching accepted appointments:', error);
            return {
                response: 'Sorry, I could not fetch accepted appointments.',
                error: error.message
            };
        }
    }

    /**
     * Get staff availability (for students looking to book)
     */
    static async getStaffAvailability(user) {
        try {
            const result = await StaffAvailability.getAllActiveLecturerAvailability();
            const slots = result.data || [];

            const uniqueStaff = [...new Set(slots.map(s => s.staff?.name).filter(Boolean))];

            return {
                response: `There are ${uniqueStaff.length} staff member(s) available with ${slots.length} time slot(s).`,
                data: {
                    totalSlots: slots.length,
                    staffCount: uniqueStaff.length,
                    slots: slots.slice(0, 10) // First 10 slots
                },
                suggestions: ['My appointments', 'Book appointment', 'Help']
            };
        } catch (error) {
            logger.error('Error fetching staff availability:', error);
            return {
                response: 'Sorry, I could not fetch staff availability.',
                error: error.message
            };
        }
    }

    /**
     * Get appointment statistics
     */
    static async getAppointmentStats(user) {
        try {
            let appointments;
            
            if (user.role === 'student') {
                const result = await Appointment.listByRequester(user.id);
                appointments = result.data || [];
            } else if (['lecturer', 'administrator', 'admin', 'sys_admin'].includes(user.role)) {
                const result = await Appointment.listByAppointee(user.id);
                appointments = result.data || [];
            }

            const stats = {
                total: appointments.length,
                pending: appointments.filter(a => a.status === 'pending').length,
                accepted: appointments.filter(a => a.status === 'accepted').length,
                declined: appointments.filter(a => a.status === 'declined').length,
                cancelled: appointments.filter(a => a.status === 'cancelled').length,
                completed: appointments.filter(a => a.status === 'completed').length
            };

            const statsText = `
📊 Your Appointment Statistics:
• Total: ${stats.total}
• Pending: ${stats.pending}
• Accepted: ${stats.accepted}
• Declined: ${stats.declined}
• Cancelled: ${stats.cancelled}
• Completed: ${stats.completed}
            `.trim();

            return {
                response: statsText,
                data: stats,
                suggestions: ['My appointments', 'Upcoming appointments', 'Help']
            };
        } catch (error) {
            logger.error('Error fetching appointment stats:', error);
            return {
                response: 'Sorry, I could not fetch appointment statistics.',
                error: error.message
            };
        }
    }

    /**
     * Get help and available commands
     */
    static async getHelp(user) {
        const studentCommands = [
            '• "My appointments" - View all your appointments',
            '• "Upcoming appointments" - See your upcoming appointments',
            '• "Pending appointments" - View appointments waiting for approval',
            '• "Accepted appointments" - See confirmed appointments',
            '• "Cancelled appointments" - View cancelled/declined appointments',
            '• "Staff availability" - See available staff slots',
            '• "Appointment stats" - Get appointment statistics'
        ];

        const staffCommands = [
            ...studentCommands,
            '• "My availability" - View your availability schedule',
            '• "My schedule" - See your availability slots'
        ];

        const commands = user.role === 'student' ? studentCommands : staffCommands;

        return {
            response: `Hi ${user.name || 'there'}! I'm your appointment assistant. Here's what I can help you with:\n\n${commands.join('\n')}\n\nJust type what you need or click a suggestion!`,
            suggestions: ['My appointments', 'Upcoming appointments', 'Appointment stats', user.role !== 'student' ? 'My availability' : 'Staff availability'].filter(Boolean)
        };
    }
}

module.exports = ChatbotController;
