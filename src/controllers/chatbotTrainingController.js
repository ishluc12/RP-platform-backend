const EnhancedChatbotTrainingService = require('../services/enhancedChatbotTrainingService');
const Appointment = require('../models/Appointment');
const StaffAvailability = require('../models/StaffAvailability');
const Event = require('../models/Event');
const User = require('../models/User');
const { response, errorResponse } = require('../utils/responseHandlers');
const { logger } = require('../utils/logger');

/**
 * Enhanced Chatbot Controller with intelligent routing and API integration
 */
class EnhancedChatbotController {
    /**
     * Main query handler with intelligent routing
     */
    static async query(req, res) {
        try {
            const { message, context = {} } = req.body;
            const user = req.user;

            if (!message) {
                return errorResponse(res, 400, 'Message is required');
            }

            logger.info(`Enhanced chatbot query from ${user.id} (${user.role}): ${message}`);

            // Get intent classification with role-based response
            const classification = await EnhancedChatbotTrainingService.processQueryWithRole(
                message,
                user.role
            );

            // Process based on intent and action
            let result;
            if (classification.success && classification.action) {
                result = await EnhancedChatbotController.executeAction(
                    classification.action,
                    user,
                    context
                );
                
                // Enhance result with classification data
                result = {
                    ...result,
                    intent: classification.intent,
                    confidence: classification.confidence,
                    navigationLink: classification.link,
                    suggestions: classification.suggestions
                };
            } else {
                result = {
                    response: classification.message,
                    suggestions: classification.suggestions,
                    navigationLink: '/help'
                };
            }

            response(res, 200, 'Query processed successfully', result);
        } catch (error) {
            logger.error('Enhanced chatbot error:', error.message);
            errorResponse(res, 500, 'Failed to process query', error.message);
        }
    }

    /**
     * Execute action based on intent
     */
    static async executeAction(action, user, context) {
        try {
            const actionHandlers = {
                // Appointment Actions
                show_available_staff: () => this.getAvailableStaff(user, context),
                fetch_staff_availability: () => this.fetchStaffAvailability(user, context),
                fetch_student_appointments: () => this.getStudentAppointments(user),
                fetch_lecturer_appointments: () => this.getLecturerAppointments(user),
                fetch_admin_appointments: () => this.getAdminAppointments(user),
                check_appointment_status: () => this.checkAppointmentStatus(user),
                show_cancellable_appointments: () => this.getCancellableAppointments(user),
                show_reschedulable_appointments: () => this.getReschedulableAppointments(user),
                fetch_today_availability: () => this.getTodayAvailability(user),
                show_today_schedule: () => this.getTodaySchedule(user),
                show_appointment_requests: () => this.getAppointmentRequests(user),
                show_pending_requests: () => this.getPendingRequests(user),
                
                // Availability Actions
                show_my_availability: () => this.getMyAvailability(user),
                manage_availability: () => this.manageAvailability(user),
                show_all_staff_availability: () => this.getAllStaffAvailability(user),
                
                // Event Actions
                fetch_upcoming_events: () => this.getUpcomingEvents(user),
                fetch_lecturer_events: () => this.getLecturerEvents(user),
                fetch_all_events: () => this.getAllEvents(user),
                create_event_form: () => this.createEventForm(user),
                create_event_admin: () => this.createEventAdmin(user),
                
                // Messaging Actions
                open_messages: () => this.openMessages(user),
                open_lecturer_messages: () => this.openLecturerMessages(user),
                open_admin_messages: () => this.openAdminMessages(user),
                
                // Help Actions
                show_help_menu: () => this.showHelpMenu(user),
                show_lecturer_help: () => this.showLecturerHelp(user),
                show_admin_help: () => this.showAdminHelp(user)
            };

            const handler = actionHandlers[action];
            if (handler) {
                return await handler();
            }

            return {
                response: 'I understand what you need, but this feature is being set up. Please try the navigation link.',
                success: false
            };
        } catch (error) {
            logger.error(`Action execution error for ${action}:`, error);
            throw error;
        }
    }

    /**
     * Get available staff for booking
     */
    static async getAvailableStaff(user, context) {
        try {
            const result = await StaffAvailability.getAllActiveLecturerAvailability();
            const slots = result.data || [];

            // Group by staff
            const staffMap = new Map();
            slots.forEach(slot => {
                if (!slot.staff_id) return;
                
                if (!staffMap.has(slot.staff_id)) {
                    staffMap.set(slot.staff_id, {
                        staff: slot.staff,
                        slots: []
                    });
                }
                staffMap.get(slot.staff_id).slots.push(slot);
            });

            const staffList = Array.from(staffMap.values()).map(item => {
                const availableDays = [...new Set(item.slots.map(s => s.day_of_week))];
                const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                
                return {
                    name: item.staff?.name || 'Staff Member',
                    department: item.staff?.department,
                    availableDays: availableDays.map(d => dayNames[d]).join(', '),
                    totalSlots: item.slots.length,
                    bookingLink: `/appointments/new?staff_id=${item.staff?.id}`
                };
            });

            return {
                response: `Found ${staffList.length} available lecturer(s). Click on a name to book:`,
                data: {
                    staffList,
                    totalSlots: slots.length
                },
                interactive: true,
                quickActions: staffList.slice(0, 3).map(staff => ({
                    label: `Book with ${staff.name}`,
                    action: 'book_appointment',
                    params: { staff_id: staff.id }
                }))
            };
        } catch (error) {
            logger.error('Error fetching available staff:', error);
            return {
                response: 'Sorry, I couldn\'t fetch available staff. Please try again or use the navigation link.',
                error: error.message
            };
        }
    }

    /**
     * Fetch detailed staff availability
     */
    static async fetchStaffAvailability(user, context) {
        try {
            // If specific staff requested in context
            if (context.staffName || context.staffId) {
                const staffId = context.staffId || await this.findStaffByName(context.staffName);
                const result = await StaffAvailability.findByStaffId(staffId);
                const slots = result.data || [];

                const schedule = this.formatAvailabilitySchedule(slots);

                return {
                    response: `Here's the availability for ${context.staffName || 'the lecturer'}:\n\n${schedule}`,
                    data: { slots },
                    quickActions: [
                        {
                            label: 'Book Now',
                            action: 'book_appointment',
                            params: { staff_id: staffId }
                        }
                    ]
                };
            }

            // General availability
            return await this.getAvailableStaff(user, context);
        } catch (error) {
            logger.error('Error fetching staff availability:', error);
            return {
                response: 'Sorry, I couldn\'t fetch the availability information.',
                error: error.message
            };
        }
    }

    /**
     * Get student's appointments with rich formatting
     */
    static async getStudentAppointments(user) {
        try {
            const result = await Appointment.listByRequester(user.id);
            const appointments = result.data || [];

            if (appointments.length === 0) {
                return {
                    response: 'You don\'t have any appointments yet. Would you like to book one?',
                    data: { appointments: [] },
                    quickActions: [
                        {
                            label: 'Book Appointment',
                            action: 'book_appointment',
                            link: '/appointments/new'
                        },
                        {
                            label: 'View Available Staff',
                            action: 'show_available_staff'
                        }
                    ]
                };
            }

            const grouped = this.groupAppointmentsByStatus(appointments);
            
            let responseText = `You have ${appointments.length} appointment(s):\n\n`;
            
            if (grouped.pending.length > 0) {
                responseText += `📋 **Pending (${grouped.pending.length})**\n`;
                grouped.pending.slice(0, 3).forEach(apt => {
                    responseText += this.formatAppointmentLine(apt);
                });
            }

            if (grouped.accepted.length > 0) {
                responseText += `\n✅ **Accepted (${grouped.accepted.length})**\n`;
                grouped.accepted.slice(0, 3).forEach(apt => {
                    responseText += this.formatAppointmentLine(apt);
                });
            }

            return {
                response: responseText,
                data: {
                    total: appointments.length,
                    grouped,
                    appointments
                },
                interactive: true,
                quickActions: this.getAppointmentQuickActions(grouped)
            };
        } catch (error) {
            logger.error('Error fetching student appointments:', error);
            return {
                response: 'Sorry, I couldn\'t fetch your appointments.',
                error: error.message
            };
        }
    }

    /**
     * Get today's availability for urgent bookings
     */
    static async getTodayAvailability(user) {
        try {
            const result = await StaffAvailability.getAllActiveLecturerAvailability();
            const today = new Date().getDay();
            const currentTime = new Date();
            
            const todaySlots = result.data.filter(slot => {
                if (slot.day_of_week !== today) return false;
                
                // Check if slot is still available (not in the past)
                const slotTime = new Date();
                const [hours, minutes] = slot.start_time.split(':');
                slotTime.setHours(parseInt(hours), parseInt(minutes));
                
                return slotTime > currentTime;
            });

            if (todaySlots.length === 0) {
                return {
                    response: 'No available slots remaining today. Would you like to check tomorrow\'s availability?',
                    data: { slots: [] },
                    quickActions: [
                        {
                            label: 'Check Tomorrow',
                            action: 'fetch_tomorrow_availability'
                        },
                        {
                            label: 'View All Availability',
                            action: 'show_available_staff'
                        }
                    ]
                };
            }

            const formattedSlots = todaySlots.map(slot => ({
                lecturer: slot.staff?.name,
                time: `${slot.start_time} - ${slot.end_time}`,
                bookingLink: `/appointments/urgent?slot_id=${slot.id}`
            }));

            return {
                response: `Found ${todaySlots.length} urgent slot(s) available today:`,
                data: {
                    slots: formattedSlots,
                    urgent: true
                },
                quickActions: formattedSlots.slice(0, 3).map(slot => ({
                    label: `Book ${slot.time} with ${slot.lecturer}`,
                    action: 'book_urgent',
                    link: slot.bookingLink
                }))
            };
        } catch (error) {
            logger.error('Error fetching today\'s availability:', error);
            return {
                response: 'Sorry, I couldn\'t check today\'s availability.',
                error: error.message
            };
        }
    }

    /**
     * Get upcoming events with rich formatting
     */
    static async getUpcomingEvents(user) {
        try {
            const result = await Event.getAll();
            const events = result.data || [];
            
            const upcoming = events.filter(event => 
                new Date(event.event_date) > new Date()
            ).sort((a, b) => 
                new Date(a.event_date) - new Date(b.event_date)
            );

            if (upcoming.length === 0) {
                return {
                    response: 'No upcoming events at the moment. Check back later!',
                    data: { events: [] }
                };
            }

            const eventList = upcoming.slice(0, 5).map(event => ({
                title: event.title,
                date: this.formatDate(event.event_date),
                location: event.location || 'TBA',
                description: event.description?.substring(0, 100),
                registrationLink: `/events/${event.id}/register`,
                canRegister: event.registration_required
            }));

            let responseText = `Found ${upcoming.length} upcoming event(s):\n\n`;
            eventList.forEach((event, index) => {
                responseText += `${index + 1}. **${event.title}**\n`;
                responseText += `   📅 ${event.date}\n`;
                responseText += `   📍 ${event.location}\n`;
                if (event.canRegister) {
                    responseText += `   ✅ Registration required\n`;
                }
                responseText += '\n';
            });

            return {
                response: responseText,
                data: {
                    total: upcoming.length,
                    events: eventList
                },
                interactive: true,
                quickActions: eventList.slice(0, 3).map(event => ({
                    label: event.canRegister ? `Register for ${event.title}` : `View ${event.title}`,
                    link: event.registrationLink
                }))
            };
        } catch (error) {
            logger.error('Error fetching events:', error);
            return {
                response: 'Sorry, I couldn\'t fetch upcoming events.',
                error: error.message
            };
        }
    }

    // Helper Methods

    /**
     * Format availability schedule
     */
    static formatAvailabilitySchedule(slots) {
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const grouped = {};
        
        slots.forEach(slot => {
            const day = dayNames[slot.day_of_week];
            if (!grouped[day]) grouped[day] = [];
            grouped[day].push(`${slot.start_time.slice(0, 5)} - ${slot.end_time.slice(0, 5)}`);
        });

        return Object.entries(grouped)
            .map(([day, times]) => `**${day}**: ${times.join(', ')}`)
            .join('\n');
    }

    /**
     * Format appointment line for display
     */
    static formatAppointmentLine(apt) {
        const date = new Date(apt.appointment_time).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        const with_person = apt.appointee?.name || apt.requester?.name || 'Unknown';
        return `   • ${date} with ${with_person} - ${apt.reason || 'General'}\n`;
    }

    /**
     * Group appointments by status
     */
    static groupAppointmentsByStatus(appointments) {
        return {
            pending: appointments.filter(a => a.status === 'pending'),
            accepted: appointments.filter(a => a.status === 'accepted'),
            declined: appointments.filter(a => a.status === 'declined'),
            cancelled: appointments.filter(a => a.status === 'cancelled'),
            completed: appointments.filter(a => a.status === 'completed')
        };
    }

    /**
     * Get appointment quick actions based on status
     */
    static getAppointmentQuickActions(grouped) {
        const actions = [];
        
        if (grouped.pending.length > 0) {
            actions.push({
                label: 'View Pending',
                link: '/appointments?filter=pending'
            });
        }
        
        if (grouped.accepted.length > 0) {
            actions.push({
                label: 'View Accepted',
                link: '/appointments?filter=accepted'
            });
        }
        
        actions.push({
            label: 'Book New',
            link: '/appointments/new'
        });
        
        return actions;
    }

    /**
     * Format date helper
     */
    static formatDate(dateString) {
        const date = new Date(dateString);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        if (date.toDateString() === today.toDateString()) {
            return `Today at ${date.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
            })}`;
        }

        if (date.toDateString() === tomorrow.toDateString()) {
            return `Tomorrow at ${date.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
            })}`;
        }

        return date.toLocaleString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    /**
     * Find staff by name
     */
    static async findStaffByName(name) {
        try {
            const users = await User.findByRole('lecturer');
            const match = users.data.find(u => 
                u.name.toLowerCase().includes(name.toLowerCase())
            );
            return match?.id;
        } catch (error) {
            logger.error('Error finding staff by name:', error);
            return null;
        }
    }

    // Additional action handlers...

    static async getLecturerAppointments(user) {
        try {
            const result = await Appointment.listByAppointee(user.id);
            const appointments = result.data || [];
            const pending = appointments.filter(a => a.status === 'pending');

            return {
                response: `You have ${appointments.length} appointment(s), including ${pending.length} pending request(s).`,
                data: { appointments, pending },
                quickActions: [
                    {
                        label: 'Review Pending',
                        link: '/lecturer/appointments?filter=pending'
                    },
                    {
                        label: 'My Schedule',
                        link: '/lecturer/schedule'
                    }
                ]
            };
        } catch (error) {
            return { response: 'Error fetching appointments', error: error.message };
        }
    }

    static async showHelpMenu(user) {
        const helpContent = {
            student: {
                response: `Here's what I can help you with:\n\n` +
                    `📅 **Appointments**\n` +
                    `• Book appointments with lecturers\n` +
                    `• View your appointments\n` +
                    `• Check lecturer availability\n` +
                    `• Cancel or reschedule\n\n` +
                    `🎉 **Events**\n` +
                    `• View upcoming events\n` +
                    `• Register for events\n\n` +
                    `💬 **Messages**\n` +
                    `• Send messages to lecturers\n` +
                    `• Check your inbox\n\n` +
                    `Just type what you need or click a suggestion below!`,
                quickActions: [
                    { label: 'Book Appointment', link: '/appointments/new' },
                    { label: 'View Events', link: '/events' },
                    { label: 'My Messages', link: '/messages' }
                ]
            },
            lecturer: {
                response: `Here's what I can help you with:\n\n` +
                    `📅 **Appointment Management**\n` +
                    `• View appointment requests\n` +
                    `• Manage your availability\n` +
                    `• Review your schedule\n\n` +
                    `🎉 **Event Management**\n` +
                    `• Create new events\n` +
                    `• Manage your events\n\n` +
                    `💬 **Communication**\n` +
                    `• Message students\n` +
                    `• Send announcements\n\n` +
                    `What would you like to do?`,
                quickActions: [
                    { label: 'View Requests', link: '/lecturer/appointments' },
                    { label: 'Set Availability', link: '/lecturer/availability' },
                    { label: 'Create Event', link: '/lecturer/events/new' }
                ]
            },
            administrator: {
                response: `Administrator functions available:\n\n` +
                    `📊 **System Management**\n` +
                    `• Dashboard overview\n` +
                    `• User management\n` +
                    `• System reports\n\n` +
                    `📅 **Appointment Oversight**\n` +
                    `• View all appointments\n` +
                    `• Manage availability\n\n` +
                    `🎉 **Event Administration**\n` +
                    `• Create system events\n` +
                    `• Manage all events\n\n` +
                    `Select an action:`,
                quickActions: [
                    { label: 'Dashboard', link: '/administrator/dashboard' },
                    { label: 'User Management', link: '/administrator/users' },
                    { label: 'System Reports', link: '/administrator/reports' }
                ]
            }
        };

        return helpContent[user.role] || helpContent.student;
    }
}

module.exports = EnhancedChatbotController;