import chalk from 'chalk';

import sequelize, { connectDB } from '@/config/db.config.js';
import '@/models/models.js';
import '@/models/associations.js';
import { seedRoles, seedUsers, seedCategories, seedTags, seedBlogs } from '@/seeders/index.js';

const runAllSeeders = async () => {
    try {
        console.log(chalk.cyan.bold('Connecting to database for seeding...'));
        await connectDB();

        console.log(chalk.cyan.bold('\nStarting database seeding...'));

        console.log(chalk.blue('Seeding roles...'));
        await seedRoles();

        console.log(chalk.blue('Seeding users...'));
        await seedUsers();

        console.log(chalk.blue('Seeding categories...'));
        await seedCategories();

        console.log(chalk.blue('Seeding tags...'));
        await seedTags();

        console.log(chalk.blue('Seeding blogs...'));
        await seedBlogs();

        console.log(chalk.green.bold('\nAll seeders executed successfully!'));
        await sequelize.close();
        process.exit(0);
    } catch (error) {
        console.error(chalk.red.bold('\nSeeder execution failed:'), error);
        try {
            await sequelize.close();
        } catch {
            // Ignore close error on exit
        }
        process.exit(1);
    }
};

runAllSeeders();
