const { logger } = require('../utils/logger');
const natural = require('natural');
const { WordTokenizer, PorterStemmer, BayesClassifier } = natural;
const fs = require('fs').promises;
const path = require('path');

class EnhancedChatbotTrainingService {
  constructor() {
    this.classifier = new BayesClassifier();
    this.tokenizer = new WordTokenizer();
    this.modelPath = path.join(__dirname, '../../data/chatbot_model.json');
    this.trainingDataPath = path.join(__dirname, '../../data/training_data.json');
    this.isModelTrained = false;

    // Comprehensive training data
    this.comprehensiveTrainingData = {
      intents: {
        // Appointment-related intents
        book_appointment: {
          examples: [
            "I want to book an appointment",
            "How can I schedule a meeting",
            "I need to meet with a lecturer",
            "Book appointment with professor",
            "Schedule consultation",
            "I want to book an appointment with my lecturer",
            "Can you help me schedule a meeting",
            "How do I book time with staff",
            "I need academic consultation",
            "Set up appointment"
          ],
          keywords: ["book", "schedule", "appointment", "meeting", "consultation"],
          roleResponses: {
            student: {
              message: "I'll help you book an appointment. Let me check available lecturers for you.",
              action: "show_available_staff",
              link: "/appointments/new"
            },
            lecturer: {
              message: "You can view and manage appointment requests from students.",
              action: "show_appointment_requests",
              link: "/lecturer/appointments"
            },
            administrator: {
              message: "You can view all appointments in the system.",
              action: "show_all_appointments",
              link: "/administrator/appointments"
            }
          }
        },

        check_lecturer_availability: {
          examples: [
            "When is my lecturer available",
            "Show lecturer availability",
            "Check professor schedule",
            "When can I meet with staff",
            "Available time slots",
            "Is my lecturer free today",
            "Show me available times",
            "Lecturer schedule this week",
            "When is Dr. Smith available",
            "Staff availability"
          ],
          keywords: ["available", "availability", "schedule", "free", "slots"],
          roleResponses: {
            student: {
              message: "Let me check the lecturer availability for you.",
              action: "fetch_staff_availability",
              link: "/appointments/availability"
            },
            lecturer: {
              message: "Here's your availability schedule. You can update it as needed.",
              action: "show_my_availability",
              link: "/lecturer/availability"
            },
            administrator: {
              message: "Here's the staff availability overview.",
              action: "show_all_staff_availability",
              link: "/administrator/availability"
            }
          }
        },

        my_appointments: {
          examples: [
            "Show my appointments",
            "What appointments do I have",
            "My upcoming meetings",
            "List my scheduled appointments",
            "Do I have any appointments today",
            "My appointment schedule",
            "Check my bookings",
            "When is my next appointment",
            "Show scheduled meetings",
            "My consultations"
          ],
          keywords: ["my", "appointments", "meetings", "scheduled", "upcoming"],
          roleResponses: {
            student: {
              message: "Here are your appointments:",
              action: "fetch_student_appointments",
              link: "/appointments"
            },
            lecturer: {
              message: "Here are your appointments and meeting requests:",
              action: "fetch_lecturer_appointments",
              link: "/lecturer/appointments"
            },
            administrator: {
              message: "Here's your appointment overview:",
              action: "fetch_admin_appointments",
              link: "/administrator/appointments"
            }
          }
        },

        // Event-related intents
        create_event: {
          examples: [
            "Create an event",
            "How to organize an event",
            "Schedule a workshop",
            "Plan a seminar",
            "Set up conference",
            "I want to create an event",
            "Organize campus activity",
            "Add new event",
            "Schedule campus event",
            "Create workshop"
          ],
          keywords: ["create", "organize", "event", "workshop", "seminar"],
          roleResponses: {
            student: {
              message: "Students can view events but cannot create them. Would you like to see upcoming events instead?",
              action: "show_events",
              link: "/events"
            },
            lecturer: {
              message: "I'll help you create an event. Let's set up the details.",
              action: "create_event_form",
              link: "/lecturer/events/new"
            },
            administrator: {
              message: "You can create and manage all campus events.",
              action: "create_event_admin",
              link: "/administrator/events/new"
            }
          }
        },

        view_events: {
          examples: [
            "Show upcoming events",
            "What events are happening",
            "Campus activities",
            "List all events",
            "Events this week",
            "What's happening on campus",
            "Show me events",
            "Upcoming workshops",
            "Academic events",
            "Social activities"
          ],
          keywords: ["events", "activities", "happening", "workshops", "campus"],
          roleResponses: {
            student: {
              message: "Here are the upcoming campus events:",
              action: "fetch_upcoming_events",
              link: "/events"
            },
            lecturer: {
              message: "Here are the events including ones you're organizing:",
              action: "fetch_lecturer_events",
              link: "/lecturer/events"
            },
            administrator: {
              message: "Here's the complete event management dashboard:",
              action: "fetch_all_events",
              link: "/administrator/events"
            }
          }
        },

        // Messaging intents
        send_message: {
          examples: [
            "Send a message",
            "How to contact someone",
            "Message a lecturer",
            "Contact staff",
            "Send notification",
            "How do I message",
            "Contact professor",
            "Reach out to someone",
            "Send email",
            "Communicate with staff"
          ],
          keywords: ["message", "contact", "send", "communicate", "reach"],
          roleResponses: {
            student: {
              message: "You can message lecturers and other students through the messaging system.",
              action: "open_messages",
              link: "/messages"
            },
            lecturer: {
              message: "Access your messages and communications here.",
              action: "open_lecturer_messages",
              link: "/lecturer/messages"
            },
            administrator: {
              message: "You can send announcements and manage all communications.",
              action: "open_admin_messages",
              link: "/administrator/messages"
            }
          }
        },

        // Availability management
        set_availability: {
          examples: [
            "Set my availability",
            "Update my schedule",
            "Change availability hours",
            "Set office hours",
            "Manage my time slots",
            "Update available times",
            "Configure schedule",
            "Set consultation hours",
            "Block time slots",
            "Manage calendar"
          ],
          keywords: ["set", "availability", "schedule", "hours", "manage"],
          roleResponses: {
            student: {
              message: "Availability management is for staff members only. You can view lecturer availability when booking appointments.",
              action: "show_available_staff",
              link: "/appointments/availability"
            },
            lecturer: {
              message: "Let's update your availability schedule.",
              action: "manage_availability",
              link: "/lecturer/availability/edit"
            },
            administrator: {
              message: "You can manage your availability and view all staff schedules.",
              action: "manage_admin_availability",
              link: "/administrator/availability"
            }
          }
        },

        // Status checking
        appointment_status: {
          examples: [
            "Check appointment status",
            "Is my appointment confirmed",
            "Appointment pending",
            "Meeting status",
            "Was my appointment accepted",
            "Check booking status",
            "Appointment confirmation",
            "Is my meeting approved",
            "Status of my request",
            "Pending appointments"
          ],
          keywords: ["status", "confirmed", "pending", "accepted", "approved"],
          roleResponses: {
            student: {
              message: "Let me check your appointment status.",
              action: "check_appointment_status",
              link: "/appointments?filter=pending"
            },
            lecturer: {
              message: "Here are your pending appointment requests to review.",
              action: "show_pending_requests",
              link: "/lecturer/appointments?filter=pending"
            },
            administrator: {
              message: "View all appointment statuses across the system.",
              action: "show_all_statuses",
              link: "/administrator/appointments/status"
            }
          }
        },

        // Cancellation and rescheduling
        cancel_appointment: {
          examples: [
            "Cancel appointment",
            "Cancel my meeting",
            "Remove appointment",
            "Delete booking",
            "Cancel consultation",
            "I can't make it to my appointment",
            "Need to cancel",
            "Cancel scheduled meeting",
            "Remove from calendar",
            "Cancel my booking"
          ],
          keywords: ["cancel", "remove", "delete", "can't make"],
          roleResponses: {
            student: {
              message: "I'll help you cancel your appointment. Which appointment would you like to cancel?",
              action: "show_cancellable_appointments",
              link: "/appointments?action=cancel"
            },
            lecturer: {
              message: "You can cancel or decline appointments here.",
              action: "manage_appointment_cancellations",
              link: "/lecturer/appointments?action=manage"
            },
            administrator: {
              message: "Manage appointment cancellations system-wide.",
              action: "admin_cancellations",
              link: "/administrator/appointments/manage"
            }
          }
        },

        reschedule_appointment: {
          examples: [
            "Reschedule appointment",
            "Change appointment time",
            "Move my meeting",
            "Different time slot",
            "Postpone appointment",
            "Change meeting date",
            "Reschedule consultation",
            "New appointment time",
            "Shift appointment",
            "Change booking time"
          ],
          keywords: ["reschedule", "change", "move", "postpone", "shift"],
          roleResponses: {
            student: {
              message: "Let's reschedule your appointment. Which one would you like to change?",
              action: "show_reschedulable_appointments",
              link: "/appointments?action=reschedule"
            },
            lecturer: {
              message: "You can reschedule appointments and suggest new times.",
              action: "manage_rescheduling",
              link: "/lecturer/appointments/reschedule"
            },
            administrator: {
              message: "Manage appointment rescheduling across the system.",
              action: "admin_rescheduling",
              link: "/administrator/appointments/reschedule"
            }
          }
        },

        // Help and navigation
        help: {
          examples: [
            "Help",
            "What can you do",
            "How does this work",
            "Guide me",
            "I need assistance",
            "Show me how",
            "What are my options",
            "System features",
            "How to use",
            "Get started"
          ],
          keywords: ["help", "guide", "how", "assistance", "options"],
          roleResponses: {
            student: {
              message: "I can help you with:\n• Booking appointments with lecturers\n• Viewing upcoming events\n• Checking your schedule\n• Sending messages\n• Managing your appointments\n\nWhat would you like to do?",
              action: "show_help_menu",
              link: "/help"
            },
            lecturer: {
              message: "I can assist you with:\n• Managing appointment requests\n• Setting your availability\n• Creating events\n• Viewing your schedule\n• Communicating with students\n• Managing your profile\n\nHow can I help?",
              action: "show_lecturer_help",
              link: "/lecturer/help"
            },
            administrator: {
              message: "Administrator functions:\n• System-wide appointment management\n• Event creation and management\n• User management\n• Availability oversight\n• Reports and analytics\n• System configuration\n\nWhat would you like to manage?",
              action: "show_admin_help",
              link: "/administrator/dashboard"
            }
          }
        },

        // Quick actions
        quick_book_today: {
          examples: [
            "Book appointment today",
            "Any slots available today",
            "Meet someone today",
            "Today's availability",
            "Urgent appointment",
            "Need meeting today",
            "Available now",
            "Emergency consultation",
            "Same day appointment",
            "Book for today"
          ],
          keywords: ["today", "urgent", "now", "emergency", "same day"],
          roleResponses: {
            student: {
              message: "Checking today's available slots for urgent appointments...",
              action: "fetch_today_availability",
              link: "/appointments/urgent"
            },
            lecturer: {
              message: "Here are today's appointment requests and your current schedule.",
              action: "show_today_schedule",
              link: "/lecturer/appointments/today"
            },
            administrator: {
              message: "Today's appointment overview and urgent requests.",
              action: "show_today_system_appointments",
              link: "/administrator/appointments/today"
            }
          }
        }
      }
    };
  }

  /**
   * Initialize and train the model with comprehensive data
   */
  async initializeWithComprehensiveTraining() {
    try {
      // Add comprehensive training data
      await this.addTrainingData(this.comprehensiveTrainingData);

      // Train the model
      await this.trainModel();

      logger.info('Chatbot initialized with comprehensive training data');
      return true;
    } catch (error) {
      logger.error('Error initializing comprehensive training:', error);
      return false;
    }
  }

  /**
   * Process query with role-based responses
   */
  async processQueryWithRole(message, userRole) {
    try {
      // Classify the intent
      const classification = this.classifyText(message);

      // Get the intent data
      const intentData = this.comprehensiveTrainingData.intents[classification.intent];

      if (!intentData) {
        return {
          success: false,
          message: "I'm not sure how to help with that. Try asking about appointments, events, or type 'help' for options.",
          suggestions: this.getSuggestionsForRole(userRole)
        };
      }

      // Get role-specific response
      const roleResponse = intentData.roleResponses[userRole] || intentData.roleResponses.student;

      return {
        success: true,
        intent: classification.intent,
        confidence: classification.confidence,
        ...roleResponse,
        suggestions: this.getSuggestionsForRole(userRole, classification.intent)
      };
    } catch (error) {
      logger.error('Error processing query with role:', error);
      return {
        success: false,
        message: 'Sorry, I encountered an error. Please try again.',
        error: error.message
      };
    }
  }

  /**
   * Get contextual suggestions based on role and current intent
   */
  getSuggestionsForRole(role, currentIntent = null) {
    const suggestions = {
      student: [
        'Book appointment',
        'View my appointments',
        'Check lecturer availability',
        'Upcoming events',
        'Help'
      ],
      lecturer: [
        'View appointment requests',
        'Set my availability',
        'Create event',
        'My schedule today',
        'Help'
      ],
      administrator: [
        'System dashboard',
        'Manage appointments',
        'Create event',
        'View reports',
        'User management'
      ]
    };

    // Modify suggestions based on current intent
    if (currentIntent === 'book_appointment') {
      suggestions.student = [
        'Check availability today',
        'View all lecturers',
        'My appointments',
        'Cancel appointment'
      ];
    }

    return suggestions[role] || suggestions.student;
  }

  /**
   * Add training data to the model
   */
  async addTrainingData(data) {
    try {
      let trainingData = {};

      try {
        const existingData = await fs.readFile(this.trainingDataPath, 'utf8');
        trainingData = JSON.parse(existingData);
      } catch (err) {
        trainingData = { intents: {} };
      }

      // Merge new data
      if (data.intents) {
        Object.keys(data.intents).forEach(intent => {
          if (!trainingData.intents[intent]) {
            trainingData.intents[intent] = {
              examples: [],
              keywords: [],
              roleResponses: {}
            };
          }

          if (data.intents[intent].examples) {
            trainingData.intents[intent].examples = [
              ...new Set([
                ...trainingData.intents[intent].examples,
                ...data.intents[intent].examples
              ])
            ];
          }

          if (data.intents[intent].keywords) {
            trainingData.intents[intent].keywords = [
              ...new Set([
                ...(trainingData.intents[intent].keywords || []),
                ...data.intents[intent].keywords
              ])
            ];
          }

          if (data.intents[intent].roleResponses) {
            trainingData.intents[intent].roleResponses = {
              ...trainingData.intents[intent].roleResponses,
              ...data.intents[intent].roleResponses
            };
          }
        });
      }

      await fs.writeFile(this.trainingDataPath, JSON.stringify(trainingData, null, 2));
      this.isModelTrained = false;

      return true;
    } catch (error) {
      logger.error('Error adding training data:', error);
      return false;
    }
  }

  /**
   * Train the model
   */
  async trainModel() {
    try {
      const data = await fs.readFile(this.trainingDataPath, 'utf8');
      const trainingData = JSON.parse(data);

      this.classifier = new BayesClassifier();

      Object.keys(trainingData.intents).forEach(intent => {
        const examples = trainingData.intents[intent].examples || [];
        examples.forEach(example => {
          this.classifier.addDocument(this.preprocessText(example), intent);
        });

        const keywords = trainingData.intents[intent].keywords || [];
        keywords.forEach(keyword => {
          for (let i = 0; i < 3; i++) {
            this.classifier.addDocument(this.preprocessText(keyword), intent);
          }
        });
      });

      this.classifier.train();
      await this.saveModel();
      this.isModelTrained = true;

      logger.info('Chatbot model trained successfully');
      return true;
    } catch (error) {
      logger.error('Error training model:', error);
      return false;
    }
  }

  /**
   * Preprocess text for classification
   */
  preprocessText(text) {
    const lowercased = text.toLowerCase();
    const tokens = this.tokenizer.tokenize(lowercased);
    const processed = tokens
      .filter(token => !this.isStopword(token))
      .map(token => PorterStemmer.stem(token));

    return processed.join(' ');
  }

  /**
   * Check if word is stopword
   */
  isStopword(word) {
    const stopwords = ['a', 'an', 'the', 'and', 'or', 'but', 'is', 'are', 'was', 'were',
      'be', 'been', 'being', 'in', 'on', 'at', 'to', 'for', 'with'];
    return stopwords.includes(word);
  }

  /**
   * Classify text to determine intent
   */
  classifyText(text) {
    if (!this.isModelTrained) {
      return { intent: 'unknown', confidence: 0 };
    }

    const preprocessed = this.preprocessText(text);
    const classifications = this.classifier.getClassifications(preprocessed);

    if (classifications.length === 0) {
      return { intent: 'unknown', confidence: 0 };
    }

    return {
      intent: classifications[0].label,
      confidence: classifications[0].value,
      allClassifications: classifications
    };
  }

  /**
   * Save model
   */
  async saveModel() {
    try {
      const modelJson = JSON.stringify(this.classifier);
      await fs.writeFile(this.modelPath, modelJson);
      return true;
    } catch (error) {
      logger.error('Error saving model:', error);
      return false;
    }
  }

  /**
   * Load model
   */
  async loadModel() {
    try {
      const modelJson = await fs.readFile(this.modelPath, 'utf8');
      this.classifier = BayesClassifier.restore(JSON.parse(modelJson));
      this.isModelTrained = true;
      return true;
    } catch (error) {
      logger.error('Error loading model:', error);
      throw error;
    }
  }
}

module.exports = new EnhancedChatbotTrainingService();