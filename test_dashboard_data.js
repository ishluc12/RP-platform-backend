const axios = require('axios');
require('dotenv').config();

const BASE_URL = 'http://localhost:5000';

async function testDashboardData() {
    console.log('=== LECTURER DASHBOARD DATA TEST ===\n');
    
    // Test login first to get a token
    try {
        const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
            email: 'lecturer@rpu.edu.ph', // Adjust this to match a test lecturer account
            password: 'password123' // Adjust this to match the test password
        });
        
        if (!loginResponse.data.success) {
            console.log('❌ Login failed, trying alternative credentials...');
            // Try with a different lecturer account
            const altLoginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
                email: 'john.lecturer@rpu.edu.ph',
                password: 'securepass123'
            });
            
            if (!altLoginResponse.data.success) {
                console.log('❌ Could not login with any lecturer account');
                return;
            }
            
            loginResponse.data = altLoginResponse.data;
        }
        
        const token = loginResponse.data.data.token;
        const user = loginResponse.data.data.user;
        
        console.log('✅ Successfully logged in as:', user.name);
        console.log('📧 Email:', user.email);
        console.log('🔑 Role:', user.role);
        console.log('');
        
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
        
        // Test dashboard summary
        console.log('📊 Testing Dashboard Summary...');
        const summaryResponse = await axios.get(`${BASE_URL}/api/lecturer/dashboard/summary`, { headers });
        
        if (summaryResponse.data.success) {
            const summary = summaryResponse.data.data;
            console.log('✅ Dashboard summary retrieved successfully:');
            console.log('   📅 Total Appointments:', summary.totalAppointments);
            console.log('   ⏳ Pending Appointments:', summary.pendingAppointments);
            console.log('   📈 Upcoming Appointments:', summary.upcomingAppointments);
            console.log('   ✅ Completed Appointments:', summary.completedAppointments);
            console.log('   ❌ Cancelled Appointments:', summary.cancelledAppointments);
            console.log('   🎓 Total Students:', summary.totalStudents);
            console.log('   📌 Events Created:', summary.eventsCreated);
            console.log('   🕐 Generated At:', summary.generatedAt);
        } else {
            console.log('❌ Dashboard summary failed:', summaryResponse.data.message);
        }
        
        console.log('');
        
        // Test recent appointments
        console.log('📋 Testing Recent Appointments...');
        const appointmentsResponse = await axios.get(`${BASE_URL}/api/lecturer/dashboard/recent-appointments?limit=10`, { headers });
        
        if (appointmentsResponse.data.success) {
            const appointments = appointmentsResponse.data.data;
            console.log(`✅ Recent appointments retrieved successfully (${appointments.length} found):`);
            
            appointments.forEach((apt, index) => {
                console.log(`   ${index + 1}. ${apt.studentName || apt.requesterName || 'Unknown'}`);
                console.log(`      📅 Date: ${apt.displayDate || 'Invalid Date'}`);
                console.log(`      🕐 Time: ${apt.displayTime || 'Invalid Time'}`);
                console.log(`      📊 Status: ${apt.status}`);
                console.log(`      📝 Purpose: ${apt.purpose || 'No purpose specified'}`);
                console.log('');
            });
        } else {
            console.log('❌ Recent appointments failed:', appointmentsResponse.data.message);
        }
        
        // Test recent students
        console.log('👥 Testing Recent Students...');
        const studentsResponse = await axios.get(`${BASE_URL}/api/lecturer/dashboard/recent-students?limit=5`, { headers });
        
        if (studentsResponse.data.success) {
            const students = studentsResponse.data.data;
            console.log(`✅ Recent students retrieved successfully (${students.length} found):`);
            
            students.forEach((student, index) => {
                console.log(`   ${index + 1}. ${student.name || 'Unknown Student'}`);
                console.log(`      📧 Email: ${student.email || 'No email'}`);
                console.log(`      🆔 ID: ${student.id}`);
                console.log('');
            });
        } else {
            console.log('❌ Recent students failed:', studentsResponse.data.message);
        }
        
    } catch (error) {
        console.log('❌ Test failed with error:');
        console.log('Error:', error.message);
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Response:', error.response.data);
        }
    }
}

// Run the test
testDashboardData().catch(console.error);