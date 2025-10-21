const EnhancedChatbotTrainingService = require('./chatbotTrainingService');
const ChatbotService = require('./chatbotService');
const Appointment = require('../models/Appointment');
const StaffAvailability = require('../models/StaffAvailability');
const Event = require('../models/Event');
const User = require('../models/User');
const { logger } = require('../utils/logger');

/**
 * Enhanced Chatbot Service - Combines NLP training with conversational AI
 * Integrates both the training service and conversational service
 */
class EnhancedChatbotService {
    /**
     * Process user query with enhanced intelligence
     * Combines intent classification with conversational responses
     */
    static async processQuery(userId, message, userName, userRole) {
        try {
            logger.info(`Enhanced chatbot processing - User: ${userId}, Role: ${userRole}, Message: ${message}`);
            
            // First, try the trained model for intent classification
            const classification = await EnhancedChatbotTrainingService.processQueryWithRole(
                message,
                userRole
            );
            
            // If we have a strong classification with an action, use it
            if (classification.success && classification.confidence > 0.3) {
                logger.info(`Using trained model - Intent: ${classification.intent}, Confidence: ${classification.confidence}`);
                
                // Execute the action and get data
                const actionResult = await this.executeAction(
                    classification.action,
                    userId,
                    userRole,
                    message
                );
                
                return {
                    success: true,
                    message: classification.message || actionResult.response,
                    data: actionResult.data,
                    intent: classification.intent,
                    confidence: classification.confidence,
                    navigationLink: classification.link,
                    suggestions: classification.suggestions,
                    quickActions: actionResult.quickActions,
                    interactive: actionResult.interactive
                };
            }
            
            // Fallback to conversational chatbot service
            logger.info('Using conversational fallback');
            const conversationalResult = await ChatbotService.processQuery(
                userId,
                message,
                userName,
                userRole
            );
            
            return conversationalResult;
        } catch (error) {
            logger.error('Enhanced chatbot processing error:', error);
            return {
                success: false,
                message: 'I encountered an error processing your request. Please try again.',
                error: error.message,
                suggestions: ['Help', 'Show my appointments', 'What can you do?']
            };
        }
    }
    
    /**
     * Execute action based on intent
     */
    static async executeAction(action, userId, userRole, message) {
        try {
            const actionHandlers = {
                // Appointment Actions
                show_available_staff: () => this.getAvailableStaff(userId, userRole),
                fetch_staff_availability: () => this.fetchStaffAvailability(userId, userRole, message),
                fetch_student_appointments: () => this.getStudentAppointments(userId),
                fetch_lecturer_appointments: () => this.getLecturerAppointments(userId),
                fetch_admin_appointments: () => this.getAdminAppointments(userId),
                check_appointment_status: () => this.checkAppointmentStatus(userId, userRole),
                show_cancellable_appointments: () => this.getCancellableAppointments(userId, userRole),
                show_reschedulable_appointments: () => this.getReschedulableAppointments(userId, userRole),
                fetch_today_availability: () => this.getTodayAvailability(userId, userRole),
                show_today_schedule: () => this.getTodaySchedule(userId, userRole),
                show_appointment_requests: () => this.getAppointmentRequests(userId),
                show_pending_requests: () => this.getPendingRequests(userId),
                
                // Availability Actions
                show_my_availability: () => this.getMyAvailability(userId),
                manage_availability: () => this.manageAvailability(userId),
                show_all_staff_availability: () => this.getAllStaffAvailability(userId),
                
                // Event Actions
                fetch_upcoming_events: () => this.getUpcomingEvents(userId, userRole),
                fetch_lecturer_events: () => this.getLecturerEvents(userId),
                fetch_all_events: () => this.getAllEvents(userId),
                show_events: () => this.getUpcomingEvents(userId, userRole),
                
                // Help Actions
                show_help_menu: () => this.showHelpMenu(userRole),
                show_lecturer_help: () => this.showHelpMenu(userRole),
                show_admin_help: () => this.showHelpMenu(userRole)
            };
            
            const handler = actionHandlers[action];
            if (handler) {
                return await handler();
            }
            
            return {
                response: 'I understand what you need. Please use the navigation link to proceed.',
                data: null,
                interactive: false
            };
        } catch (error) {
            logger.error(`Action execution error for ${action}:`, error);
            return {
                response: 'Sorry, I encountered an error executing that action.',
                data: null,
                error: error.message
            };
        }
    }
    
    /**
     * Get available staff for booking
     */
    static async getAvailableStaff(userId, userRole) {
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
                    id: item.staff?.id,
                    name: item.staff?.name || 'Staff Member',
                    department: item.staff?.department,
                    availableDays: availableDays.map(d => dayNames[d]).join(', '),
                    totalSlots: item.slots.length
                };
            });
            
            return {
                response: `Found ${staffList.length} available lecturer(s) with ${slots.length} time slots.`,
                data: {
                    staffList,
                    totalSlots: slots.length
                },
                interactive: true,
                quickActions: staffList.slice(0, 3).map(staff => ({
                    label: `Book with ${staff.name}`,
                    link: `/appointments/new?staff_id=${staff.id}`
                }))
            };
        } catch (error) {
            logger.error('Error fetching available staff:', error);
            return {
                response: 'Sorry, I couldn\'t fetch available staff right now.',
                data: null,
                error: error.message
            };
        }
    }
    
    /**
     * Get student's appointments
     */
    static async getStudentAppointments(userId) {
        try {
            const result = await Appointment.listByRequester(userId);
            const appointments = result.data || [];
            
            if (appointments.length === 0) {
                return {
                    response: 'You don\'t have any appointments yet. Would you like to book one?',
                    data: { appointments: [] },
                    quickActions: [
                        {
                            label: 'Book Appointment',
                            link: '/appointments/new'
                        },
                        {
                            label: 'View Available Staff',
                            link: '/appointments/availability'
                        }
                    ]
                };
            }
            
            const grouped = this.groupAppointmentsByStatus(appointments);
            
            let responseText = `You have ${appointments.length} appointment(s):\n\n`;
            
            if (grouped.pending.length > 0) {
                responseText += `📋 Pending: ${grouped.pending.length}\n`;
            }
            if (grouped.accepted.length > 0) {
                responseText += `✅ Accepted: ${grouped.accepted.length}\n`;
            }
            if (grouped.cancelled.length > 0 || grouped.declined.length > 0) {
                responseText += `❌ Cancelled/Declined: ${grouped.cancelled.length + grouped.declined.length}\n`;
            }
            
            return {
                response: responseText,
                data: {
                    total: appointments.length,
                    grouped,
                    appointments: appointments.slice(0, 5)
                },
                interactive: true,
                quickActions: [
                    { label: 'View All', link: '/appointments' },
                    { label: 'Book New', link: '/appointments/new' }
                ]
            };
        } catch (error) {
            logger.error('Error fetching student appointments:', error);
            return {
                response: 'Sorry, I couldn\'t fetch your appointments.',
                data: null,
                error: error.message
            };
        }
    }
    
    /**
     * Get lecturer's appointments
     */
    static async getLecturerAppointments(userId) {
        try {
            const result = await Appointment.listByAppointee(userId);
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
            logger.error('Error fetching lecturer appointments:', error);
            return {
                response: 'Sorry, I couldn\'t fetch your appointments.',
                data: null,
                error: error.message
            };
        }
    }
    
    /**
     * Get upcoming events
     */
    static async getUpcomingEvents(userId, userRole) {
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
                description: event.description?.substring(0, 100)
            }));
            
            let responseText = `Found ${upcoming.length} upcoming event(s):\n\n`;
            eventList.forEach((event, index) => {
                responseText += `${index + 1}. ${event.title}\n`;
                responseText += `   📅 ${event.date}\n`;
                responseText += `   📍 ${event.location}\n\n`;
            });
            
            return {
                response: responseText,
                data: {
                    total: upcoming.length,
                    events: eventList
                },
                interactive: true,
                quickActions: [
                    { label: 'View All Events', link: '/events' }
                ]
            };
        } catch (error) {
            logger.error('Error fetching events:', error);
            return {
                response: 'Sorry, I couldn\'t fetch upcoming events.',
                data: null,
                error: error.message
            };
        }
    }
    
    /**
     * Get today's availability for urgent bookings
     */
    static async getTodayAvailability(userId, userRole) {
        try {
            const result = await StaffAvailability.getAllActiveLecturerAvailability();
            const today = new Date().getDay();
            const currentTime = new Date();
            
            const todaySlots = (result.data || []).filter(slot => {
                if (slot.day_of_week !== today) return false;
                
                // Check if slot is still available
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
                        { label: 'View All Availability', link: '/appointments/availability' }
                    ]
                };
            }
            
            return {
                response: `Found ${todaySlots.length} urgent slot(s) available today.`,
                data: { slots: todaySlots, urgent: true },
                quickActions: [
                    { label: 'Book Urgent Slot', link: '/appointments/urgent' }
                ]
            };
        } catch (error) {
            logger.error('Error fetching today\'s availability:', error);
            return {
                response: 'Sorry, I couldn\'t check today\'s availability.',
                data: null,
                error: error.message
            };
        }
    }
    
    /**
     * Show help menu based on role
     */
    static async showHelpMenu(userRole) {
        const helpContent = {
            student: {
                response: `Here's what I can help you with:\n\n` +
                    `📅 **Appointments**\n` +
                    `• Book appointments with lecturers\n` +
                    `• View your appointments\n` +
                    `• Check lecturer availability\n\n` +
                    `🎉 **Events**\n` +
                    `• View upcoming events\n` +
                    `• Register for events\n\n` +
                    `Just type what you need!`,
                quickActions: [
                    { label: 'Book Appointment', link: '/appointments/new' },
                    { label: 'View Events', link: '/events' }
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
                    `What would you like to do?`,
                quickActions: [
                    { label: 'View Requests', link: '/lecturer/appointments' },
                    { label: 'Set Availability', link: '/lecturer/availability' }
                ]
            },
            administrator: {
                response: `Administrator functions available:\n\n` +
                    `📊 **System Management**\n` +
                    `• Dashboard overview\n` +
                    `• User management\n` +
                    `• System reports\n\n` +
                    `📅 **Appointment Oversight**\n` +
                    `• View all appointments\n\n` +
                    `Select an action:`,
                quickActions: [
                    { label: 'Dashboard', link: '/administrator/dashboard' },
                    { label: 'User Management', link: '/administrator/users' }
                ]
            }
        };
        
        return helpContent[userRole] || helpContent.student;
    }
    
    // Helper methods
    
    static groupAppointmentsByStatus(appointments) {
        return {
            pending: appointments.filter(a => a.status === 'pending'),
            accepted: appointments.filter(a => a.status === 'accepted'),
            declined: appointments.filter(a => a.status === 'declined'),
            cancelled: appointments.filter(a => a.status === 'cancelled'),
            completed: appointments.filter(a => a.status === 'completed')
        };
    }
    
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
    
    // Stub methods for actions not yet implemented
    static async fetchStaffAvailability(userId, userRole, message) {
        return this.getAvailableStaff(userId, userRole);
    }
    
    static async getAdminAppointments(userId) {
        return { response: 'Admin appointment view coming soon', data: null };
    }
    
    static async checkAppointmentStatus(userId, userRole) {
        if (userRole === 'student') {
            return this.getStudentAppointments(userId);
        }
        return this.getLecturerAppointments(userId);
    }
    
    static async getCancellableAppointments(userId, userRole) {
        return { response: 'View your appointments to cancel', data: null };
    }
    
    static async getReschedulableAppointments(userId, userRole) {
        return { response: 'View your appointments to reschedule', data: null };
    }
    
    static async getTodaySchedule(userId, userRole) {
        return this.getTodayAvailability(userId, userRole);
    }
    
    static async getAppointmentRequests(userId) {
        return this.getLecturerAppointments(userId);
    }
    
    static async getPendingRequests(userId) {
        return this.getLecturerAppointments(userId);
    }
    
    static async getMyAvailability(userId) {
        return { response: 'View your availability settings', data: null };
    }
    
    static async manageAvailability(userId) {
        return { response: 'Manage your availability', data: null };
    }
    
    static async getAllStaffAvailability(userId) {
        return this.getAvailableStaff(userId, 'administrator');
    }
    
    static async getLecturerEvents(userId) {
        return this.getUpcomingEvents(userId, 'lecturer');
    }
    
    static async getAllEvents(userId) {
        return this.getUpcomingEvents(userId, 'administrator');
    }
}

module.exports = EnhancedChatbotService;
