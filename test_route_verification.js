/**
 * Route Verification Test
 * This script tests if the staff routes are properly mounted
 */

const express = require('express');
const app = require('./src/app.js');

// Test if routes are properly mounted
function testRouteMounting() {
    console.log('🔍 Testing Route Mounting...\n');

    // Get all registered routes
    const routes = [];

    function getRoutes(stack, prefix = '') {
        stack.forEach((middleware) => {
            if (middleware.route) {
                // Direct route
                const route = {
                    path: prefix + middleware.route.path,
                    methods: Object.keys(middleware.route.methods)
                };
                routes.push(route);
            } else if (middleware.name === 'router') {
                // Router middleware
                const routerPrefix = prefix + (middleware.regexp.source
                    .replace('\\/?', '')
                    .replace('(?=\\/|$)', '')
                    .replace(/\\\//g, '/')
                    .replace(/\\\?/g, '?')
                    .replace(/\$/, '')
                    .replace(/\(\?\=\\\/\|\$\)/, ''));

                getRoutes(middleware.handle.stack, routerPrefix);
            }
        });
    }

    getRoutes(app._router.stack);

    console.log('📋 All Registered Routes:');
    console.log('========================');

    // Filter and display staff routes
    const staffRoutes = routes.filter(route =>
        route.path.includes('/staff/') ||
        route.path.includes('/api/staff/')
    );

    if (staffRoutes.length > 0) {
        console.log('✅ Staff routes found:');
        staffRoutes.forEach(route => {
            console.log(`  ${route.methods.join(', ').toUpperCase()} ${route.path}`);
        });
    } else {
        console.log('❌ No staff routes found!');
    }

    console.log('\n📋 All API Routes:');
    console.log('==================');

    const apiRoutes = routes.filter(route =>
        route.path.includes('/api/')
    );

    apiRoutes.forEach(route => {
        console.log(`  ${route.methods.join(', ').toUpperCase()} ${route.path}`);
    });

    console.log(`\n📊 Total routes found: ${routes.length}`);
    console.log(`📊 API routes found: ${apiRoutes.length}`);
    console.log(`📊 Staff routes found: ${staffRoutes.length}`);

    return staffRoutes.length > 0;
}

// Run the test
if (require.main === module) {
    const hasStaffRoutes = testRouteMounting();

    if (hasStaffRoutes) {
        console.log('\n✅ Staff routes are properly mounted!');
    } else {
        console.log('\n❌ Staff routes are NOT mounted!');
        console.log('💡 Make sure to restart the backend server after adding routes to app.js');
    }
}

module.exports = testRouteMounting;
