const fs = require('fs').promises;
const path = require('path');
const { logger } = require('./logger');

/**
 * Chatbot Training Enhancement Utility
 * Adds more training data and improves the chatbot's understanding
 */
class ChatbotTrainer {
    constructor() {
        this.trainingDataPath = path.join(__dirname, '../../data/training_data.json');
        this.modelPath = path.join(__dirname, '../../data/chatbot_model.json');
    }

    /**
     * Enhanced training data with more conversational patterns
     */
    getEnhancedTrainingData() {
        return {
            intents: {
                // Navigation intents
                navigation: {
                    examples: [
                        "Go to appointments",
                        "Open events page",
                        "Take me to messages",
                        "Show me my profile",
                        "Navigate to dashboard",
                        "Open the surveys page",
                        "Go to notifications",
                        "Show me the community feed",
                        "Take me to settings",
                        "Open my account page",
                        "I want to see appointments",
                        "Can you open events?",
                        "Show me where to book appointments",
                        "Where can I find my messages?",
                        "How do I get to my profile?"
                    ],
                    keywords: ["go", "open", "navigate", "take", "show", "page", "where", "find"],
                    roleResponses: {
                        student: {
                            message: "I'll help you navigate! Where would you like to go?",
                            action: "handle_navigation",
                            link: "/dashboard"
                        },
                        lecturer: {
                            message: "I can take you anywhere in the system. What page do you need?",
                            action: "handle_navigation", 
                            link: "/lecturer/dashboard"
                        },
                        administrator: {
                            message: "I'll help you navigate the admin system. Where to?",
                            action: "handle_navigation",
                            link: "/administrator/dashboard"
                        }
                    }
                },

                // Enhanced appointment intents
                book_appointment: {
                    examples: [
                        "I want to book an appointment",
                        "How can I schedule a meeting",
                        "I need to meet with a lecturer",
                        "Book appointment with professor",
                        "Schedule consultation",
                        "Can I book a meeting?",
                        "I need to see my lecturer",
                        "How do I make an appointment?",
                        "Book me a slot with Dr. Smith",
                        "I want to schedule a consultation",
                        "Can you help me book an appointment?",
                        "I need to meet with my professor today",
                        "How can I get an appointment?",
                        "I want to see a lecturer",
                        "Can I schedule a meeting for tomorrow?"
                    ],
                    keywords: ["book", "schedule", "appointment", "meeting", "consultation", "meet", "see"],
                    roleResponses: {
                        student: {
                            message: "I'll help you book an appointment! Let me show you available lecturers.",
                            action: "show_available_staff",
                            link: "/appointments"
                        },
                        lecturer: {
                            message: "You can manage appointment requests from students here.",
                            action: "show_appointment_requests",
                            link: "/lecturer/appointments"
                        },
                        administrator: {
                            message: "You can oversee all appointments in the system.",
                            action: "show_all_appointments",
                            link: "/administrator/appointments"
                        }
                    }
                },

                // System information and help
                system_info: {
                    examples: [
                        "What is this system?",
                        "How does this work?",
                        "Explain the appointment system",
                        "What can I do here?",
                        "Tell me about events",
                        "How do surveys work?",
                        "What features are available?",
                        "Explain how to use this platform",
                        "What is RP Community?",
                        "How does the messaging system work?",
                        "Tell me about the notification system",
                        "What are the main features?",
                        "How do I use this system?",
                        "Explain the platform to me",
                        "What can this system do?"
                    ],
                    keywords: ["what", "how", "explain", "tell", "about", "system", "work", "features"],
                    roleResponses: {
                        student: {
                            message: "RP Community is your campus platform for appointments, events, surveys, and communication!",
                            action: "explain_system",
                            link: "/help"
                        },
                        lecturer: {
                            message: "This system helps you manage student interactions, create events, and handle appointments efficiently.",
                            action: "explain_system",
                            link: "/lecturer/help"
                        },
                        administrator: {
                            message: "You have full administrative control over users, appointments, events, and system settings.",
                            action: "explain_system",
                            link: "/administrator/help"
                        }
                    }
                },

                // Conversational and friendly responses
                greeting: {
                    examples: [
                        "Hello",
                        "Hi there",
                        "Hey",
                        "Good morning",
                        "Good afternoon", 
                        "Good evening",
                        "Greetings",
                        "What's up",
                        "Howdy",
                        "Hiya",
                        "Hello chatbot",
                        "Hi assistant",
                        "Hey there",
                        "Good day",
                        "Salutations"
                    ],
                    keywords: ["hello", "hi", "hey", "good", "morning", "afternoon", "evening", "greetings"],
                    roleResponses: {
                        student: {
                            message: "Hello! I'm your friendly RP Community assistant. I'm here to help you with appointments, events, and everything else!",
                            action: "show_welcome",
                            link: "/dashboard"
                        },
                        lecturer: {
                            message: "Hello! I'm here to help you manage your appointments, create events, and handle student interactions.",
                            action: "show_welcome",
                            link: "/lecturer/dashboard"
                        },
                        administrator: {
                            message: "Hello! I'm your administrative assistant for managing the entire RP Community system.",
                            action: "show_welcome",
                            link: "/administrator/dashboard"
                        }
                    }
                },

                // Enhanced availability checking
                check_lecturer_availability: {
                    examples: [
                        "When is my lecturer available",
                        "Show lecturer availability",
                        "Check professor schedule",
                        "When can I meet with staff",
                        "Available time slots",
                        "Is my lecturer free today",
                        "Show me available times",
                        "When is Dr. Smith free?",
                        "What times are available?",
                        "Can I see the schedule?",
                        "Who is available now?",
                        "Show me free slots",
                        "When can I book an appointment?",
                        "What's the availability like?",
                        "Are there any free times today?"
                    ],
                    keywords: ["available", "availability", "schedule", "free", "when", "times", "slots"],
                    roleResponses: {
                        student: {
                            message: "Let me check lecturer availability for you!",
                            action: "fetch_staff_availability",
                            link: "/appointments/availability"
                        },
                        lecturer: {
                            message: "Here's your current availability. You can update it anytime.",
                            action: "show_my_availability",
                            link: "/lecturer/availability"
                        },
                        administrator: {
                            message: "Here's the system-wide availability overview.",
                            action: "show_all_staff_availability",
                            link: "/administrator/availability"
                        }
                    }
                },

                // Enhanced event management
                create_event: {
                    examples: [
                        "Create an event",
                        "I want to organize an event",
                        "How do I make a new event?",
                        "Schedule a workshop",
                        "Plan a seminar",
                        "Set up a conference",
                        "Add a new activity",
                        "Create a campus event",
                        "I need to organize something",
                        "How can I create an event?",
                        "Start a new workshop",
                        "Plan an activity",
                        "Set up an event",
                        "Make a new seminar",
                        "Organize a meeting"
                    ],
                    keywords: ["create", "organize", "event", "workshop", "seminar", "activity", "plan"],
                    roleResponses: {
                        student: {
                            message: "Students can view events but cannot create them. Would you like to see upcoming events?",
                            action: "show_events",
                            link: "/events"
                        },
                        lecturer: {
                            message: "I'll help you create an event! Let's set up all the details.",
                            action: "create_event_form",
                            link: "/lecturer/events/new"
                        },
                        administrator: {
                            message: "You can create and manage all types of campus events.",
                            action: "create_event_admin",
                            link: "/administrator/events/new"
                        }
                    }
                },

                // Enhanced event information queries
                event_info: {
                    examples: [
                        "What events are coming up?",
                        "Show me upcoming events",
                        "Are there any events this week?",
                        "Tell me about campus events",
                        "What activities are available?",
                        "Any workshops or seminars?",
                        "Show me today's events",
                        "What's happening this month?",
                        "List all upcoming events",
                        "Are there any interesting events?",
                        "What events can I join?",
                        "Show me events for students",
                        "Any networking events?",
                        "What's new with events?",
                        "Can you show me the event calendar?"
                    ],
                    keywords: ["event", "events", "workshop", "seminar", "activity", "calendar", "upcoming", "happening"],
                    roleResponses: {
                        student: {
                            message: "I'll show you upcoming events you can join!",
                            action: "show_upcoming_events",
                            link: "/events"
                        },
                        lecturer: {
                            message: "Here are the upcoming events, including ones you've created.",
                            action: "show_lecturer_events",
                            link: "/lecturer/events"
                        },
                        administrator: {
                            message: "Here's an overview of all upcoming campus events.",
                            action: "show_all_events",
                            link: "/administrator/events"
                        }
                    }
                },

                // Conversational help and guidance
                help: {
                    examples: [
                        "Help",
                        "I need help",
                        "Can you help me?",
                        "What can you do?",
                        "How does this work?",
                        "I'm confused",
                        "Guide me",
                        "Show me around",
                        "I don't know what to do",
                        "Can you assist me?",
                        "I need assistance",
                        "Help me out",
                        "What are my options?",
                        "Show me the features",
                        "I'm lost"
                    ],
                    keywords: ["help", "assist", "guide", "confused", "lost", "options", "features"],
                    roleResponses: {
                        student: {
                            message: "I'm here to help! I can assist with appointments, events, surveys, messages, and navigation. What do you need?",
                            action: "show_help_menu",
                            link: "/help"
                        },
                        lecturer: {
                            message: "I can help you with appointment management, event creation, availability settings, and more. What would you like to do?",
                            action: "show_lecturer_help",
                            link: "/lecturer/help"
                        },
                        administrator: {
                            message: "I can assist with system administration, user management, reports, and all administrative functions. How can I help?",
                            action: "show_admin_help",
                            link: "/administrator/help"
                        }
                    }
                },

                // Smart suggestions and recommendations
                smart_suggestions: {
                    examples: [
                        "What should I do?",
                        "Any suggestions?",
                        "What's recommended?",
                        "What's popular?",
                        "What do most people do?",
                        "Give me some ideas",
                        "What would you recommend?",
                        "What's next?",
                        "What can I try?",
                        "Show me something interesting",
                        "What's new?",
                        "What's trending?",
                        "Any recommendations?",
                        "What's worth checking out?",
                        "Surprise me"
                    ],
                    keywords: ["suggest", "recommend", "ideas", "popular", "trending", "new", "interesting"],
                    roleResponses: {
                        student: {
                            message: "Based on your activity, I suggest checking upcoming events, booking appointments with your lecturers, or taking available surveys!",
                            action: "show_personalized_suggestions",
                            link: "/dashboard"
                        },
                        lecturer: {
                            message: "You might want to review pending appointment requests, update your availability, or create a new event for your students!",
                            action: "show_lecturer_suggestions",
                            link: "/lecturer/dashboard"
                        },
                        administrator: {
                            message: "Consider reviewing system statistics, managing user accounts, or creating system-wide announcements!",
                            action: "show_admin_suggestions",
                            link: "/administrator/dashboard"
                        }
                    }
                }
            }
        };
    }

    /**
     * Add enhanced conversational patterns
     */
    getConversationalPatterns() {
        return {
            // Casual conversation starters
            casual: [
                "How are you?",
                "What's up?",
                "How's it going?",
                "Nice to meet you",
                "Thanks for your help",
                "You're helpful",
                "That's great",
                "Awesome",
                "Cool",
                "Interesting"
            ],

            // Polite expressions
            polite: [
                "Please help me",
                "Could you assist me?",
                "Would you mind helping?",
                "If you don't mind",
                "Thank you",
                "Thanks a lot",
                "I appreciate it",
                "You're welcome",
                "No problem",
                "My pleasure"
            ],

            // Clarification requests
            clarification: [
                "I don't understand",
                "Can you explain?",
                "What do you mean?",
                "Could you clarify?",
                "I'm not sure",
                "Can you be more specific?",
                "What exactly?",
                "How so?",
                "In what way?",
                "Could you elaborate?"
            ]
        };
    }

    /**
     * Enhanced training with system knowledge
     */
    async enhanceTraining() {
        try {
            logger.info('Starting chatbot training enhancement...');

            // Load existing training data
            let existingData = {};
            try {
                const data = await fs.readFile(this.trainingDataPath, 'utf8');
                existingData = JSON.parse(data);
            } catch (error) {
                logger.warn('No existing training data found, creating new...');
            }

            // Get enhanced training data
            const enhancedData = this.getEnhancedTrainingData();
            const conversationalPatterns = this.getConversationalPatterns();

            // Merge with existing data
            const mergedData = {
                ...existingData,
                intents: {
                    ...existingData.intents,
                    ...enhancedData.intents
                },
                conversationalPatterns,
                systemKnowledge: {
                    pages: {
                        appointments: "Book and manage appointments with lecturers",
                        events: "Discover and participate in campus events",
                        surveys: "Take surveys and provide feedback",
                        messages: "Communicate with other users",
                        profile: "Manage your personal information",
                        notifications: "Stay updated with alerts",
                        dashboard: "Your personal overview and quick actions",
                        feed: "Community posts and social interaction"
                    },
                    features: {
                        student: [
                            "Book appointments with lecturers",
                            "View and RSVP to events",
                            "Take surveys and polls",
                            "Send and receive messages",
                            "Manage profile and settings",
                            "View notifications and updates"
                        ],
                        lecturer: [
                            "Manage appointment requests",
                            "Set availability schedule",
                            "Create and manage events",
                            "Create surveys for students",
                            "Communicate with students",
                            "View dashboard statistics"
                        ],
                        administrator: [
                            "System-wide user management",
                            "Oversee all appointments",
                            "Manage events and activities",
                            "Survey system administration",
                            "Generate reports and analytics",
                            "System configuration and settings"
                        ]
                    },
                    eventInformation: {
                        crucialDetails: [
                            "Event title and description",
                            "Date and time",
                            "Location or venue",
                            "Target audience",
                            "Registration requirements",
                            "Contact information",
                            "Agenda or schedule",
                            "Materials needed",
                            "Special instructions"
                        ],
                        types: [
                            "Academic workshops",
                            "Career seminars",
                            "Social gatherings",
                            "Sports activities",
                            "Cultural events",
                            "Guest lectures",
                            "Club meetings",
                            "Orientation sessions"
                        ]
                    }
                },
                lastUpdated: new Date().toISOString()
            };

            // Save enhanced training data
            await fs.writeFile(this.trainingDataPath, JSON.stringify(mergedData, null, 2));
            logger.info('Enhanced training data saved successfully');

            return {
                success: true,
                message: 'Chatbot training enhanced successfully',
                intentsCount: Object.keys(mergedData.intents).length,
                totalExamples: Object.values(mergedData.intents).reduce((total, intent) => 
                    total + (intent.examples ? intent.examples.length : 0), 0
                )
            };

        } catch (error) {
            logger.error('Error enhancing chatbot training:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Add contextual responses based on user behavior
     */
    addContextualResponses() {
        return {
            timeBasedGreetings: {
                morning: "Good morning! Ready to start your day with RP Community?",
                afternoon: "Good afternoon! How can I help you today?",
                evening: "Good evening! What can I assist you with?"
            },
            
            roleBasedWelcome: {
                student: "Welcome, student! I'm here to help you navigate campus life.",
                lecturer: "Hello, lecturer! Ready to manage your academic activities?",
                administrator: "Greetings, administrator! Let's manage the system together."
            },

            encouragingResponses: [
                "You're doing great! What's next?",
                "Excellent choice! Anything else I can help with?",
                "Perfect! Is there anything else you'd like to explore?",
                "Great question! I'm happy to help with that.",
                "That's a smart move! What else can I assist you with?"
            ],

            helpfulTips: {
                appointments: "💡 Tip: You can book appointments up to 2 weeks in advance!",
                events: "💡 Tip: RSVP early to secure your spot at popular events!",
                surveys: "💡 Tip: Your feedback helps improve the campus experience!",
                messages: "💡 Tip: You can share files and images in messages!"
            }
        };
    }
}

module.exports = new ChatbotTrainer();