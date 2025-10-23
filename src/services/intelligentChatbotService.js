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
        this.cache = new Map(); // Simple cache for frequently accessed data
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes cache timeout
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
            // Removed verbose logging for performance

            // Get or create conversation context
            const context = this.getConversationContext(userId);
            context.lastMessage = message;
            context.messageCount = (context.messageCount || 0) + 1;

            // Detect intent from message
            const intent = this.detectIntent(message);
            // Intent detected

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
     * Enhanced intent detection with better pattern matching and context awareness
     */
    detectIntent(message) {
        const lowerMessage = message.toLowerCase();
        
        // Enhanced intent patterns with more sophisticated matching
        const enhancedIntents = {
            navigation: {
                patterns: [
                    /(?:go to|open|navigate to|take me to|show me|visit|access)\s+(\w+)/i,
                    /(?:i want to|i need to|can you)\s+(?:go to|open|see|visit)\s+(\w+)/i,
                    /(?:where is|how do i get to|direct me to)\s+(\w+)/i
                ],
                keywords: ['go', 'open', 'navigate', 'take', 'show', 'visit', 'access', 'page', 'section'],
                confidence: 0.9
            },
            appointments: {
                patterns: [
                    /(?:book|schedule|make|create|set up)\s+(?:an?\s+)?appointment/i,
                    /(?:i want to|i need to|can i)\s+(?:book|schedule|meet)/i,
                    /(?:appointment|meeting|consultation)\s+(?:with|for)/i,
                    /(?:my|show|view|check)\s+appointments?/i,
                    /(?:when|what time)\s+(?:is|are)\s+(?:my|the)\s+appointment/i
                ],
                keywords: ['appointment', 'book', 'schedule', 'meeting', 'consultation', 'lecturer', 'staff'],
                confidence: 0.9
            },
            availability: {
                patterns: [
                    /(?:when|what time)\s+(?:is|are)\s+(?:\w+\s+)?(?:available|free)/i,
                    /(?:availability|free time|schedule)\s+(?:of|for)\s+\w+/i,
                    /(?:check|see|view)\s+(?:availability|schedule)/i,
                    /(?:set|manage|update)\s+(?:my\s+)?availability/i
                ],
                keywords: ['available', 'availability', 'free', 'time', 'when', 'schedule'],
                confidence: 0.9
            },
            events: {
                patterns: [
                    /(?:create|make|organize|set up)\s+(?:an?\s+)?event/i,
                    /(?:upcoming|next|future)\s+events?/i,
                    /(?:rsvp|register|sign up)\s+(?:for|to)\s+(?:an?\s+)?event/i,
                    /(?:my|show|view|list)\s+events?/i
                ],
                keywords: ['event', 'workshop', 'seminar', 'conference', 'activity', 'rsvp'],
                confidence: 0.9
            },
            surveys: {
                patterns: [
                    /(?:take|answer|fill|complete)\s+(?:a\s+)?survey/i,
                    /(?:create|make|new)\s+(?:a\s+)?survey/i,
                    /(?:available|active|new)\s+surveys?/i,
                    /(?:survey|poll|questionnaire|feedback)/i,
                    /(?:my|show|view|list)\s+surveys?/i
                ],
                keywords: ['survey', 'surveys', 'poll', 'questionnaire', 'feedback', 'form'],
                confidence: 0.9
            },
            messages: {
                patterns: [
                    /(?:send|write|compose)\s+(?:a\s+)?message/i,
                    /(?:check|view|read|open)\s+messages?/i,
                    /(?:message|messages|inbox|chat)/i,
                    /(?:unread|new)\s+messages?/i
                ],
                keywords: ['message', 'messages', 'chat', 'inbox', 'send', 'conversation'],
                confidence: 0.9
            },
            notifications: {
                patterns: [
                    /(?:notification|alert|update)s?\s+(?:from|about|regarding)/i,
                    /(?:unread|new)\s+(?:notifications?|alerts?|messages?)/i,
                    /(?:check|view|see)\s+(?:my\s+)?notifications?/i,
                    /(?:mark|clear)\s+(?:as\s+)?(?:read|seen)/i
                ],
                keywords: ['notification', 'alert', 'update', 'unread', 'bell', 'new'],
                confidence: 0.8
            },
            help: {
                patterns: [
                    /(?:help|assist|guide|tutorial|how to)/i,
                    /(?:what can you|what do you|how do you)/i,
                    /(?:i don't know|i'm confused|i need help)/i,
                    /(?:explain|tell me about|show me how)/i
                ],
                keywords: ['help', 'how', 'what', 'guide', 'tutorial', 'explain', 'confused'],
                confidence: 0.8
            },
            greeting: {
                patterns: [
                    /^(?:hello|hi|hey|good morning|good afternoon|good evening)/i,
                    /^(?:greetings|salutations|howdy)/i
                ],
                keywords: ['hello', 'hi', 'hey', 'good', 'morning', 'afternoon', 'evening'],
                confidence: 0.9
            },
            system_info: {
                patterns: [
                    /(?:what is|tell me about|explain)\s+(?:this\s+)?(?:system|platform|app)/i,
                    /(?:how does|how do)\s+(?:\w+\s+)?(?:work|function)/i,
                    /(?:features|capabilities|functions)\s+(?:of|in)\s+(?:this\s+)?(?:system|app)/i
                ],
                keywords: ['what', 'tell', 'about', 'explain', 'how', 'work', 'system', 'platform'],
                confidence: 0.7
            }
        };

        let bestMatch = { type: 'general', confidence: 0.3, handler: 'handleGeneral' };

        // Check enhanced patterns
        for (const [intentType, intentData] of Object.entries(enhancedIntents)) {
            let confidence = 0;
            
            // Check regex patterns
            for (const pattern of intentData.patterns) {
                if (pattern.test(lowerMessage)) {
                    confidence = Math.max(confidence, intentData.confidence);
                    break;
                }
            }
            
            // Check keyword matches if no pattern matched
            if (confidence === 0) {
                const keywordMatches = intentData.keywords.filter(keyword => 
                    lowerMessage.includes(keyword)
                ).length;
                
                if (keywordMatches > 0) {
                    confidence = Math.min(0.8, 0.3 + (keywordMatches * 0.15));
                }
            }
            
            // Update best match if this is better
            if (confidence > bestMatch.confidence) {
                bestMatch = {
                    type: intentType,
                    confidence,
                    handler: this.systemKnowledge.intents[intentType]?.handler || `handle${intentType.charAt(0).toUpperCase() + intentType.slice(1)}`
                };
            }
        }

        // Special handling for notification-related queries
        if (lowerMessage.includes('notification') && lowerMessage.includes('click')) {
            bestMatch = { type: 'notification_click', confidence: 0.95, handler: 'handleNotificationNavigation' };
        }

        // Intent: ${bestMatch.type}
        return bestMatch;
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
     * Handle navigation requests with enhanced routing and notification support
     */
    async handleNavigation(message, userId, userRole, context) {
        const lowerMessage = message.toLowerCase();
        
        // Enhanced page keywords with more variations and specific routing
        const pageKeywords = {
            'appointments': {
                keywords: ['appointment', 'book', 'schedule', 'meeting', 'consultation', 'lecturer', 'staff'],
                routes: {
                    student: '/appointments',
                    lecturer: '/lecturer/appointments',
                    administrator: '/administrator/appointments'
                },
                specificRoutes: {
                    'new': '/appointments/new',
                    'book': '/appointments/new',
                    'create': '/appointments/new',
                    'pending': '/appointments?filter=pending',
                    'history': '/appointments?view=history',
                    'today': '/appointments?date=today'
                }
            },
            'events': {
                keywords: ['event', 'workshop', 'seminar', 'activity', 'conference', 'rsvp'],
                routes: {
                    student: '/events',
                    lecturer: '/lecturer/events',
                    administrator: '/administrator/events'
                },
                specificRoutes: {
                    'new': '/events/new',
                    'create': '/events/new',
                    'upcoming': '/events?filter=upcoming',
                    'my': '/events?view=my',
                    'rsvp': '/events?action=rsvp'
                }
            },
            'messages': {
                keywords: ['message', 'chat', 'inbox', 'communication', 'conversation'],
                routes: {
                    all: '/messages'
                },
                specificRoutes: {
                    'new': '/messages/new',
                    'unread': '/messages?filter=unread',
                    'sent': '/messages?view=sent'
                }
            },
            'surveys': {
                keywords: ['survey', 'poll', 'questionnaire', 'feedback', 'form'],
                routes: {
                    student: '/surveys',
                    lecturer: '/lecturer/surveys',
                    administrator: '/administrator/surveys'
                },
                specificRoutes: {
                    'new': '/surveys/new',
                    'create': '/surveys/new',
                    'active': '/surveys?filter=active',
                    'results': '/surveys?view=results'
                }
            },
            'profile': {
                keywords: ['profile', 'account', 'settings', 'personal', 'info'],
                routes: {
                    all: '/profile'
                },
                specificRoutes: {
                    'edit': '/profile/edit',
                    'settings': '/profile/settings',
                    'password': '/profile/password'
                }
            },
            'notifications': {
                keywords: ['notification', 'alert', 'updates', 'bell', 'unread'],
                routes: {
                    all: '/notifications'
                },
                specificRoutes: {
                    'unread': '/notifications?filter=unread',
                    'settings': '/notifications/settings'
                }
            },
            'dashboard': {
                keywords: ['dashboard', 'home', 'main', 'overview', 'summary'],
                routes: {
                    student: '/dashboard',
                    lecturer: '/lecturer/dashboard',
                    administrator: '/administrator/dashboard'
                }
            },
            'feed': {
                keywords: ['feed', 'community', 'posts', 'social', 'timeline'],
                routes: {
                    all: '/feed'
                },
                specificRoutes: {
                    'new': '/feed/new',
                    'my': '/feed?view=my'
                }
            }
        };

        // Find target page and specific action
        let targetPage = null;
        let specificAction = null;
        
        for (const [page, config] of Object.entries(pageKeywords)) {
            if (config.keywords.some(keyword => lowerMessage.includes(keyword))) {
                targetPage = page;
                
                // Check for specific actions
                for (const [action, route] of Object.entries(config.specificRoutes || {})) {
                    if (lowerMessage.includes(action)) {
                        specificAction = { action, route };
                        break;
                    }
                }
                break;
            }
        }

        if (targetPage) {
            const config = pageKeywords[targetPage];
            const pageInfo = this.systemKnowledge.pages[targetPage]?.[userRole] || 
                           this.systemKnowledge.pages[targetPage]?.['all'];
            
            if (pageInfo || config.routes) {
                let navigationLink;
                let actionDescription = '';
                
                if (specificAction) {
                    navigationLink = specificAction.route;
                    actionDescription = ` I'll take you directly to ${specificAction.action} ${targetPage}.`;
                } else {
                    navigationLink = config.routes[userRole] || config.routes.all || pageInfo?.path;
                }
                
                const message = `Taking you to ${targetPage}!${actionDescription} ${pageInfo?.description || ''}

Here's what you can do there:
${pageInfo?.features?.map(f => `• ${f}`).join('\n') || '• Navigate and explore the features'}`;
                
                return {
                    message,
                    navigationLink,
                    quickActions: [
                        { 
                            label: `Go to ${targetPage.charAt(0).toUpperCase() + targetPage.slice(1)}${specificAction ? ` (${specificAction.action})` : ''}`, 
                            link: navigationLink,
                            type: 'primary'
                        }
                    ],
                    suggestions: this.getContextualSuggestions(targetPage, userRole),
                    interactive: true
                };
            }
        }

        // Enhanced navigation help with more examples
        return {
            message: "I can help you navigate anywhere in the system! Here are some examples:\n\n🎯 **Basic Navigation:**\n• 'Go to appointments'\n• 'Open events page'\n• 'Show me messages'\n• 'Take me to my profile'\n\n🎯 **Specific Actions:**\n• 'Book new appointment'\n• 'Create event'\n• 'Check unread notifications'\n• 'View pending appointments'\n\nWhat would you like to do?",
            suggestions: ['Book appointment', 'View events', 'Check messages', 'My profile', 'Dashboard'],
            quickActions: [
                { label: 'Appointments', link: pageKeywords.appointments.routes[userRole] || '/appointments' },
                { label: 'Events', link: pageKeywords.events.routes[userRole] || '/events' },
                { label: 'Messages', link: '/messages' },
                { label: 'Profile', link: '/profile' }
            ],
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
                    // Get available lecturers with caching
                    const availabilityResult = await this.getCachedData('lecturer_availability', 
                        async () => await StaffAvailability.getAllActiveLecturerAvailability(), 
                        3 * 60 * 1000); // 3 minutes cache
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
                    message: `You have ${appointments.length} appointments with ${pending.length} pending requests.

As a lecturer, you can:
• Review and approve/decline requests
• Set your availability schedule
• Manage your appointment calendar
• View appointment history`,
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
            const lowerMessage = message.toLowerCase();
            
            if (userRole === 'student') {
                // Check if student is trying to set/manage availability (they can't)
                if (lowerMessage.includes('set') || lowerMessage.includes('manage') || lowerMessage.includes('my availability') || lowerMessage.includes('add availability')) {
                    return {
                        message: "⏰ **Availability Management**: As a student, you can view lecturer availability but cannot set your own availability.\n\nOnly lecturers can manage their availability schedules.\n\n**What you can do:**\n• View when lecturers are available\n• Check availability for specific lecturers\n• Book appointments during available slots\n• See real-time availability updates\n\nWould you like to check lecturer availability to book an appointment?",
                        navigationLink: '/appointments',
                        quickActions: [
                            { label: 'Check Lecturer Availability', link: '/appointments', type: 'primary' },
                            { label: 'Book Appointment', link: '/appointments', type: 'secondary' }
                        ],
                        suggestions: ['Check availability', 'Book appointment', 'My appointments', 'Help'],
                        interactive: true
                    };
                }
                
                // Use caching for availability data
                const availabilityResult = await this.getCachedData('lecturer_availability', 
                    async () => await StaffAvailability.getAllActiveLecturerAvailability(), 
                    3 * 60 * 1000); // 3 minutes cache
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
                    message: `Your availability settings:

📅 You have ${slots.length} time slots configured

You can:
• Add new availability slots
• Modify existing slots
• Block specific times
• Set recurring availability`,
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
     * Handle events queries with enhanced information
     */
    async handleEvents(message, userId, userRole, context) {
        try {
            const lowerMessage = message.toLowerCase();
            // Use caching for events data
            const eventsResult = await this.getCachedData('all_events', async () => await Event.getAll(), 2 * 60 * 1000); // 2 minutes cache
            const events = eventsResult.data || [];
            const upcoming = events.filter(event => new Date(event.event_date) > new Date());
            
            // Check if user is asking for specific event information
            const isAskingForDetails = lowerMessage.includes('what') && 
                                     (lowerMessage.includes('event') || lowerMessage.includes('detail') || lowerMessage.includes('information'));
            
            if (userRole === 'student') {
                // Check if student is trying to create an event (they can't)
                if (lowerMessage.includes('create') || lowerMessage.includes('make') || lowerMessage.includes('new event') || lowerMessage.includes('organize')) {
                    return {
                        message: "🎉 **Event Creation**: As a student, you can view and join events but cannot create them.\n\nOnly lecturers and administrators can create campus events.\n\n**What you can do:**\n• View " + upcoming.length + " upcoming events\n• RSVP to events you're interested in\n• Get event notifications and reminders\n• View your RSVP history\n• Check event details and locations\n\nWould you like to see the available events?",
                        data: { events: upcoming.slice(0, 5) },
                        navigationLink: '/events',
                        quickActions: [
                            { label: 'View Available Events', link: '/events', type: 'primary' }
                        ],
                        suggestions: ['View events', 'My RSVPs', 'Event notifications', 'Help'],
                        interactive: true
                    };
                }
                
                // Provide detailed event information if requested
                if (isAskingForDetails && upcoming.length > 0) {
                    const featuredEvent = upcoming[0]; // Get the first upcoming event as an example
                    return {
                        message: `Here's detailed information about upcoming events:\n\n📅 **Featured Event:**\n**${featuredEvent.title}**\n📝 Description: ${featuredEvent.description || 'No description provided'}\n📅 Date & Time: ${this.formatDate(featuredEvent.event_date)}\n📍 Location: ${featuredEvent.location || 'TBA'}\n👥 Target Audience: ${featuredEvent.target_audience || 'All'}\n\nWe have ${upcoming.length} upcoming events in total. Would you like to see them all?`,
                        data: { featuredEvent, totalEvents: upcoming.length },
                        navigationLink: '/events',
                        quickActions: [
                            { label: 'View All Events', link: '/events', type: 'primary' }
                        ],
                        suggestions: ['RSVP to event', 'Event details', 'My RSVPs'],
                        interactive: true
                    };
                }
                
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
                // Provide more detailed information for lecturers and administrators
                if (isAskingForDetails) {
                    return {
                        message: `📋 **Event Management Overview:**

📊 **Statistics:**
• Total events: ${events.length}
• Upcoming events: ${upcoming.length}
• Events this month: ${events.filter(e => new Date(e.event_date).getMonth() === new Date().getMonth()).length}

🎯 **Crucial Event Information I Track:**
• Event title and description
• Date and time
• Location or venue
• Target audience
• Registration requirements
• Contact information
• Agenda or schedule
• Materials needed
• Special instructions

As a ${userRole}, you can manage all aspects of these events.`,
                        data: { events: upcoming.slice(0, 5), stats: { total: events.length, upcoming: upcoming.length } },
                        navigationLink: userRole === 'lecturer' ? '/lecturer/events' : '/administrator/events',
                        quickActions: [
                            { label: 'Manage Events', link: userRole === 'lecturer' ? '/lecturer/events' : '/administrator/events' },
                            { label: 'Create New Event', link: userRole === 'lecturer' ? '/lecturer/events/new' : '/administrator/events/new' }
                        ],
                        suggestions: ['Create event', 'View RSVPs', 'Edit event', 'Event analytics'],
                        interactive: true
                    };
                }
                
                return {
                    message: `🎉 **Event Management**: ${events.length} total events, ${upcoming.length} upcoming

As a ${userRole}, you can:
• Create new events
• Manage existing events
• View RSVPs and attendance
• Edit event details
• Send event notifications`,
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
     * Handle survey-related queries
     */
    async handleSurveys(message, userId, userRole, context) {
        try {
            const lowerMessage = message.toLowerCase();
            
            if (userRole === 'student') {
                // Fetch available surveys for students
                const surveys = await Survey.listVisibleTemplatesForUser(userRole);
                const activeSurveys = surveys.filter(s => s.is_active);
                
                // Check if student wants to create (they can't)
                if (lowerMessage.includes('create') || lowerMessage.includes('make') || lowerMessage.includes('new survey')) {
                    return {
                        message: "📝 **Survey Creation**: As a student, you can participate in surveys but cannot create them.\n\nOnly lecturers and administrators can create surveys.\n\nYou currently have access to:\n• " + activeSurveys.length + " available surveys to participate in\n• View your survey response history\n• See survey results (if available)\n\nWould you like to take a survey instead?",
                        data: { surveys: activeSurveys.slice(0, 5) },
                        navigationLink: '/surveys',
                        quickActions: [
                            { label: 'View Available Surveys', link: '/surveys', type: 'primary' }
                        ],
                        suggestions: ['Take survey', 'View my responses', 'Help'],
                        interactive: true
                    };
                }
                
                return {
                    message: `📝 **Available Surveys**: ${activeSurveys.length} survey(s) you can participate in!\n\n${activeSurveys.slice(0, 3).map(survey => 
                        `• **${survey.title}**\n  Target: ${survey.target_audience || 'All'}\n  ${survey.description ? survey.description.substring(0, 80) + '...' : ''}`
                    ).join('\n\n')}\n\nYour participation helps improve the campus experience!`,
                    data: { surveys: activeSurveys.slice(0, 5) },
                    navigationLink: '/surveys',
                    quickActions: [
                        { label: 'View All Surveys', link: '/surveys', type: 'primary' }
                    ],
                    suggestions: ['Take survey', 'View results', 'My survey history'],
                    interactive: true
                };
            } else if (userRole === 'lecturer' || userRole === 'administrator') {
                const allSurveys = await Survey.listSurveyTemplates({ created_by: userId });
                const activeSurveys = allSurveys.filter(s => s.is_active);
                
                return {
                    message: `📝 **Survey Management**: You have ${allSurveys.length} survey(s), ${activeSurveys.length} active

As a ${userRole}, you can:
• Create new surveys with custom questions
• Target specific audiences (students, lecturers, all)
• View real-time response analytics
• Export survey results
• Manage survey lifecycle (activate/deactivate)

**Your Latest Surveys:**
${allSurveys.slice(0, 3).map(survey => 
                    `• **${survey.title}** - ${survey.total_responses || 0} responses`
                ).join('\n') || 'No surveys yet'}`,
                    data: { surveys: allSurveys.slice(0, 5) },
                    navigationLink: userRole === 'lecturer' ? '/lecturer/surveys' : '/administrator/surveys',
                    quickActions: [
                        { label: 'Create New Survey', link: userRole === 'lecturer' ? '/lecturer/surveys/new' : '/administrator/surveys/new', type: 'primary' },
                        { label: 'View My Surveys', link: userRole === 'lecturer' ? '/lecturer/surveys' : '/administrator/surveys', type: 'secondary' }
                    ],
                    suggestions: ['Create survey', 'View responses', 'Survey analytics', 'Help'],
                    interactive: true
                };
            }
        } catch (error) {
            logger.error('Error handling surveys query:', error);
        }
        
        return {
            message: "📝 I can help you with surveys! Students can participate in available surveys, while lecturers and administrators can create and manage them.\n\nLet me take you to the surveys page.",
            navigationLink: userRole === 'student' ? '/surveys' : 
                          userRole === 'lecturer' ? '/lecturer/surveys' : '/administrator/surveys',
            quickActions: [
                { label: 'Go to Surveys', link: userRole === 'student' ? '/surveys' : 
                                              userRole === 'lecturer' ? '/lecturer/surveys' : '/administrator/surveys', type: 'primary' }
            ],
            suggestions: ['View surveys', 'Take survey', 'Help']
        };
    }

    /**
     * Handle message-related queries
     */
    async handleMessages(message, userId, userRole, context) {
        try {
            const lowerMessage = message.toLowerCase();
            
            // Get user's messages (simplified - you may need to adjust based on your Message model)
            const messageHint = lowerMessage.includes('unread') ? 'unread messages' :
                               lowerMessage.includes('send') ? 'send a new message' :
                               lowerMessage.includes('inbox') ? 'inbox' : 'messages';
            
            return {
                message: `💬 **Messages**: Opening your ${messageHint}!

In the messaging system, you can:
• Send messages to lecturers, students, and administrators
• View conversation history
• Share files and attachments
• Get real-time notifications for new messages
• Organize conversations by person

Let me take you to your messages now!`,
                navigationLink: '/messages',
                quickActions: [
                    { label: 'Open Messages', link: '/messages', type: 'primary' },
                    { label: 'New Message', link: '/messages/new', type: 'secondary' }
                ],
                suggestions: ['Send message', 'Check unread', 'Message history', 'Help'],
                interactive: true
            };
        } catch (error) {
            logger.error('Error handling messages query:', error);
            return {
                message: "💬 Taking you to your messages where you can communicate with others in the system.",
                navigationLink: '/messages',
                quickActions: [
                    { label: 'Open Messages', link: '/messages', type: 'primary' }
                ],
                suggestions: ['Help', 'Dashboard']
            };
        }
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
     * Handle notification-related queries
     */
    async handleNotifications(message, userId, userRole, context) {
        try {
            const NotificationModel = require('../models/Notification');
            
            // Get user's notifications
            const notificationsResult = await NotificationModel.listAllForUser(userId);
            const notifications = notificationsResult.data || [];
            const unreadNotifications = notifications.filter(n => !n.is_read);
            
            if (message.toLowerCase().includes('unread') || message.toLowerCase().includes('new')) {
                return {
                    message: `You have ${unreadNotifications.length} unread notification(s).\n\n${unreadNotifications.slice(0, 3).map(n => 
                        `🔔 ${n.content}`
                    ).join('\n\n')}${unreadNotifications.length > 3 ? `\n\n...and ${unreadNotifications.length - 3} more` : ''}`,
                    data: { notifications: unreadNotifications.slice(0, 5) },
                    navigationLink: '/notifications',
                    quickActions: [
                        { label: 'View All Notifications', link: '/notifications', type: 'primary' },
                        { label: 'Mark All as Read', action: 'markAllRead', type: 'secondary' }
                    ],
                    suggestions: ['Mark all as read', 'View specific notification', 'Help'],
                    interactive: true
                };
            }
            
            return {
                message: `You have ${notifications.length} total notifications, with ${unreadNotifications.length} unread.

I can help you:
• View all notifications
• Check unread notifications
• Navigate to specific notification content
• Mark notifications as read`,
                data: { 
                    total: notifications.length, 
                    unread: unreadNotifications.length,
                    recent: notifications.slice(0, 3)
                },
                navigationLink: '/notifications',
                quickActions: [
                    { label: 'View Notifications', link: '/notifications', type: 'primary' },
                    { label: 'Check Unread', link: '/notifications?filter=unread', type: 'secondary' }
                ],
                suggestions: ['View unread notifications', 'Mark all as read', 'Notification settings'],
                interactive: true
            };
            
        } catch (error) {
            logger.error('Error handling notifications query:', error);
            return {
                message: "I'll take you to your notifications page where you can see all your updates and alerts.",
                navigationLink: '/notifications',
                quickActions: [
                    { label: 'View Notifications', link: '/notifications', type: 'primary' }
                ],
                suggestions: ['Help', 'Dashboard'],
                error: error.message
            };
        }
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
                'Check notifications',
                'Check messages',
                'What can you do?'
            ],
            interactive: true
        };
    }

    /**
     * Handle notification-based navigation
     * This method is called when a user clicks on a notification
     */
    async handleNotificationNavigation(notificationData, userId, userRole) {
        try {
            const { type, source_table, source_id, content } = notificationData;
            
            // Map notification types to appropriate pages
            const notificationRoutes = {
                'appointment_new': {
                    student: `/appointments/${source_id}`,
                    lecturer: `/lecturer/appointments/${source_id}`,
                    administrator: `/administrator/appointments/${source_id}`
                },
                'appointment_approved': {
                    student: `/appointments/${source_id}`,
                    lecturer: `/lecturer/appointments/${source_id}`
                },
                'appointment_declined': {
                    student: `/appointments/${source_id}`,
                    lecturer: `/lecturer/appointments/${source_id}`
                },
                'appointment_cancelled': {
                    student: `/appointments/${source_id}`,
                    lecturer: `/lecturer/appointments/${source_id}`
                },
                'event_new': {
                    all: `/events/${source_id}`
                },
                'event_update': {
                    all: `/events/${source_id}`
                },
                'event_reminder': {
                    all: `/events/${source_id}`
                },
                'message_new': {
                    all: `/messages/${source_id}`
                },
                'survey_new': {
                    student: `/surveys/${source_id}`,
                    lecturer: `/lecturer/surveys/${source_id}`,
                    administrator: `/administrator/surveys/${source_id}`
                },
                'system_announcement': {
                    all: '/notifications'
                }
            };

            const route = notificationRoutes[type];
            let navigationLink = '/notifications'; // Default fallback
            let message = `Opening the page related to: "${content}"`;

            if (route) {
                navigationLink = route[userRole] || route.all || navigationLink;
                
                // Customize message based on notification type
                switch (type) {
                    case 'appointment_new':
                        message = userRole === 'student' 
                            ? "Taking you to your appointment details. You can view the status and details here."
                            : "Opening the new appointment request. You can approve or decline it here.";
                        break;
                    case 'appointment_approved':
                        message = "Great news! Taking you to your approved appointment details.";
                        break;
                    case 'appointment_declined':
                        message = "Taking you to the appointment details. You can book a different time if needed.";
                        break;
                    case 'event_new':
                        message = "Taking you to the new event details. You can RSVP and get more information here.";
                        break;
                    case 'message_new':
                        message = "Opening your new message. You can read and reply here.";
                        break;
                    case 'survey_new':
                        message = userRole === 'student'
                            ? "Taking you to the new survey. You can participate and share your feedback."
                            : "Opening the survey management page where you can view responses and analytics.";
                        break;
                    default:
                        message = `Opening the page for: "${content}"`;
                }
            }

            return {
                message,
                navigationLink,
                quickActions: [
                    { 
                        label: 'Go to Page', 
                        link: navigationLink,
                        type: 'primary'
                    },
                    {
                        label: 'View All Notifications',
                        link: '/notifications',
                        type: 'secondary'
                    }
                ],
                suggestions: [
                    'Mark as read',
                    'View all notifications',
                    'Help'
                ],
                interactive: true,
                notificationHandled: true
            };

        } catch (error) {
            logger.error('Error handling notification navigation:', error);
            return {
                message: "I'll take you to the notifications page where you can see all your updates.",
                navigationLink: '/notifications',
                quickActions: [
                    { label: 'View Notifications', link: '/notifications', type: 'primary' }
                ],
                suggestions: ['Help', 'Dashboard'],
                error: error.message
            };
        }
    }

    /**
     * Handle general queries
     */
    async handleGeneral(message, userId, userRole, context) {
        return {
            message: "I'm your intelligent RP Community assistant! I can help you with:\n\n• 🧭 **Navigation** - 'Go to appointments', 'Open events'\n• 📅 **Appointments** - Booking, scheduling, availability\n• 🎉 **Events** - Campus activities and workshops\n• 📝 **Surveys** - Polls and feedback\n• 💬 **Messages** - Communication\n• 🔔 **Notifications** - Handle alerts and updates\n• ❓ **Help** - System guidance and tutorials\n\nJust tell me what you want to do in natural language!",
            suggestions: [
                'Show my appointments',
                'Upcoming events', 
                'Check notifications',
                'Help me navigate',
                'What can you do?'
            ],
            interactive: true
        };
    }

    // Helper methods

    /**
     * Get cached data or fetch and cache it
     */
    async getCachedData(key, fetchFunction, ttl = this.cacheTimeout) {
        const cached = this.cache.get(key);
        
        if (cached && (Date.now() - cached.timestamp < ttl)) {
            return cached.data; // Cache hit
        }
        
        // Cache miss - fetching data
        const data = await fetchFunction();
        
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
        
        return data;
    }

    /**
     * Clear cache for specific key or all cache
     */
    clearCache(key = null) {
        if (key) {
            this.cache.delete(key);
            // Cache cleared
        } else {
            this.cache.clear();
            // All cache cleared
        }
    }

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