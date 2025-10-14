const Appointment = require("../models/Appointment");
const Event = require("../models/Event");
const User = require("../models/User");
const { logger } = require("../utils/logger");

/**
 * Chatbot Service - Handles natural language queries for appointments, events, and other information
 */
class ChatbotService {
  constructor() {
    // Keywords for intent detection
    this.intents = {
      appointments: {
        keywords: [
          "appointment",
          "appointments",
          "booking",
          "schedule",
          "meet",
          "meeting",
          "consultation",
          "book",
        ],
        variations: [
          "when is my appointment",
          "do i have appointments",
          "show my appointments",
          "upcoming appointments",
        ],
      },
      events: {
        keywords: [
          "event",
          "events",
          "happening",
          "activity",
          "activities",
          "workshop",
          "seminar",
          "conference",
        ],
        variations: [
          "what events",
          "upcoming events",
          "show events",
          "events today",
          "events this week",
        ],
      },
      help: {
        keywords: [
          "help",
          "what can you do",
          "how to",
          "guide",
          "assist",
          "support",
        ],
        variations: ["help me", "what can you help with", "how do i"],
      },
      greeting: {
        keywords: [
          "hi",
          "hello",
          "hey",
          "good morning",
          "good afternoon",
          "good evening",
          "greetings",
        ],
        variations: ["hi there", "hello there"],
      }
    };
  }

  /**
   * Detect the intent of the user's message
   */
  detectIntent(message) {
    const lowerMessage = message.toLowerCase().trim();

    // Check for greetings first
    if (
      this.intents.greeting.keywords.some((keyword) =>
        lowerMessage.includes(keyword)
      )
    ) {
      return "greeting";
    }

    // Check for help
    if (
      this.intents.help.keywords.some((keyword) =>
        lowerMessage.includes(keyword)
      )
    ) {
      return "help";
    }

    // Check for appointments
    if (
      this.intents.appointments.keywords.some((keyword) =>
        lowerMessage.includes(keyword)
      )
    ) {
      return "appointments";
    }

    // Check for events
    if (
      this.intents.events.keywords.some((keyword) =>
        lowerMessage.includes(keyword)
      )
    ) {
      return "events";
    }

    // Default to help if no intent is detected
    return "unknown";
  }

  /**
   * Extract time-related information from the message
   */
  extractTimeContext(message) {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes("today")) {
      return "today";
    }
    if (lowerMessage.includes("tomorrow")) {
      return "tomorrow";
    }
    if (lowerMessage.includes("this week") || lowerMessage.includes("week")) {
      return "week";
    }
    if (lowerMessage.includes("this month") || lowerMessage.includes("month")) {
      return "month";
    }
    if (lowerMessage.includes("upcoming") || lowerMessage.includes("next")) {
      return "upcoming";
    }

    return "all";
  }

  /**
   * Format date for display
   */
  formatDate(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Check if today
    if (date.toDateString() === today.toDateString()) {
      return `Today at ${date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    }

    // Check if tomorrow
    if (date.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow at ${date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    }

    // Otherwise show full date
    return date.toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  /**
   * Filter appointments based on time context
   */
  filterByTimeContext(items, timeContext, dateField = "appointment_date") {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const monthEnd = new Date(today);
    monthEnd.setMonth(monthEnd.getMonth() + 1);

    return items.filter((item) => {
      const itemDate = new Date(item[dateField]);

      switch (timeContext) {
        case "today":
          return itemDate >= today && itemDate < tomorrow;
        case "tomorrow":
          const dayAfterTomorrow = new Date(tomorrow);
          dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);
          return itemDate >= tomorrow && itemDate < dayAfterTomorrow;
        case "week":
          return itemDate >= today && itemDate < weekEnd;
        case "month":
          return itemDate >= today && itemDate < monthEnd;
        case "upcoming":
          return itemDate >= today;
        default:
          return itemDate >= today; // Show upcoming by default
      }
    });
  }

  /**
   * Handle appointment queries for students
   */
  async handleAppointmentQuery(userId, message, userRole) {
    try {
      const timeContext = this.extractTimeContext(message);

      // Fetch user's appointments
      const result = await Appointment.getByStudentId(userId);

      if (!result.success || !result.data || result.data.length === 0) {
        return {
          success: true,
          message:
            "You don't have any appointments scheduled at the moment. Would you like to book one?",
          data: [],
          suggestions: [
            "How do I book an appointment?",
            "Show available lecturers",
          ],
        };
      }

      // Filter appointments based on time context
      let appointments = this.filterByTimeContext(
        result.data,
        timeContext,
        "appointment_date"
      );

      if (appointments.length === 0) {
        return {
          success: true,
          message: `You don't have any appointments ${
            timeContext === "all" ? "" : timeContext
          }. Your next appointment is on ${this.formatDate(
            result.data[0].appointment_date
          )}.`,
          data: result.data.slice(0, 3), // Show next 3 appointments
          suggestions: ["Show all appointments", "Book new appointment"],
        };
      }

      // Format response
      let responseMessage = `You have ${appointments.length} appointment${
        appointments.length > 1 ? "s" : ""
      } ${timeContext === "all" ? "upcoming" : timeContext}:\n\n`;

      appointments.slice(0, 5).forEach((apt, index) => {
        responseMessage += `${index + 1}. **${
          apt.lecturer_name || "Lecturer"
        }** - ${apt.purpose || "General consultation"}\n`;
        responseMessage += `   📅 ${this.formatDate(apt.appointment_date)}\n`;
        responseMessage += `   📍 ${apt.location || "Office"}\n`;
        responseMessage += `   Status: ${apt.status}\n\n`;
      });

      if (appointments.length > 5) {
        responseMessage += `...and ${appointments.length - 5} more.`;
      }

      // Include related events
      const eventResult = await this.handleEventQuery(
        userId,
        message,
        userRole
      );
      if (eventResult.success && eventResult.message) {
        responseMessage += `\n\nRelated Events:\n${eventResult.message}`;
      }

      // Add links based on user role
      let appointmentLink = "";
      let eventLink = "";
      if (userRole === "student") {
        appointmentLink = "[View Appointments](/appointments)";
        eventLink = "[View Events](/events)";
      } else if (userRole === "lecturer") {
        appointmentLink = "[View Appointments](/lecturer/appointments)";
        eventLink = "[View Events](/lecturer/events)";
      } else if (userRole === "administrator") {
        appointmentLink = "[View Appointments](/administrator/appointments)";
        eventLink = "[View Events](/administrator/events)";
      }
      if (appointmentLink || eventLink) {
        responseMessage += `\n\n${appointmentLink} ${eventLink}`;
      }

      // Combine data
      const combinedData = {
        appointments,
        events: eventResult.data || [],
      };

      return {
        success: true,
        message: responseMessage,
        data: combinedData,
        suggestions: [
          "Reschedule appointment",
          "Cancel appointment",
          "Book new appointment",
          "Show all events",
        ],
      };
    } catch (error) {
      logger.error("Error handling appointment query:", error);
      return {
        success: false,
        message:
          "I'm having trouble fetching your appointments right now. Please try again later.",
        error: error.message,
      };
    }
  }

  /**
   * Handle event queries for students
   */
  async handleEventQuery(userId, message, userRole) {
    try {
      const timeContext = this.extractTimeContext(message);

      // Fetch events
      const result = await Event.getAll();

      if (!result.success || !result.data || result.data.length === 0) {
        return {
          success: true,
          message:
            "There are no events scheduled at the moment. Check back later for updates!",
          data: [],
          suggestions: ["What else can you help with?"],
        };
      }

      // Filter events based on time context
      let events = this.filterByTimeContext(
        result.data,
        timeContext,
        "event_date"
      );

      if (events.length === 0) {
        return {
          success: true,
          message: `There are no events ${
            timeContext === "all" ? "" : timeContext
          }. The next event is on ${this.formatDate(
            result.data[0].event_date
          )}.`,
          data: result.data.slice(0, 3),
          suggestions: ["Show all events", "Show my appointments"],
        };
      }

      // Format response
      let responseMessage = `There ${events.length === 1 ? "is" : "are"} ${
        events.length
      } event${events.length > 1 ? "s" : ""} ${
        timeContext === "all" ? "upcoming" : timeContext
      }:\n\n`;

      events.slice(0, 5).forEach((event, index) => {
        responseMessage += `${index + 1}. **${event.title}**\n`;
        responseMessage += `   📅 ${this.formatDate(event.event_date)}\n`;
        responseMessage += `   📍 ${event.location || "TBA"}\n`;
        if (event.description) {
          responseMessage += `   ℹ️ ${event.description.substring(0, 100)}${
            event.description.length > 100 ? "..." : ""
          }\n`;
        }
        responseMessage += `\n`;
      });

      if (events.length > 5) {
        responseMessage += `...and ${events.length - 5} more events.`;
      }

      return {
        success: true,
        message: responseMessage,
        data: events,
        suggestions: ["Show my appointments", "What else can you help with?"],
      };
    } catch (error) {
      logger.error("Error handling event query:", error);
      return {
        success: false,
        message:
          "I'm having trouble fetching events right now. Please try again later.",
        error: error.message,
      };
    }
  }

  /**
   * Handle greeting professionally
   */
  handleGreeting(userName, userRole) {
    const currentHour = new Date().getHours();
    let timeGreeting = "Hello";

    if (currentHour < 12) {
      timeGreeting = "Good morning";
    } else if (currentHour < 17) {
      timeGreeting = "Good afternoon";
    } else {
      timeGreeting = "Good evening";
    }

    const greeting = `${timeGreeting} ${userName}! I'm your RP Community assistant. How can I help you today?`;

    return {
      success: true,
      message: greeting,
      suggestions: [
        "Show my appointments",
        "What events are coming up?",
        "Help"
      ],
    };
  }

  /**
   * Handle help request professionally
   */
  handleHelp(userRole) {
    let helpMessage = "**RP Community Assistant**\n\n";

    if (userRole === "student") {
      helpMessage += "I can help you with:\n\n";
      helpMessage += "📅 **Appointments**: Check your schedule and upcoming meetings\n";
      helpMessage += "🎉 **Events**: View campus events and activities\n\n";
      helpMessage += "**Try asking:**\n";
      helpMessage += "• 'Show my appointments'\n";
      helpMessage += "• 'What events are happening this week?'\n";
      helpMessage += "• 'Do I have any appointments today?'\n";
    } else {
      helpMessage += "I can help you with appointments and events. Ask me about your schedule or campus activities.";
    }

    return {
      success: true,
      message: helpMessage,
      suggestions: [
        "Show my appointments",
        "What events are coming up?"
      ],
    };
  }

  /**
   * Handle small talk
   */
  handleSmallTalk() {
    const responses = [
      "Oh wow, I'm absolutely thrilled that you asked! 😊 I'm having such a great time helping people today! How are YOU feeling? What's going on in your world?",
      "I'm feeling absolutely fantastic! Like, genuinely excited to be talking with you right now! 😄 How's your day been treating you?",
      "You know what? You asking how I am just made my day even better! 🌟 I'm doing wonderfully, thank you! Tell me about yourself - what brings you here?",
      "I'm having the most amazing time! Every conversation I have makes me so happy! 🎉 How are you doing? Really, I want to know!",
      "I'm doing incredibly well! Your kindness in asking just brightened my entire existence! ✨ What's your story? I'd love to hear it!",
      "Oh my goodness, I'm so excited to be chatting with you! 🚀 My day has been absolutely wonderful - helping people is my passion! How can I make YOUR day better?",
    ];

    return {
      success: true,
      message: responses[Math.floor(Math.random() * responses.length)],
      suggestions: [
        "Tell me about yourself",
        "How do you feel about helping people?",
        "Tell me a joke",
        "What makes you happy?",
        "Help me with scheduling",
      ],
    };
  }

  /**
   * Handle thanks
   */
  handleThanks() {
    const responses = [
      "You're so welcome! 😊 I'm always happy to help!",
      "Anytime! That's what I'm here for! 🌟",
      "My pleasure! Feel free to ask me anything else! 🚀",
      "You're very welcome! I'm here whenever you need me! 💫",
    ];

    return {
      success: true,
      message: responses[Math.floor(Math.random() * responses.length)],
      suggestions: ["Show my appointments", "What else can you do?", "Goodbye"],
    };
  }

  /**
   * Handle goodbye
   */
  handleGoodbye() {
    const responses = [
      "Goodbye! Have a wonderful day! 😊 Feel free to come back anytime!",
      "See you later! Take care and have an amazing day! 🌟",
      "Bye for now! I'll be here whenever you need help! 💫",
      "Farewell! Wishing you a fantastic day ahead! 🚀",
    ];

    return {
      success: true,
      message: responses[Math.floor(Math.random() * responses.length)],
      suggestions: [],
    };
  }

  /**
   * Handle weather queries gracefully
   */
  handleWeather() {
    return {
      success: true,
      message:
        "I wish I could check the weather for you! 🌤️ I'm great with appointments and events, but for weather updates, I'd recommend checking your favorite weather app. Is there anything else I can help you with?",
      suggestions: [
        "Show my appointments",
        "What events are coming up?",
        "Tell me a joke",
      ],
    };
  }

  /**
   * Handle jokes
   */
  handleJoke() {
    const joke = this.jokes[Math.floor(Math.random() * this.jokes.length)];

    return {
      success: true,
      message: joke,
      suggestions: [
        "Another joke!",
        "Show my appointments",
        "What events are coming up?",
      ],
    };
  }

  /**
   * Handle compliments
   */
  handleCompliment() {
    const response =
      this.complimentResponses[
        Math.floor(Math.random() * this.complimentResponses.length)
      ];

    return {
      success: true,
      message: response,
      suggestions: [
        "Tell me a joke",
        "Show my appointments",
        "What can you help with?",
      ],
    };
  }

  /**
   * Handle trivia and interesting facts
   */
  handleTrivia() {
    const response =
      this.interestingFacts[
        Math.floor(Math.random() * this.interestingFacts.length)
      ];

    return {
      success: true,
      message: response,
      suggestions: [
        "Tell me another fact",
        "Tell me a joke",
        "Show my appointments",
        "Help",
      ],
    };
  }

  /**
   * Handle unknown queries with more personality
   */
  handleUnknown() {
    const responses = [
      "Hmm, I'm not quite sure about that one! 🤔 But I'd love to help with appointments, events, or just chat! What would you like to know?",
      "That's an interesting question! 😅 I'm still learning, but I'm great with appointments and events. What can I help you with?",
      "I apologize, I don't have information about that yet! 🌟 But I'm excellent with scheduling and events. How can I assist you?",
      "You caught me there! 😄 I'm still expanding my knowledge, but I'm fantastic with appointments and campus events. What would you like to explore?",
    ];

    return {
      success: true,
      message: responses[Math.floor(Math.random() * responses.length)],
      suggestions: [
        "Show my appointments",
        "What events are coming up?",
        "Tell me a joke",
        "What can you help with?",
      ],
    };
  }

  /**
   * Main method to process user queries with enhanced conversation handling
   */
  async processQuery(userId, message, userName, userRole) {
    try {
      const intent = this.detectIntent(message);

      logger.info(
        `Chatbot processing query - User: ${userId}, Role: ${userRole}, Intent: ${intent}`
      );

      switch (intent) {
        case "greeting":
          return this.handleGreeting(userName, userRole);

        case "help":
          return this.handleHelp(userRole);

        case "appointments":
          return await this.handleAppointmentQuery(userId, message, userRole);

        case "events":
          return await this.handleEventQuery(userId, message, userRole);

        default:
          return this.handleUnknown();
      }
    } catch (error) {
      logger.error("Error processing chatbot query:", error);
      return {
        success: false,
        message:
          "I encountered an error while processing your request. Please try again.",
        error: error.message,
        suggestions: ["Try again", "Help", "Show my appointments"],
      };
    }
  }
}

module.exports = new ChatbotService();
