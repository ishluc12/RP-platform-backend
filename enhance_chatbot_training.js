#!/usr/bin/env node

/**
 * Enhanced Chatbot Training Script
 * This script updates the chatbot with improved navigation and notification handling
 */

const fs = require('fs');
const path = require('path');

console.log('🤖 Enhancing RP Community Chatbot Training...\n');

// Paths
const originalTrainingPath = path.join(__dirname, 'data', 'training_data.json');
const enhancedTrainingPath = path.join(__dirname, 'data', 'enhanced_training_data.json');
const backupPath = path.join(__dirname, 'data', 'training_data_backup.json');

try {
    // 1. Backup original training data
    console.log('📦 Creating backup of original training data...');
    if (fs.existsSync(originalTrainingPath)) {
        const originalData = fs.readFileSync(originalTrainingPath, 'utf8');
        fs.writeFileSync(backupPath, originalData);
        console.log('✅ Backup created at:', backupPath);
    }

    // 2. Load enhanced training data
    console.log('📚 Loading enhanced training data...');
    if (!fs.existsSync(enhancedTrainingPath)) {
        console.error('❌ Enhanced training data file not found!');
        process.exit(1);
    }

    const enhancedData = JSON.parse(fs.readFileSync(enhancedTrainingPath, 'utf8'));
    console.log('✅ Enhanced training data loaded');

    // 3. Merge with existing data if it exists
    let finalData = enhancedData;
    
    if (fs.existsSync(originalTrainingPath)) {
        console.log('🔄 Merging with existing training data...');
        const originalData = JSON.parse(fs.readFileSync(originalTrainingPath, 'utf8'));
        
        // Merge intents (enhanced data takes precedence)
        finalData.intents = {
            ...originalData.intents,
            ...enhancedData.intents
        };
        
        // Merge entities if they exist
        if (originalData.entities) {
            finalData.entities = {
                ...originalData.entities,
                ...enhancedData.entities
            };
        }
        
        // Merge responses if they exist
        if (originalData.responses) {
            finalData.responses = {
                ...originalData.responses,
                ...enhancedData.responses
            };
        }
        
        console.log('✅ Data merged successfully');
    }

    // 4. Write the final training data
    console.log('💾 Writing enhanced training data...');
    fs.writeFileSync(originalTrainingPath, JSON.stringify(finalData, null, 2));
    console.log('✅ Enhanced training data written to:', originalTrainingPath);

    // 5. Display statistics
    const intentCount = Object.keys(finalData.intents).length;
    const totalExamples = Object.values(finalData.intents).reduce((total, intent) => {
        return total + (intent.examples ? intent.examples.length : 0);
    }, 0);

    console.log('\n📊 Training Data Statistics:');
    console.log(`   • Intents: ${intentCount}`);
    console.log(`   • Total Examples: ${totalExamples}`);
    console.log(`   • Entities: ${finalData.entities ? Object.keys(finalData.entities).length : 0}`);
    console.log(`   • Response Templates: ${finalData.responses ? Object.keys(finalData.responses).length : 0}`);

    // 6. List new/enhanced intents
    console.log('\n🆕 Enhanced Intents:');
    const enhancedIntents = [
        'navigation_general',
        'navigation_specific', 
        'notification_handling',
        'messages',
        'surveys',
        'notifications'
    ];
    
    enhancedIntents.forEach(intent => {
        if (finalData.intents[intent]) {
            console.log(`   ✅ ${intent} - ${finalData.intents[intent].examples.length} examples`);
        }
    });

    console.log('\n🎯 New Capabilities Added:');
    console.log('   • Enhanced navigation with specific actions');
    console.log('   • Notification click handling');
    console.log('   • Better intent recognition patterns');
    console.log('   • Role-based response customization');
    console.log('   • Contextual suggestions');
    console.log('   • Deep linking support');

    console.log('\n🚀 Next Steps:');
    console.log('   1. Restart your backend server');
    console.log('   2. The chatbot will automatically retrain with new data');
    console.log('   3. Test the enhanced navigation features');
    console.log('   4. Try notification click handling');

    console.log('\n✨ Chatbot Enhancement Complete! ✨');

} catch (error) {
    console.error('❌ Error enhancing chatbot training:', error.message);
    
    // Restore backup if something went wrong
    if (fs.existsSync(backupPath) && error.message.includes('training_data.json')) {
        console.log('🔄 Restoring backup...');
        const backupData = fs.readFileSync(backupPath, 'utf8');
        fs.writeFileSync(originalTrainingPath, backupData);
        console.log('✅ Backup restored');
    }
    
    process.exit(1);
}