/**
 * Seed script: creates the company Owner, demo departments, a manager and a
 * couple of employees plus sample tasks so the app is usable immediately.
 *
 *   npm run seed
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Department } from '../models/Department.js';
import { Task } from '../models/Task.js';
import { Settings } from '../models/Settings.js';
import { Performance } from '../models/Performance.js';
import { calculateUserPerformance } from '../services/performanceService.js';
import { ROLES, TASK_PRIORITY, TASK_STATUS } from '../config/constants.js';
import { logger } from './logger.js';

const run = async () => {
  await connectDB();
  logger.info('Seeding database...');

  await Promise.all([
    User.deleteMany({}),
    Department.deleteMany({}),
    Task.deleteMany({}),
    Performance.deleteMany({}),
    Settings.deleteMany({}),
  ]);

  await Settings.getSingleton();

  const owner = await User.create({
    name: process.env.SEED_OWNER_NAME || 'HLG Owner',
    email: process.env.SEED_OWNER_EMAIL || 'owner@hlg.com',
    password: process.env.SEED_OWNER_PASSWORD || 'Owner@12345',
    role: ROLES.OWNER,
  });

  const deptDefs = [
    { name: 'IT', color: '#6366f1' },
    { name: 'Marketing', color: '#ec4899' },
    { name: 'Sales', color: '#22c55e' },
    { name: 'HR', color: '#f59e0b' },
    { name: 'Operations', color: '#06b6d4' },
  ];
  const departments = await Department.insertMany(
    deptDefs.map((d) => ({ ...d, createdBy: owner._id }))
  );
  const itDept = departments[0];

  const manager = await User.create({
    name: 'Manager Mike',
    email: 'manager@hlg.com',
    password: 'Manager@123',
    role: ROLES.MANAGER,
    department: itDept._id,
    createdBy: owner._id,
  });

  const employees = await User.create([
    { name: 'Employee Eva', email: 'eva@hlg.com', password: 'Employee@123', role: ROLES.EMPLOYEE, department: itDept._id, createdBy: owner._id },
    { name: 'Employee Sam', email: 'sam@hlg.com', password: 'Employee@123', role: ROLES.EMPLOYEE, department: itDept._id, createdBy: owner._id },
  ]);

  const sampleTasks = [
    {
      title: 'Set up CI/CD pipeline',
      description: 'Configure GitHub Actions for automated tests and deploys.',
      priority: TASK_PRIORITY.HIGH,
      status: TASK_STATUS.IN_PROGRESS,
      assignedBy: manager._id,
      assignedTo: [employees[0]._id],
      department: itDept._id,
      dueDate: new Date(Date.now() + 3 * 864e5),
      estimatedHours: 8,
      startDate: new Date(),
      tags: ['devops', 'infrastructure'],
      checklist: [
        { text: 'Add workflow file' },
        { text: 'Configure secrets' },
        { text: 'Test deploy' },
      ],
    },
    {
      title: 'Design new landing page',
      description: 'Mockups + responsive implementation for the marketing site.',
      priority: TASK_PRIORITY.CRITICAL,
      status: TASK_STATUS.PENDING,
      assignedBy: manager._id,
      assignedTo: [employees[1]._id],
      department: departments[1]._id,
      dueDate: new Date(Date.now() - 864e5), // overdue sample
      estimatedHours: 12,
      tags: ['design', 'frontend'],
    },
    {
      title: 'Quarterly sales report',
      description: 'Compile Q2 numbers and present to leadership.',
      priority: TASK_PRIORITY.MEDIUM,
      status: TASK_STATUS.COMPLETED,
      assignedBy: owner._id,
      assignedTo: [employees[0]._id],
      department: departments[2]._id,
      dueDate: new Date(Date.now() - 5 * 864e5),
      startDate: new Date(Date.now() - 8 * 864e5),
      completedDate: new Date(Date.now() - 6 * 864e5),
      estimatedHours: 6,
      actualHours: 5,
    },
  ];
  await Task.insertMany(sampleTasks);

  for (const u of [owner, manager, ...employees]) {
    // eslint-disable-next-line no-await-in-loop
    await calculateUserPerformance(u._id);
  }

  logger.info('Seed complete. Login credentials:');
  logger.info(`  Owner    -> ${owner.email} / ${process.env.SEED_OWNER_PASSWORD || 'Owner@12345'}`);
  logger.info('  Manager  -> manager@hlg.com / Manager@123');
  logger.info('  Employee -> eva@hlg.com / Employee@123');

  await mongoose.connection.close();
  process.exit(0);
};

run().catch((err) => {
  logger.error(`Seed failed: ${err.message}`);
  process.exit(1);
});
