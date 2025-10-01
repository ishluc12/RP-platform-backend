/**
 * Utility functions for handling user data across the application
 * This ensures consistent user name and data extraction from various API response formats
 */

/**
 * Safely extracts a user's name from various possible data structures
 * Handles both snake_case and camelCase property names
 * 
 * @param {Object} data - User data object from API
 * @param {string} fallback - Fallback name if no name found (default: 'Unknown User')
 * @returns {string} - User's name or fallback
 */
export const getSafeName = (data, fallback = 'Unknown User') => {
    if (!data) return fallback;

    // Try all possible name fields in order of preference
    const name = data.name ||
        data.user_name ||
        data.userName ||
        data.sender_name ||
        data.senderName ||
        data.other_user_name ||
        data.otherUserName ||
        data.full_name ||
        data.fullName;

    if (name && name.trim()) return name.trim();

    // Try to construct name from first and last name
    const firstName = data.first_name || data.firstName || '';
    const lastName = data.last_name || data.lastName || '';
    const constructedName = `${firstName} ${lastName}`.trim();

    return constructedName || fallback;
};

/**
 * Gets display name for any user object
 * Alias for getSafeName for backward compatibility
 * 
 * @param {Object} user - User object
 * @returns {string} - Display name
 */
export const getDisplayName = (user) => {
    return getSafeName(user);
};

/**
 * Gets the sender name from a message object
 * Handles various message structures from different API endpoints
 * 
 * @param {Object} message - Message object
 * @returns {string} - Sender's name
 */
export const getMessageSenderName = (message) => {
    if (!message) return 'Unknown User';

    // Check if sender object exists and extract name from it
    if (message.sender && typeof message.sender === 'object') {
        return getSafeName(message.sender);
    }

    // Check direct message properties for sender name
    return message.sender_name ||
        message.senderName ||
        message.user_name ||
        message.userName ||
        'Unknown User';
};

/**
 * Gets conversation user name (for direct conversations)
 * 
 * @param {Object} conversation - Conversation object
 * @returns {string} - Other user's name
 */
export const getConversationUserName = (conversation) => {
    if (!conversation) return 'Unknown User';

    return conversation.other_user_name ||
        conversation.otherUserName ||
        conversation.name ||
        conversation.user_name ||
        conversation.userName ||
        'Unknown User';
};

/**
 * Gets initials from a name for avatar display
 * 
 * @param {string} name - Full name
 * @returns {string} - Initials (max 2 characters)
 */
export const getInitials = (name) => {
    if (!name || typeof name !== 'string') return 'U';

    const cleaned = name.trim();
    if (!cleaned) return 'U';

    const words = cleaned.split(/\s+/);

    if (words.length === 1) {
        // Single word: return first 2 characters
        return cleaned.substring(0, 2).toUpperCase();
    }

    // Multiple words: return first letter of first two words
    return (words[0][0] + words[1][0]).toUpperCase();
};

/**
 * Gets profile picture URL with fallback to ui-avatars
 * 
 * @param {Object} data - User/message data object
 * @param {string} name - Name for fallback avatar
 * @returns {string} - Profile picture URL
 */
export const getProfilePicture = (data, name = 'Unknown User') => {
    if (!data) {
        return `https://ui-avatars.io/api/?name=${encodeURIComponent(name)}&background=6366f1&color=ffffff&size=128`;
    }

    // Try all possible profile picture fields
    const picture = data.profile_picture ||
        data.profilePicture ||
        data.sender_profile_picture ||
        data.senderProfilePicture ||
        data.other_user_profile_picture ||
        data.otherUserProfilePicture ||
        data.avatar ||
        data.image;

    // If picture exists and is not already a ui-avatars URL, return it
    if (picture && !picture.includes('ui-avatars.io')) {
        return picture;
    }

    // Generate fallback avatar
    return `https://ui-avatars.io/api/?name=${encodeURIComponent(name)}&background=6366f1&color=ffffff&size=128`;
};

/**
 * Formats user data into a consistent structure
 * Useful for normalizing API responses
 * 
 * @param {Object} userData - Raw user data from API
 * @returns {Object} - Normalized user data
 */
export const formatUserData = (userData) => {
    if (!userData) return null;

    const name = getSafeName(userData);

    return {
        id: userData.id,
        name: name,
        email: userData.email,
        role: userData.role || userData.user_role || userData.userRole,
        profilePicture: getProfilePicture(userData, name),
        initials: getInitials(name),
        // Preserve original data
        ...userData
    };
};

/**
 * Extracts user ID from various possible fields
 * 
 * @param {Object} data - Data object that might contain user ID
 * @returns {number|string|null} - User ID or null
 */
export const getUserId = (data) => {
    if (!data) return null;

    return data.id ||
        data.user_id ||
        data.userId ||
        data.sender_id ||
        data.senderId ||
        null;
};

/**
 * Checks if a user object has valid data
 * 
 * @param {Object} user - User object to validate
 * @returns {boolean} - True if user has minimum valid data
 */
export const isValidUser = (user) => {
    return user && (user.id || user.user_id || user.userId) && getSafeName(user) !== 'Unknown User';
};

/**
 * Formats a timestamp to a readable date/time string
 * 
 * @param {string|Date} timestamp - Timestamp to format
 * @param {Object} options - Formatting options
 * @returns {string} - Formatted date string
 */
export const formatTimestamp = (timestamp, options = {}) => {
    if (!timestamp) return '';

    try {
        const date = new Date(timestamp);
        const defaultOptions = {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            ...options
        };

        return date.toLocaleString([], defaultOptions);
    } catch (error) {
        console.error('Error formatting timestamp:', error);
        return '';
    }
};

/**
 * Gets a user's online status indicator color
 * 
 * @param {string} status - User status ('online', 'away', 'offline')
 * @returns {string} - Tailwind color class
 */
export const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
        case 'online':
            return 'bg-green-500';
        case 'away':
            return 'bg-yellow-500';
        case 'busy':
            return 'bg-red-500';
        case 'offline':
        default:
            return 'bg-gray-400';
    }
};

export default {
    getSafeName,
    getDisplayName,
    getMessageSenderName,
    getConversationUserName,
    getInitials,
    getProfilePicture,
    formatUserData,
    getUserId,
    isValidUser,
    formatTimestamp,
    getStatusColor
};