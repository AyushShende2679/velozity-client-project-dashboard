import { PrismaClient, Role, TaskStatus, TaskPriority, NotificationType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing existing data...');
  await prisma.notification.deleteMany();
  await prisma.taskActivityLog.deleteMany();
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.client.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

  console.log('Seeding users...');
  const passwordHash = await bcrypt.hash('Password123!', 10);

  // 1 Admin
  const admin = await prisma.user.create({
    data: {
      email: 'admin@velozity.com',
      passwordHash,
      name: 'System Admin',
      role: Role.ADMIN,
    },
  });

  // 2 Project Managers
  const pm1 = await prisma.user.create({
    data: {
      email: 'sarah.pm@velozity.com',
      passwordHash,
      name: 'Sarah Chen',
      role: Role.PROJECT_MANAGER,
    },
  });

  const pm2 = await prisma.user.create({
    data: {
      email: 'marcus.pm@velozity.com',
      passwordHash,
      name: 'Marcus Vance',
      role: Role.PROJECT_MANAGER,
    },
  });

  // 4 Developers
  const dev1 = await prisma.user.create({
    data: {
      email: 'ravi.dev@velozity.com',
      passwordHash,
      name: 'Ravi Kumar',
      role: Role.DEVELOPER,
    },
  });

  const dev2 = await prisma.user.create({
    data: {
      email: 'elena.dev@velozity.com',
      passwordHash,
      name: 'Elena Rostova',
      role: Role.DEVELOPER,
    },
  });

  const dev3 = await prisma.user.create({
    data: {
      email: 'alex.dev@velozity.com',
      passwordHash,
      name: 'Alex Johnson',
      role: Role.DEVELOPER,
    },
  });

  const dev4 = await prisma.user.create({
    data: {
      email: 'priya.dev@velozity.com',
      passwordHash,
      name: 'Priya Sharma',
      role: Role.DEVELOPER,
    },
  });

  console.log('Seeding clients...');
  const clientAcme = await prisma.client.create({
    data: {
      name: 'Acme Corporation',
      email: 'contact@acme.corp',
      company: 'Acme Corp',
    },
  });

  const clientApex = await prisma.client.create({
    data: {
      name: 'Apex Global Logistics',
      email: 'billing@apexglobal.io',
      company: 'Apex Logistics',
    },
  });

  const clientHorizon = await prisma.client.create({
    data: {
      name: 'Horizon MedTech',
      email: 'ops@horizonmed.com',
      company: 'Horizon Health Solutions',
    },
  });

  console.log('Seeding projects...');
  // Project 1: Sarah Chen (PM 1)
  const project1 = await prisma.project.create({
    data: {
      title: 'Enterprise Cloud Migration',
      description: 'Zero-downtime infrastructure migration to AWS with automated Terraform pipelines.',
      clientId: clientAcme.id,
      ownerId: pm1.id,
    },
  });

  // Project 2: Sarah Chen (PM 1)
  const project2 = await prisma.project.create({
    data: {
      title: 'Real-Time Telemetry Platform',
      description: 'Distributed WebSocket ingestion pipeline for IoT fleet metrics processing.',
      clientId: clientApex.id,
      ownerId: pm1.id,
    },
  });

  // Project 3: Marcus Vance (PM 2)
  const project3 = await prisma.project.create({
    data: {
      title: 'AI Analytics Microservice',
      description: 'High-throughput inference endpoints with caching and token usage tracking.',
      clientId: clientHorizon.id,
      ownerId: pm2.id,
    },
  });

  console.log('Seeding tasks...');
  const now = new Date();
  const pastThreeDays = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const pastFiveDays = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
  const inTwoDays = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
  const inFiveDays = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
  const inTenDays = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);

  // Project 1 Tasks (6 tasks, 1 overdue)
  const task1_1 = await prisma.task.create({
    data: {
      title: 'Architect VPC Subnets and NAT Gateways',
      description: 'Set up multi-AZ redundancy and CIDR block segmentation.',
      status: TaskStatus.DONE,
      priority: TaskPriority.HIGH,
      isOverdue: false,
      dueDate: inTwoDays,
      projectId: project1.id,
      assignedToId: dev1.id,
    },
  });

  const task1_2 = await prisma.task.create({
    data: {
      title: 'Configure PostgreSQL RDS Multi-AZ Replication',
      description: 'Implement read-replicas and verify failover drills.',
      status: TaskStatus.IN_REVIEW,
      priority: TaskPriority.CRITICAL,
      isOverdue: false,
      dueDate: inFiveDays,
      projectId: project1.id,
      assignedToId: dev1.id,
    },
  });

  const task1_3 = await prisma.task.create({
    data: {
      title: 'Legacy Database Schema Audit & Backup',
      description: 'Export sanitized snapshot of legacy records before cutoff.',
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.HIGH,
      isOverdue: true, // Overdue task 1
      dueDate: pastThreeDays,
      projectId: project1.id,
      assignedToId: dev2.id,
    },
  });

  const task1_4 = await prisma.task.create({
    data: {
      title: 'Deploy Kubernetes EKS Cluster with Karpenter',
      description: 'Configure auto-scaling node pools based on CPU/RAM thresholds.',
      status: TaskStatus.TO_DO,
      priority: TaskPriority.MEDIUM,
      isOverdue: false,
      dueDate: inTenDays,
      projectId: project1.id,
      assignedToId: dev3.id,
    },
  });

  const task1_5 = await prisma.task.create({
    data: {
      title: 'Implement Terraform State Locking with DynamoDB',
      description: 'Prevent concurrent workspace operations during deployment.',
      status: TaskStatus.DONE,
      priority: TaskPriority.LOW,
      isOverdue: false,
      dueDate: inTwoDays,
      projectId: project1.id,
      assignedToId: dev1.id,
    },
  });

  const task1_6 = await prisma.task.create({
    data: {
      title: 'Zero-Trust Bastion Host Provisioning',
      description: 'Enforce SSM session manager tunneling without public IP exposure.',
      status: TaskStatus.TO_DO,
      priority: TaskPriority.MEDIUM,
      isOverdue: false,
      dueDate: inFiveDays,
      projectId: project1.id,
      assignedToId: dev2.id,
    },
  });

  // Project 2 Tasks (5 tasks, 1 overdue)
  const task2_1 = await prisma.task.create({
    data: {
      title: 'WebSocket Connection Throttling & Heartbeat',
      description: 'Implement exponential backoff and connection eviction on stale pings.',
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.CRITICAL,
      isOverdue: false,
      dueDate: inTwoDays,
      projectId: project2.id,
      assignedToId: dev2.id,
    },
  });

  const task2_2 = await prisma.task.create({
    data: {
      title: 'Time-Series Data Downsampling Pipeline',
      description: 'Aggregate 1-second telemetry into 1-minute rollup buckets.',
      status: TaskStatus.TO_DO,
      priority: TaskPriority.HIGH,
      isOverdue: true, // Overdue task 2
      dueDate: pastFiveDays,
      projectId: project2.id,
      assignedToId: dev3.id,
    },
  });

  const task2_3 = await prisma.task.create({
    data: {
      title: 'Kafka Consumer Group Rebalance Optimization',
      description: 'Tune partition assignments to minimize latency spikes.',
      status: TaskStatus.IN_REVIEW,
      priority: TaskPriority.HIGH,
      isOverdue: false,
      dueDate: inFiveDays,
      projectId: project2.id,
      assignedToId: dev4.id,
    },
  });

  const task2_4 = await prisma.task.create({
    data: {
      title: 'Client Dashboard Metric Cards UI',
      description: 'Display live CPU, Memory, and Latency percentile gauges.',
      status: TaskStatus.DONE,
      priority: TaskPriority.MEDIUM,
      isOverdue: false,
      dueDate: inTwoDays,
      projectId: project2.id,
      assignedToId: dev2.id,
    },
  });

  const task2_5 = await prisma.task.create({
    data: {
      title: 'Anomaly Detection Alerting Rules',
      description: 'Trigger PagerDuty alerts when 5xx rate exceeds 1% over 5 mins.',
      status: TaskStatus.TO_DO,
      priority: TaskPriority.LOW,
      isOverdue: false,
      dueDate: inTenDays,
      projectId: project2.id,
      assignedToId: dev4.id,
    },
  });

  // Project 3 Tasks (6 tasks)
  const task3_1 = await prisma.task.create({
    data: {
      title: 'OpenAPI Schema & Semantic Caching Layer',
      description: 'Cache embedding query responses with Redis vector similarity index.',
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.HIGH,
      isOverdue: false,
      dueDate: inTwoDays,
      projectId: project3.id,
      assignedToId: dev4.id,
    },
  });

  const task3_2 = await prisma.task.create({
    data: {
      title: 'Prompt Injection Sanitization Middleware',
      description: 'Filter adversarial prompt suffixes before proxying to LLM provider.',
      status: TaskStatus.IN_REVIEW,
      priority: TaskPriority.CRITICAL,
      isOverdue: false,
      dueDate: inFiveDays,
      projectId: project3.id,
      assignedToId: dev1.id,
    },
  });

  const task3_3 = await prisma.task.create({
    data: {
      title: 'Token Usage & Cost Attribution Tracking',
      description: 'Record completion token consumption per tenant in PostgreSQL.',
      status: TaskStatus.DONE,
      priority: TaskPriority.MEDIUM,
      isOverdue: false,
      dueDate: inTwoDays,
      projectId: project3.id,
      assignedToId: dev3.id,
    },
  });

  const task3_4 = await prisma.task.create({
    data: {
      title: 'Streaming Response Chunk Parser',
      description: 'Decode SSE buffer stream into seamless frontend markdown chunks.',
      status: TaskStatus.TO_DO,
      priority: TaskPriority.HIGH,
      isOverdue: false,
      dueDate: inTenDays,
      projectId: project3.id,
      assignedToId: dev4.id,
    },
  });

  const task3_5 = await prisma.task.create({
    data: {
      title: 'Model Failover Circuit Breaker',
      description: 'Automatically route requests to backup model if latency > 3000ms.',
      status: TaskStatus.TO_DO,
      priority: TaskPriority.MEDIUM,
      isOverdue: false,
      dueDate: inFiveDays,
      projectId: project3.id,
      assignedToId: dev2.id,
    },
  });

  const task3_6 = await prisma.task.create({
    data: {
      title: 'End-to-End Latency Tracing with OpenTelemetry',
      description: 'Add trace headers spanning gateway to vector search and model API.',
      status: TaskStatus.DONE,
      priority: TaskPriority.LOW,
      isOverdue: false,
      dueDate: inTwoDays,
      projectId: project3.id,
      assignedToId: dev3.id,
    },
  });

  console.log('Seeding activity logs...');
  const tenMinsAgo = new Date(now.getTime() - 10 * 60 * 1000);
  const thirtyMinsAgo = new Date(now.getTime() - 30 * 60 * 1000);
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  await prisma.taskActivityLog.createMany({
    data: [
      {
        taskId: task1_2.id,
        projectId: project1.id,
        userId: dev1.id,
        fromStatus: TaskStatus.IN_PROGRESS,
        toStatus: TaskStatus.IN_REVIEW,
        message: `${dev1.name} moved Task #${task1_2.taskNumber} from In Progress → In Review`,
        createdAt: tenMinsAgo,
      },
      {
        taskId: task1_1.id,
        projectId: project1.id,
        userId: dev1.id,
        fromStatus: TaskStatus.IN_PROGRESS,
        toStatus: TaskStatus.DONE,
        message: `${dev1.name} moved Task #${task1_1.taskNumber} from In Progress → Done`,
        createdAt: thirtyMinsAgo,
      },
      {
        taskId: task2_1.id,
        projectId: project2.id,
        userId: dev2.id,
        fromStatus: TaskStatus.TO_DO,
        toStatus: TaskStatus.IN_PROGRESS,
        message: `${dev2.name} moved Task #${task2_1.taskNumber} from To Do → In Progress`,
        createdAt: twoHoursAgo,
      },
      {
        taskId: task2_3.id,
        projectId: project2.id,
        userId: dev4.id,
        fromStatus: TaskStatus.IN_PROGRESS,
        toStatus: TaskStatus.IN_REVIEW,
        message: `${dev4.name} moved Task #${task2_3.taskNumber} from In Progress → In Review`,
        createdAt: yesterday,
      },
      {
        taskId: task3_2.id,
        projectId: project3.id,
        userId: dev1.id,
        fromStatus: TaskStatus.IN_PROGRESS,
        toStatus: TaskStatus.IN_REVIEW,
        message: `${dev1.name} moved Task #${task3_2.taskNumber} from In Progress → In Review`,
        createdAt: twoHoursAgo,
      },
    ],
  });

  console.log('Seeding initial notifications...');
  await prisma.notification.createMany({
    data: [
      {
        recipientId: dev1.id,
        title: 'New Task Assignment',
        message: `You have been assigned to Task #${task1_2.taskNumber}: ${task1_2.title}`,
        type: NotificationType.TASK_ASSIGNED,
        referenceId: task1_2.id,
        isRead: false,
        createdAt: thirtyMinsAgo,
      },
      {
        recipientId: pm1.id,
        title: 'Task Moved to In Review',
        message: `${dev1.name} moved Task #${task1_2.taskNumber} to In Review in ${project1.title}`,
        type: NotificationType.TASK_IN_REVIEW,
        referenceId: task1_2.id,
        isRead: false,
        createdAt: tenMinsAgo,
      },
      {
        recipientId: dev2.id,
        title: 'New Task Assignment',
        message: `You have been assigned to Task #${task2_1.taskNumber}: ${task2_1.title}`,
        type: NotificationType.TASK_ASSIGNED,
        referenceId: task2_1.id,
        isRead: false,
        createdAt: twoHoursAgo,
      },
    ],
  });

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
