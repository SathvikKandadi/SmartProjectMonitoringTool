const { PrismaClient } = require('@prisma/client');
const ExcelJS = require('exceljs');
const bcrypt = require('bcryptjs');
const fs = require('fs');

const prisma = new PrismaClient();

const DEFAULT_PASSWORD = 'default@123';

/** Normalize Excel cell value for import (similar to xlsx sheet_to_json primitives) */
function normalizeCellValue(val) {
  if (val == null || val === '') return '';
  if (typeof val === 'object' && val instanceof Date) return val;
  if (typeof val === 'object' && val.text !== undefined) return val.text;
  if (typeof val === 'object' && val.richText) {
    return val.richText.map((t) => t.text).join('');
  }
  if (typeof val === 'object' && val.hyperlink && val.text !== undefined) {
    return val.text;
  }
  if (typeof val === 'object' && Object.prototype.hasOwnProperty.call(val, 'result')) {
    return normalizeCellValue(val.result);
  }
  return val;
}

/** First row = headers; following rows = records (ExcelJS, .xlsx). */
function worksheetToProjectRows(worksheet) {
  if (!worksheet || worksheet.rowCount < 2) return [];
  const headerRow = worksheet.getRow(1);
  const headerValues = headerRow.values;
  const keys = [];
  for (let i = 1; i < (headerValues?.length || 0); i++) {
    keys[i] = String(headerValues[i] ?? '').trim();
  }
  const projectData = [];
  for (let r = 2; r <= worksheet.rowCount; r++) {
    const row = worksheet.getRow(r);
    const rowValues = row.values;
    const obj = {};
    let hasData = false;
    for (let i = 1; i < keys.length; i++) {
      const k = keys[i];
      if (!k) continue;
      const raw = rowValues[i];
      obj[k] = normalizeCellValue(raw);
      const s = typeof obj[k] === 'string' ? obj[k] : String(obj[k] ?? '');
      if (s.trim() !== '') hasData = true;
    }
    if (hasData) projectData.push(obj);
  }
  return projectData;
}

/**
 * Import data from Excel file
 * Expected format - Single Sheet "ProjectData":
 * studentName, studentEmail, groupName, leaderEmail, projectTitle, projectDescription, guideEmail
 * (.xlsx recommended; legacy .xls may not parse with this reader.)
 */
const importExcel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const results = {
      users: { created: 0, skipped: 0, errors: [] },
      groups: { created: 0, skipped: 0, errors: [] },
      groupMembers: { added: 0, skipped: 0, errors: [] },
      projects: { created: 0, skipped: 0, errors: [] }
    };

    let projectData;
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(filePath);
      const sheet = workbook.getWorksheet('ProjectData');
      if (!sheet) {
        fs.unlinkSync(filePath);
        return res.status(400).json({
          error: 'Excel file must contain a sheet named "ProjectData"'
        });
      }
      projectData = worksheetToProjectRows(sheet);
    } catch (readErr) {
      fs.unlinkSync(filePath);
      console.error('Excel read error:', readErr);
      return res.status(400).json({
        error:
          'Could not read the spreadsheet. Use a valid .xlsx file with a "ProjectData" sheet.',
        details: readErr.message
      });
    }

    if (projectData.length === 0) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ error: 'No data found in ProjectData sheet' });
    }

    // Hash the default password once
    const hashedDefaultPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);

    // Step 1: Collect all unique users (students, leaders, guides)
    const uniqueUsers = new Map();

    for (const row of projectData) {
      const { studentName, studentEmail, leaderEmail, guideEmail } = row;

      // Add student
      if (studentEmail && studentName) {
        uniqueUsers.set(studentEmail.trim().toLowerCase(), {
          name: studentName.trim(),
          email: studentEmail.trim().toLowerCase(),
          role: 'Student'
        });
      }

      // Add leader (also a student)
      if (leaderEmail && !uniqueUsers.has(leaderEmail.trim().toLowerCase())) {
        // Try to find the leader's name from the data
        const leaderRow = projectData.find(r => 
          r.studentEmail && r.studentEmail.trim().toLowerCase() === leaderEmail.trim().toLowerCase()
        );
        if (leaderRow && leaderRow.studentName) {
          uniqueUsers.set(leaderEmail.trim().toLowerCase(), {
            name: leaderRow.studentName.trim(),
            email: leaderEmail.trim().toLowerCase(),
            role: 'Student'
          });
        }
      }

      // Add guide
      if (guideEmail) {
        const guideEmailLower = guideEmail.trim().toLowerCase();
        if (!uniqueUsers.has(guideEmailLower)) {
          // Extract guide name from email or use default
          const guideName = guideEmail.split('@')[0].replace(/[._]/g, ' ').split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
          
          uniqueUsers.set(guideEmailLower, {
            name: guideName || 'Guide User',
            email: guideEmailLower,
            role: 'Guide'
          });
        }
      }
    }

    // Step 2: Create users
    for (const userData of uniqueUsers.values()) {
      try {
        const existingUser = await prisma.user.findUnique({
          where: { email: userData.email }
        });

        if (existingUser) {
          results.users.skipped++;
          continue;
        }

        await prisma.user.create({
          data: {
            name: userData.name,
            email: userData.email,
            password: hashedDefaultPassword,
            role: userData.role
          }
        });

        results.users.created++;
      } catch (error) {
        results.users.errors.push(`Error creating user ${userData.email}: ${error.message}`);
      }
    }

    // Step 3: Collect unique groups and create them
    const uniqueGroups = new Map();
    
    for (const row of projectData) {
      const { groupName, leaderEmail } = row;
      
      if (groupName && leaderEmail) {
        const groupKey = groupName.trim().toLowerCase();
        if (!uniqueGroups.has(groupKey)) {
          uniqueGroups.set(groupKey, {
            groupName: groupName.trim(),
            leaderEmail: leaderEmail.trim().toLowerCase()
          });
        }
      }
    }

    const createdGroups = new Map();

    for (const groupData of uniqueGroups.values()) {
      try {
        // Find leader
        const leader = await prisma.user.findUnique({
          where: { email: groupData.leaderEmail }
        });

        if (!leader) {
          results.groups.errors.push(
            `Leader not found for group ${groupData.groupName}: ${groupData.leaderEmail}`
          );
          continue;
        }

        // Check if group already exists
        const existingGroup = await prisma.projectGroup.findFirst({
          where: { 
            groupName: {
              equals: groupData.groupName,
              mode: 'insensitive'
            }
          }
        });

        if (existingGroup) {
          results.groups.skipped++;
          createdGroups.set(groupData.groupName.toLowerCase(), existingGroup);
          continue;
        }

        // Create group with leader as first member
        const newGroup = await prisma.projectGroup.create({
          data: {
            groupName: groupData.groupName,
            leaderId: leader.userId,
            members: {
              create: {
                userId: leader.userId,
                roleInGroup: 'Leader'
              }
            }
          }
        });

        results.groups.created++;
        createdGroups.set(groupData.groupName.toLowerCase(), newGroup);
      } catch (error) {
        results.groups.errors.push(
          `Error creating group ${groupData.groupName}: ${error.message}`
        );
      }
    }

    // Step 4: Add students to their groups
    for (const row of projectData) {
      const { studentEmail, groupName } = row;

      if (!studentEmail || !groupName) continue;

      try {
        const student = await prisma.user.findUnique({
          where: { email: studentEmail.trim().toLowerCase() }
        });

        const group = createdGroups.get(groupName.trim().toLowerCase());

        if (!student) {
          results.groupMembers.errors.push(
            `Student not found: ${studentEmail}`
          );
          continue;
        }

        if (!group) {
          results.groupMembers.errors.push(
            `Group not found: ${groupName}`
          );
          continue;
        }

        // Check if already a member
        const existingMember = await prisma.groupMember.findUnique({
          where: {
            groupId_userId: {
              groupId: group.groupId,
              userId: student.userId
            }
          }
        });

        if (existingMember) {
          results.groupMembers.skipped++;
          continue;
        }

        // Add student to group
        await prisma.groupMember.create({
          data: {
            groupId: group.groupId,
            userId: student.userId,
            roleInGroup: group.leaderId === student.userId ? 'Leader' : 'Member'
          }
        });

        results.groupMembers.added++;
      } catch (error) {
        results.groupMembers.errors.push(
          `Error adding ${studentEmail} to ${groupName}: ${error.message}`
        );
      }
    }

    // Step 5: Create unique projects for each group
    const uniqueProjects = new Map();

    for (const row of projectData) {
      const { groupName, projectTitle, projectDescription, guideEmail } = row;

      if (groupName && projectTitle) {
        const projectKey = `${groupName.trim()}_${projectTitle.trim()}`.toLowerCase();
        if (!uniqueProjects.has(projectKey)) {
          uniqueProjects.set(projectKey, {
            groupName: groupName.trim(),
            title: projectTitle.trim(),
            description: projectDescription ? projectDescription.trim() : '',
            guideEmail: guideEmail ? guideEmail.trim().toLowerCase() : null
          });
        }
      }
    }

    for (const projectData of uniqueProjects.values()) {
      try {
        const group = createdGroups.get(projectData.groupName.toLowerCase());

        if (!group) {
          results.projects.errors.push(
            `Group not found for project ${projectData.title}`
          );
          continue;
        }

        // Find guide if provided
        let guideId = null;
        if (projectData.guideEmail) {
          const guide = await prisma.user.findUnique({
            where: { email: projectData.guideEmail }
          });
          
          if (guide) {
            guideId = guide.userId;
          } else {
            results.projects.errors.push(
              `Guide not found for project ${projectData.title}: ${projectData.guideEmail}`
            );
          }
        }

        // Check if project already exists
        const existingProject = await prisma.project.findFirst({
          where: {
            groupId: group.groupId,
            title: {
              equals: projectData.title,
              mode: 'insensitive'
            }
          }
        });

        if (existingProject) {
          results.projects.skipped++;
          continue;
        }

        // Create project
        await prisma.project.create({
          data: {
            groupId: group.groupId,
            title: projectData.title,
            description: projectData.description,
            assignedGuide: guideId,
            status: 'Pending'
          }
        });

        results.projects.created++;
      } catch (error) {
        results.projects.errors.push(
          `Error creating project ${projectData.title}: ${error.message}`
        );
      }
    }

    // Delete uploaded file
    fs.unlinkSync(filePath);

    res.json({
      message: 'Import completed successfully',
      results,
      summary: {
        totalUsers: results.users.created + results.users.skipped,
        totalGroups: results.groups.created + results.groups.skipped,
        totalMembers: results.groupMembers.added + results.groupMembers.skipped,
        totalProjects: results.projects.created + results.projects.skipped
      }
    });
  } catch (error) {
    console.error('Import Excel error:', error);
    
    // Clean up file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({ 
      error: 'Failed to import Excel file',
      details: error.message 
    });
  }
};

/**
 * Download sample Excel template
 */
const downloadTemplate = async (req, res) => {
  try {
    const workbook = new ExcelJS.Workbook();

    const projectRows = [
      {
        studentName: 'John Doe',
        studentEmail: 'john.doe@college.edu',
        groupName: 'Team Alpha',
        leaderEmail: 'john.doe@college.edu',
        projectTitle: 'AI-Powered Healthcare System',
        projectDescription:
          'A machine learning system for patient diagnosis and healthcare management',
        guideEmail: 'dr.smith@college.edu'
      },
      {
        studentName: 'Jane Smith',
        studentEmail: 'jane.smith@college.edu',
        groupName: 'Team Alpha',
        leaderEmail: 'john.doe@college.edu',
        projectTitle: 'AI-Powered Healthcare System',
        projectDescription:
          'A machine learning system for patient diagnosis and healthcare management',
        guideEmail: 'dr.smith@college.edu'
      },
      {
        studentName: 'Bob Johnson',
        studentEmail: 'bob.johnson@college.edu',
        groupName: 'Team Alpha',
        leaderEmail: 'john.doe@college.edu',
        projectTitle: 'AI-Powered Healthcare System',
        projectDescription:
          'A machine learning system for patient diagnosis and healthcare management',
        guideEmail: 'dr.smith@college.edu'
      },
      {
        studentName: 'Alice Brown',
        studentEmail: 'alice.brown@college.edu',
        groupName: 'Team Beta',
        leaderEmail: 'alice.brown@college.edu',
        projectTitle: 'Smart City IoT Platform',
        projectDescription:
          'IoT-based smart city management system with real-time monitoring',
        guideEmail: 'prof.williams@college.edu'
      },
      {
        studentName: 'Charlie Davis',
        studentEmail: 'charlie.davis@college.edu',
        groupName: 'Team Beta',
        leaderEmail: 'alice.brown@college.edu',
        projectTitle: 'Smart City IoT Platform',
        projectDescription:
          'IoT-based smart city management system with real-time monitoring',
        guideEmail: 'prof.williams@college.edu'
      }
    ];

    const wsData = workbook.addWorksheet('ProjectData');
    wsData.columns = [
      { header: 'studentName', key: 'studentName', width: 20 },
      { header: 'studentEmail', key: 'studentEmail', width: 25 },
      { header: 'groupName', key: 'groupName', width: 15 },
      { header: 'leaderEmail', key: 'leaderEmail', width: 25 },
      { header: 'projectTitle', key: 'projectTitle', width: 30 },
      { header: 'projectDescription', key: 'projectDescription', width: 50 },
      { header: 'guideEmail', key: 'guideEmail', width: 25 }
    ];
    projectRows.forEach((row) => wsData.addRow(row));

    const instructions = [
      { Field: 'studentName', Required: 'Yes', Description: 'Full name of the student' },
      { Field: 'studentEmail', Required: 'Yes', Description: 'Email address of the student (must be unique)' },
      { Field: 'groupName', Required: 'Yes', Description: 'Name of the project group' },
      { Field: 'leaderEmail', Required: 'Yes', Description: 'Email of the group leader (must be a student in the group)' },
      { Field: 'projectTitle', Required: 'Yes', Description: 'Title of the project' },
      { Field: 'projectDescription', Required: 'No', Description: 'Detailed description of the project' },
      { Field: 'guideEmail', Required: 'No', Description: 'Email of the assigned guide/mentor' },
      { Field: '', Required: '', Description: '' },
      { Field: 'IMPORTANT NOTES:', Required: '', Description: '' },
      { Field: '1. Default Password', Required: '', Description: 'All users will be created with password: default@123' },
      { Field: '2. Multiple Students', Required: '', Description: 'Add one row per student in the same group' },
      { Field: '3. Same Project Info', Required: '', Description: 'All students in a group should have the same projectTitle and projectDescription' },
      { Field: '4. Leader Must Be Student', Required: '', Description: 'The leaderEmail must match one of the studentEmail entries' },
      { Field: '5. Guide Auto-Created', Required: '', Description: 'Guides will be automatically created if they don\'t exist' },
      { Field: '6. Students Can Update', Required: '', Description: 'After import, students can login and update project details' }
    ];

    const wsInstr = workbook.addWorksheet('Instructions');
    wsInstr.columns = [
      { header: 'Field', key: 'Field', width: 25 },
      { header: 'Required', key: 'Required', width: 15 },
      { header: 'Description', key: 'Description', width: 70 }
    ];
    instructions.forEach((row) => wsInstr.addRow(row));

    const buffer = await workbook.xlsx.writeBuffer();

    res.setHeader('Content-Disposition', 'attachment; filename=project-import-template.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(Buffer.from(buffer));
  } catch (error) {
    console.error('Download template error:', error);
    res.status(500).json({ error: 'Failed to generate template' });
  }
};

module.exports = {
  importExcel,
  downloadTemplate
};
