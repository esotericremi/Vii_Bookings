#!/usr/bin/env node

/**
 * Script to generate TypeScript types from Supabase schema
 * This script can be run to update the database types after schema changes
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const TYPES_FILE = path.join(__dirname, '../src/types/database.ts');

async function generateTypes() {
    try {
        console.log('🔄 Generating TypeScript types from Supabase schema...');

        // Check if supabase CLI is installed
        try {
            execSync('supabase --version', { stdio: 'ignore' });
        } catch (error) {
            console.error('❌ Supabase CLI is not installed. Please install it first:');
            console.error('npm install -g supabase');
            process.exit(1);
        }

        // Generate types using Supabase CLI
        const command = 'supabase gen types typescript --local > src/types/database.generated.ts';

        try {
            execSync(command, { stdio: 'inherit' });
            console.log('✅ Types generated successfully!');

            // Check if the generated file exists
            const generatedFile = path.join(__dirname, '../src/types/database.generated.ts');
            if (fs.existsSync(generatedFile)) {
                console.log('📁 Generated types saved to: src/types/database.generated.ts');
                console.log('');
                console.log('📝 To use the generated types:');
                console.log('1. Review the generated file');
                console.log('2. Update your imports to use the new types');
                console.log('3. Replace the existing database.ts file if needed');
            }

        } catch (error) {
            console.error('❌ Failed to generate types. Make sure you have:');
            console.error('1. Supabase project linked (supabase link)');
            console.error('2. Local Supabase instance running (supabase start)');
            console.error('3. Database migrations applied (supabase db push)');
            console.error('');
            console.error('Error details:', error.message);
        }

    } catch (error) {
        console.error('❌ Unexpected error:', error.message);
        process.exit(1);
    }
}

// Add to package.json scripts section
function updatePackageJson() {
    const packageJsonPath = path.join(__dirname, '../package.json');

    if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

        if (!packageJson.scripts) {
            packageJson.scripts = {};
        }

        packageJson.scripts['generate-types'] = 'node scripts/generate-types.js';
        packageJson.scripts['db:types'] = 'supabase gen types typescript --local > src/types/database.generated.ts';

        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
        console.log('📦 Added generate-types script to package.json');
    }
}

// Run the script
if (require.main === module) {
    generateTypes();
    updatePackageJson();
}