const { logger } = require('../utils/logger');
const Appointment = require('../models/Appointment');
const StaffAvailability = require('../models/StaffAvailability');
const Event = require('../models/Event');
const User = require('../models/User');
const Survey = require('../models/Survey');

/**
 * Intelligent Chatbot Service - Advanced conversational AI with system knowledge
 * Provides contextual responses, page navigation, and comprehensive system understanding
 */
class IntelligentChatbotService {
    constructor() {
        this.systemKnowledge = this.initializeSystemKnowledge();
        this.conversationContext = new Map(); // Store conversation context per user
    }

    /**
     * Initialize comprehensive system knowledge base
     */
    initializeSystemKnowledge() {
        return {
            // Page navigation and features
            pages: {
                appointments: {
                    student: {
                        path: '/appointments',
                        features: ['Book appointments', 'View upcoming appointments', 'Check lecturer availability', 'Cancel appointments', 'Reschedule appointments'],
                        description: 'Book and manage appointments with lecturers'
                    },
                    lecturer: {
                        path: '/lecturer/appointments',
                        features: ['View appointment requests', 'Approve/decline requests', 'Set availability', 'Manage schedule', 'View appointment history'],
                        description: 'Manage student appointment requests and your availability'
                    },
                    administrator: {
                        path: '/administrator/appointments',
                        features: ['View all appointments', 'System-wide appointment management', 'Generate reports', 'Manage lecturer availability'],
                        description: 'Oversee all appointments in the system'
                    }
                },
                events: {
                    student: {
                        path: '/events',
                        features: ['View upcoming events', 'RSVP to events', 'Event details', 'Event calendar'],
                        description: 'Discover and participate in campus events'
                    },
                    lecturer: {
                        path: '/lecturer/events',
                        features: ['Create events', 'Manage your events', 'View RSVPs', 'Edit event details'],
                        description: 'Create and manage campus events'
                    },
                    administrator: {
                        path: '/administrator/events',
                        features: ['Create events', 'Manage all events', 'Event analytics', 'System-wide event oversight'],
                        description: 'Comprehensive event management system'
                    }
                },
                messages: {
                    all: {
                        path: '/messages',
                        features: ['Send messages', 'Chat with lecturers/students', 'File sharing', 'Message history'],
                        description: 'Communicate with other users in the system'
                    }
                },
                surveys: {
                    student: {
                        path: '/surveys',
                        features: ['Take surveys', 'View survey results', 'Survey history'],
                        description: 'Participate in surveys and polls'
                    },
                    lecturer: {
                        path: '/lecturer/surveys',
                        features: ['Create surveys', 'View responses', 'Survey analytics', 'Manage surveys'],
                        description: 'Create and manage surveys for students'
                    },
                    administrator: {
                        path: '/administrator/surveys',
                        features: ['System-wide survey management', 'Survey analytics', 'User response tracking'],
                        description: 'Comprehensive survey system management'
                    }
                },
                profile: {
                    all: {
                        path: '/profile',
                        features: ['Edit personal information', 'Change password', 'Profile picture', 'Account settings'],
                        description: 'Manage your personal profile and account settings'
                    }
                },
                notifications: {
                    all: {
                        path: '/notifications',
                        features: ['View notifications', 'Mark as read', 'Notification settings', 'Alert preferences'],
                        description: 'Stay updated with system notifications and alerts'
                    }
                },
                dashboard: {
                    student: {
                        path: '/dashboard',
                        features: ['Overview of activities', 'Quick actions', 'Recent appointments', 'Upcoming events'],
                        description: 'Your personal dashboard with quick access to everything'
                    },
                    lecturer: {
                        path: '/lecturer/dashboard',
                        features: ['Appointment overview', 'Student requests', 'Event management', 'Quick statistics'],
                        description: 'Lecturer dashboard for managing your activities'
                    },
                    administrator: {
                        path: '/administrator/dashboard',
                        features: ['System overview', 'User management', 'System statistics', 'Administrative tools'],
                        description: 'Administrative dashboard for system management'
                    }
                },
                feed: {
                    all: {
                        path: '/feed',
                        features: ['Community posts', 'Like and comment', 'Share updates', 'Social interaction'],
                        description: 'Connect with the campus community through social posts'
                    }
                }
            },

            // Common user intents and responses
            intents: {
                navigation: {
                    patterns: [/go to|open|navigate to|take me to|show me|visit/i],
                    handler: 'handleNavigation'
                },
                appointments: {
                    patterns: [/appointment|book|schedule|meeting|consultation/i],
                    handler: 'handleAppointments'
                },
                availability: {
                    patterns: [/available|availability|free time|when.*free|schedule/i],
                    handler: 'handleAvailability'
                },
                events: {
                    patterns: [/event|workshop|seminar|conference|activity/i],
                    handler: 'handleEvents'
                },
                help: {
                    patterns: [/help|what can you do|how to|guide|tutorial/i],
                    handler: 'handleHelp'
                },
                system_info: {
                    patterns: [/what is|tell me about|explain|how does.*work/i],
                    handler: 'handleSystemInfo'
                },
                greeting: {
                    patterns: [/hello|hi|hey|good morning|good afternoon|good evening/i],
                    handler: 'handleGreeting'
                }
            },

            // Conversational responses
            responses: {
                greetings: [
                    "Hello! I'm your RP Community Assistant. I know everything about this system and I'm here to help you navigate and use all the features!",
                    "Hi there! I'm excited to help you with anything you need in the RP Community system. What would you like to do today?",
                    "Hey! Welcome to RP Community! I'm your personal assistant who knows all about appointments, events, surveys, and more. How can I help?",
                    "Good to see you! I'm here to make your experience with RP Community smooth and easy. What are you looking for?"
                ],
                
                help_responses: {
                    student: "As a student, I can help you with:\n• 📅 Booking appointments with lecturers\n• 🎉 Finding and joining events\n• 📝 Taking surveys and polls\n• 💬 Messaging lecturers and peers\n• 🔔 Managing notifications\n• 👤 Updating your profile\n\nJust tell me what you want to do!",
                    lecturer: "As a lecturer, I can assist you with:\n• 📅 Managing appointment requests from students\n• ⏰ Setting your availability schedule\n• 🎉 Creating and managing events\n• 📝 Creating surveys for students\n• 💬 Communicating with students\n• 📊 Viewing your dashboard and statistics\n\nWhat would you like to work on?",
                    administrator: "As an administrator, I can help you with:\n• 🏛️ System-wide management and oversight\n• 📅 Managing all appointments and availability\n• 🎉 Overseeing events and activities\n• 📝 Survey system management\n• 👥 User management and analytics\n• 📊 System reports and statistics\n\nWhat administrative task can I help with?"
                }
            }
        };
    }

    /**
     * Main query processing method
     */
    async processQuery(userId, message, userName, userRole) {
        try {
            logger.info(`Intelligent chatbot processing - User: ${userId}, Role: ${userRole}, Message: ${message}`);

            // Get or create conversation context
            const context = this.getConversationContext(userId);
            context.lastMessage = message;
            context.messageCount = (context.messageCount || 0) + 1;

            // Detect intent from message
            const intent = this.detectIntent(message);
            logger.info(`Detected intent: ${intent.type} with confidence: ${intent.confidence}`);

            // Handle the intent
            const response = await this.handleIntent(intent, message, userId, userRole, context);

            // Update conversation context
            context.lastIntent = intent.type;
            context.lastResponse = response.message;

            return {
                success: true,
                message: response.message,
                data: response.data,
                intent: intent.type,
                confidence: intent.confidence,
                navigationLink: response.navigationLink,
                suggestions: response.suggestions,
                quickActions: response.quickActions,
                interactive: response.interactive || false,
                conversational: true
            };

        } catch (error) {
            logger.error('Intelligent chatbot processing error:', error);
            return {
                success: false,
                message: "I'm having trouble understanding that right now. Could you try rephrasing your question? I'm here to help with appointments, events, surveys, and navigation!",
                suggestions: ['Help', 'Show my appointments', 'Upcoming events', 'What can you do?'],
                error: error.message
            };
        }
    }

    /**
     * Detect user intent from message
     */
    detectIntent(message) {
        const lowerMessage = message.toLowerCase();
        
        // Check each intent pattern
        for (const [intentType, intentData] of Object.entries(this.systemKnowledge.intents)) {
            for (const pattern of intentData.patterns) {
                if (pattern.test(lowerMessage)) {
                    // Calculate confidence based on keyword matches
                    const confidence = this.calculateConfidence(lowerMessage, intentType);
                    return { type: intentType, confidence, handler: intentData.handler };
                }
            }
        }

        // Default to general help if no specific intent detected
        return { type: 'general', confidence: 0.3, handler: 'handleGeneral' };
    }

    /**
     * Calculate confidence score for intent detection
     */
    calculateConfidence(message, intentType) {
        const keywords = {
            navigation: ['go', 'open', 'navigate', 'take', 'show', 'visit', 'page'],
            appointments: ['appointment', 'book', 'schedule', 'meeting', 'consultation', 'lecturer'],
            availability: ['available', 'availability', 'free', 'time', 'when', 'schedule'],
            events: ['event', 'workshop', 'seminar', 'conference', 'activity', 'rsvp'],
            help: ['help', 'how', 'what', 'guide', 'tutorial', 'explain'],
            system_info: ['what', 'tell', 'about', 'explain', 'how', 'work'],
            greeting: ['hello', 'hi', 'hey', 'good', 'morning', 'afternoon', 'evening']
        };

        const intentKeywords = keywords[intentType] || [];
        const matches = intentKeywords.filter(keyword => message.includes(keyword)).length;
        
        return Math.min(0.9, 0.3 + (matches * 0.15));
    }

    /**
     * Handle detected intent
     */
    async handleIntent(intent, message, userId, userRole, context) {
        const handlerMethod = intent.handler;
        
        if (this[handlerMethod]) {
            return await this[handlerMethod](message, userId, userRole, context);
        }
        
        return await this.handleGeneral(message, userId, userRole, context);
    }

    /**
     * Handle navigation requests
     */
    async handleNavigation(message, userId, userRole, context) {
        const lowerMessage = message.toLowerCase();
        
        // Extract page name from message
        const pageKeywords = {
            'appointments': ['appointment', 'book', 'schedule', 'meeting'],
            'events': ['event', 'workshop', 'seminar', 'activity'],
            'messages': ['message', 'chat', 'inbox', 'communication'],
            'surveys': ['survey', 'poll', 'questionnaire', 'feedback'],
            'profile': ['profile', 'account', 'settings', 'personal'],
            'notifications': ['notification', 'alert', 'updates'],
            'dashboard': ['dashboard', 'home', 'main', 'overview'],
            'feed': ['feed', 'community', 'posts', 'social']
        };

        let targetPage = null;
        for (const [page, keywords] of Object.entries(pageKeywords)) {
            if (keywords.some(keyword => lowerMessage.includes(keyword))) {
                targetPage = page;
                break;
            }
        }

        if (targetPage && this.systemKnowledge.pages[targetPage]) {
            const pageInfo = this.systemKnowledge.pages[targetPage][userRole] || 
                           this.systemKnowledge.pages[targetPage]['all'];
            
            if (pageInfo) {
                return {
                    message: `Taking you to ${targetPage}! ${pageInfo.description}\n\nHere's what you can do there:\n${pageInfo.features.map(f => `• ${f}`).join('\n')}`,
                    navigationLink: pageInfo.path,
                    quickActions: [
                        { label: `Go to ${targetPage.charAt(0).toUpperCase() + targetPage.slice(1)}`, link: pageInfo.path }
                    ],
                    suggestions: this.getContextualSuggestions(targetPage, userRole),
                    interactive: true
                };
            }
        }

        return {
            message: "I can help you navigate to any page in the system! Try saying things like:\n• 'Go to appointments'\n• 'Open events page'\n• 'Show me messages'\n• 'Take me to my profile'\n\nWhat page would you like to visit?",
            suggestions: ['Appointments', 'Events', 'Messages', 'Profile', 'Dashboard'],
            interactive: true
        };
    }

    /**
     * Handle appointment-related queries
     */
    async handleAppointments(message, userId, userRole, context) {
        try {
            if (userRole === 'student') {
                // Check if they want to book or view appointments
                if (message.toLowerCase().includes('book') || message.toLowerCase().includes('schedule')) {
                    // Get available lecturers
                    const availabilityResult = await StaffAvailability.getAllActiveLecturerAvailability();
                    const slots = availabilityResult.data || [];
                    
                    const uniqueLecturers = [...new Map(
                        slots.map(slot => [slot.staff_id, slot.staff])
                    ).values()].filter(staff => staff);

                    return {
                        message: `I'll help you book an appointment! I found ${uniqueLecturers.length} lecturers with available slots.\n\nYou can book appointments for:\n${uniqueLecturers.slice(0, 5).map(lecturer => `• ${lecturer.name} (${lecturer.department || 'Department'})`).join('\n')}`,
                        data: { lecturers: uniqueLecturers.slice(0, 5), totalSlots: slots.length },
                        navigationLink: '/appointments',
                        quickActions: [
                            { label: 'Book Appointment Now', link: '/appointments' }
                        ],
                        suggestions: ['Check lecturer availability', 'My appointments', 'Help with booking'],
                        interactive: true
                    };
                } else {
                    // Show their appointments
                    const appointmentsResult = await Appointment.listByRequester(userId);
                    const appointments = appointmentsResult.data || [];
                    
                    const upcoming = appointments.filter(apt => 
                        new Date(apt.appointment_date) > new Date()
                    );

                    return {
                        message: `You have ${appointments.length} total appointments, with ${upcoming.length} upcoming.\n\n${this.formatAppointmentsSummary(appointments)}`,
                        data: { appointments: upcoming.slice(0, 5), total: appointments.length },
                        navigationLink: '/appointments',
                        quickActions: [
                            { label: 'View All Appointments', link: '/appointments' },
                            { label: 'Book New Appointment', link: '/appointments' }
                        ],
                        suggestions: ['Book another appointment', 'Check availability', 'Cancel appointment'],
                        interactive: true
                    };
                }
            } else if (userRole === 'lecturer') {
                const appointmentsResult = await Appointment.listByAppointee(userId);
                const appointments = appointmentsResult.data || [];
                const pending = appointments.filter(apt => apt.status === 'pending');

                return {
                    message: `You have ${appointments.length} appointments with ${pending.length} pending requests.\n\nAs a lecturer, you can:\n• Review and approve/decline requests\n• Set your availability schedule\n• Manage your appointment calendar\n• View appointment history`,
                    data: { appointments: appointments.slice(0, 5), pending },
                    navigationLink: '/lecturer/appointments',
                    quickActions: [
                        { label: 'Manage Appointments', link: '/lecturer/appointments' },
                        { label: 'Set Availability', link: '/lecturer/availability' }
                    ],
                    suggestions: ['Review pending requests', 'Set availability', 'View calendar'],
                    interactive: true
                };
            } else {
                return {
                    message: "As an administrator, you have full oversight of the appointment system.\n\nYou can:\n• View all appointments system-wide\n• Manage lecturer availability\n• Generate appointment reports\n• Handle system-wide appointment issues",
                    navigationLink: '/administrator/appointments',
                    quickActions: [
                        { label: 'System Appointments', link: '/administrator/appointments' }
                    ],
                    suggestions: ['View all appointments', 'System reports', 'Manage availability'],
                    interactive: true
                };
            }
        } catch (error) {
            logger.error('Error handling appointments query:', error);
            return {
                message: "I'm having trouble accessing appointment data right now. Let me direct you to the appointments page where you can manage everything.",
                navigationLink: userRole === 'student' ? '/appointments' : 
                              userRole === 'lecturer' ? '/lecturer/appointments' : '/administrator/appointments',
                quickActions: [
                    { label: 'Go to Appointments', link: userRole === 'student' ? '/appointments' : 
                                                        userRole === 'lecturer' ? '/lecturer/appointments' : '/administrator/appointments' }
                ]
            };
        }
    }

    /**
     * Handle availability queries
     */
    async handleAvailability(message, userId, userRole, context) {
        try {
            if (userRole === 'student') {
                const availabilityResult = await StaffAvailability.getAllActiveLecturerAvailability();
                const slots = availabilityResult.data || [];
                
                // Group by day and time
                const today = new Date().getDay();
                const todaySlots = slots.filter(slot => slot.day_of_week === today);
                
                return {
                    message: `Here's the current availability:\n\n📅 **Today**: ${todaySlots.length} slots available\n📅 **This week**: ${slots.length} total slots\n\nYou can check specific lecturer availability and book appointments directly!`,
                    data: { slots: slots.slice(0, 10), todaySlots },
                    navigationLink: '/appointments',
                    quickActions: [
                        { label: 'View All Availability', link: '/appointments' },
                        { label: 'Book Appointment', link: '/appointments' }
                    ],
                    suggestions: ['Book with available lecturer', 'Check specific lecturer', 'My appointments'],
                    interactive: true
                };
            } else if (userRole === 'lecturer') {
                const myAvailability = await StaffAvailability.getByStaffId(userId);
                const slots = myAvailability.data || [];
                
                return {
                    message: `Your availability settings:\n\n📅 You have ${slots.length} time slots configured\n\nYou can:\n• Add new availability slots\n• Modify existing slots\n• Block specific times\n• Set recurring availability`,
                    data: { mySlots: slots },
                    navigationLink: '/lecturer/availability',
                    quickActions: [
                        { label: 'Manage My Availability', link: '/lecturer/availability' }
                    ],
                    suggestions: ['Add new slots', 'View appointment requests', 'Block time'],
                    interactive: true
                };
            }
        } catch (error) {
            logger.error('Error handling availability query:', error);
        }
        
        return {
            message: "I can help you check availability! Students can see when lecturers are free, and lecturers can manage their own availability schedule.",
            navigationLink: userRole === 'student' ? '/appointments' : '/lecturer/availability',
            suggestions: ['Check availability', 'Book appointment', 'Manage schedule']
        };
    }

    /**
     * Handle events queries
     */
    async handleEvents(message, userId, userRole, context) {
        try {
            const eventsResult = await Event.getAll();
            const events = eventsResult.data || [];
            const upcoming = events.filter(event => new Date(event.event_date) > new Date());
            
            if (userRole === 'student') {
                return {
                    message: `🎉 **Upcoming Events**: ${upcoming.length} events available\n\n${upcoming.slice(0, 3).map(event => 
                        `• **${event.title}**\n  📅 ${this.formatDate(event.event_date)}\n  📍 ${event.location || 'TBA'}`
                    ).join('\n\n')}\n\nYou can RSVP and get more details on the events page!`,
                    data: { events: upcoming.slice(0, 5) },
                    navigationLink: '/events',
                    quickActions: [
                        { label: 'View All Events', link: '/events' }
                    ],
                    suggestions: ['RSVP to event', 'Event details', 'My RSVPs'],
                    interactive: true
                };
            } else if (userRole === 'lecturer' || userRole === 'administrator') {
                return {
                    message: `🎉 **Event Management**: ${events.length} total events, ${upcoming.length} upcoming\n\nAs a ${userRole}, you can:\n• Create new events\n• Manage existing events\n• View RSVPs and attendance\n• Edit event details\n• Send event notifications`,
                    data: { events: upcoming.slice(0, 5) },
                    navigationLink: userRole === 'lecturer' ? '/lecturer/events' : '/administrator/events',
                    quickActions: [
                        { label: 'Manage Events', link: userRole === 'lecturer' ? '/lecturer/events' : '/administrator/events' },
                        { label: 'Create New Event', link: userRole === 'lecturer' ? '/lecturer/events/new' : '/administrator/events/new' }
                    ],
                    suggestions: ['Create event', 'View RSVPs', 'Edit event'],
                    interactive: true
                };
            }
        } catch (error) {
            logger.error('Error handling events query:', error);
        }
        
        return {
            message: "I can help you with events! Students can discover and join events, while lecturers and administrators can create and manage them.",
            navigationLink: '/events',
            suggestions: ['View events', 'Create event', 'RSVP to event']
        };
    }

    /**
     * Handle help requests
     */
    async handleHelp(message, userId, userRole, context) {
        const helpResponse = this.systemKnowledge.responses.help_responses[userRole] || 
                           this.systemKnowledge.responses.help_responses.student;
        
        const roleFeatures = {
            student: [
                { name: 'Appointments', desc: 'Book meetings with lecturers', link: '/appointments' },
                { name: 'Events', desc: 'Join campus activities', link: '/events' },
                { name: 'Surveys', desc: 'Participate in polls', link: '/surveys' },
                { name: 'Messages', desc: 'Chat with others', link: '/messages' }
            ],
            lecturer: [
                { name: 'Appointments', desc: 'Manage student requests', link: '/lecturer/appointments' },
                { name: 'Events', desc: 'Create campus events', link: '/lecturer/events' },
                { name: 'Surveys', desc: 'Create student surveys', link: '/lecturer/surveys' },
                { name: 'Availability', desc: 'Set your schedule', link: '/lecturer/availability' }
            ],
            administrator: [
                { name: 'Dashboard', desc: 'System overview', link: '/administrator/dashboard' },
                { name: 'Users', desc: 'Manage all users', link: '/administrator/users' },
                { name: 'Appointments', desc: 'System appointments', link: '/administrator/appointments' },
                { name: 'Events', desc: 'All events management', link: '/administrator/events' }
            ]
        };

        const features = roleFeatures[userRole] || roleFeatures.student;

        return {
            message: helpResponse,
            data: { features },
            quickActions: features.map(feature => ({
                label: feature.name,
                link: feature.link
            })),
            suggestions: [
                'Show me appointments',
                'What are events?',
                'How do I use messages?',
                'Explain the system'
            ],
            interactive: true
        };
    }

    /**
     * Handle system information requests
     */
    async handleSystemInfo(message, userId, userRole, context) {
        const lowerMessage = message.toLowerCase();
        
        if (lowerMessage.includes('appointment')) {
            return {
                message: "📅 **Appointment System Explained:**\n\n**For Students:**\n• Browse available lecturers and their time slots\n• Book appointments for consultations\n• View your appointment history\n• Cancel or reschedule if needed\n\n**For Lecturers:**\n• Set your availability schedule\n• Review and approve student requests\n• Manage your appointment calendar\n• Block times when unavailable",
                suggestions: ['Book appointment', 'Set availability', 'View appointments'],
                interactive: true
            };
        } else if (lowerMessage.includes('event')) {
            return {
                message: "🎉 **Events System Explained:**\n\n**Features:**\n• Campus-wide event discovery\n• RSVP and attendance tracking\n• Event creation and management\n• Notifications and reminders\n\n**Who can create events:**\n• Lecturers can create academic events\n• Administrators can create any events\n• Students can view and join events",
                suggestions: ['View events', 'Create event', 'RSVP to event'],
                interactive: true
            };
        } else if (lowerMessage.includes('survey')) {
            return {
                message: "📝 **Survey System Explained:**\n\n**Features:**\n• Create custom surveys and polls\n• Target specific audiences\n• Real-time response tracking\n• Analytics and reporting\n\n**Survey Types:**\n• Academic feedback surveys\n• Event feedback\n• General polls\n• Research questionnaires",
                suggestions: ['Take survey', 'Create survey', 'View results'],
                interactive: true
            };
        }

        return {
            message: "🏛️ **RP Community System Overview:**\n\nThis is a comprehensive platform for:\n\n📅 **Appointments** - Book meetings with lecturers\n🎉 **Events** - Campus activities and workshops\n📝 **Surveys** - Feedback and polls\n💬 **Messages** - Communication system\n🔔 **Notifications** - Stay updated\n👤 **Profiles** - Manage your account\n📱 **Community Feed** - Social interaction\n\nI can help you navigate and use any of these features!",
            suggestions: ['Explain appointments', 'What are events?', 'How do surveys work?', 'Show me around'],
            interactive: true
        };
    }

    /**
     * Handle greeting messages
     */
    async handleGreeting(message, userId, userRole, context) {
        const greetings = this.systemKnowledge.responses.greetings;
        const greeting = greetings[Math.floor(Math.random() * greetings.length)];
        
        const timeOfDay = new Date().getHours();
        const timeGreeting = timeOfDay < 12 ? 'Good morning' : 
                           timeOfDay < 18 ? 'Good afternoon' : 'Good evening';
        
        return {
            message: `${timeGreeting}! ${greeting}`,
            suggestions: [
                userRole === 'student' ? 'Book appointment' : 'View appointments',
                'Upcoming events',
                'Check messages',
                'What can you do?'
            ],
            interactive: true
        };
    }

    /**
     * Handle general queries
     */
    async handleGeneral(message, userId, userRole, context) {
        return {
            message: "I'm your intelligent RP Community assistant! I can help you with:\n\n• 🧭 **Navigation** - 'Go to appointments', 'Open events'\n• 📅 **Appointments** - Booking, scheduling, availability\n• 🎉 **Events** - Campus activities and workshops\n• 📝 **Surveys** - Polls and feedback\n• 💬 **Messages** - Communication\n• ❓ **Help** - System guidance and tutorials\n\nJust tell me what you want to do in natural language!",
            suggestions: [
                'Show my appointments',
                'Upcoming events', 
                'Help me navigate',
                'What can you do?'
            ],
            interactive: true
        };
    }

    // Helper methods

    /**
     * Get conversation context for user
     */
    getConversationContext(userId) {
        if (!this.conversationContext.has(userId)) {
            this.conversationContext.set(userId, {
                startTime: new Date(),
                messageCount: 0,
                lastIntent: null,
                lastMessage: null,
                lastResponse: null
            });
        }
        return this.conversationContext.get(userId);
    }

    /**
     * Get contextual suggestions based on page and role
     */
    getContextualSuggestions(page, userRole) {
        const suggestions = {
            appointments: {
                student: ['Book appointment', 'Check availability', 'My appointments'],
                lecturer: ['Set availability', 'Review requests', 'View calendar'],
                administrator: ['System overview', 'Manage availability', 'View reports']
            },
            events: {
                student: ['RSVP to event', 'Event details', 'My RSVPs'],
                lecturer: ['Create event', 'Manage events', 'View RSVPs'],
                administrator: ['Create event', 'System events', 'Event analytics']
            },
            messages: ['Send message', 'Check inbox', 'Message history'],
            surveys: {
                student: ['Take survey', 'View results', 'Survey history'],
                lecturer: ['Create survey', 'View responses', 'Survey analytics'],
                administrator: ['System surveys', 'User responses', 'Survey reports']
            }
        };

        return suggestions[page]?.[userRole] || suggestions[page] || ['Help', 'Dashboard', 'Profile'];
    }

    /**
     * Format appointments summary
     */
    formatAppointmentsSummary(appointments) {
        if (appointments.length === 0) return "No appointments found.";
        
        const statusCounts = appointments.reduce((acc, apt) => {
            acc[apt.status] = (acc[apt.status] || 0) + 1;
            return acc;
        }, {});

        return Object.entries(statusCounts)
            .map(([status, count]) => `• ${status.charAt(0).toUpperCase() + status.slice(1)}: ${count}`)
            .join('\n');
    }

    /**
     * Format date for display
     */
    formatDate(dateString) {
        const date = new Date(dateString);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        if (date.toDateString() === today.toDateString()) {
            return `Today at ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
        }
        
        if (date.toDateString() === tomorrow.toDateString()) {
            return `Tomorrow at ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
        }

        return date.toLocaleString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

module.exports = new IntelligentChatbotService();