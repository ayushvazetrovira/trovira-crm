import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

// GET /api/crm/team?companyId=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json({ error: 'companyId is required' }, { status: 400 });
    }

    const users = await db.user.findMany({
      where: {
        companyId,
        role: { notIn: ['admin', 'client', 'inactive_client'] },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const totalMembers = users.length || 1;
    const totalLeads = await db.lead.count({ where: { companyId } });

    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const tasksAssigned = await db.crmTask.count({
          where: { companyId, assignedTo: user.name },
        });

        const leadsManaged = Math.round(totalLeads / totalMembers);

        return {
          ...user,
          phone: '-',
          status: 'active' as string,
          tasksAssigned,
          leadsManaged,
        };
      })
    );

    return NextResponse.json({ members: usersWithStats });
  } catch (error) {
    console.error('Error fetching team members:', error);
    return NextResponse.json({ error: 'Failed to fetch team members' }, { status: 500 });
  }
}

// POST /api/crm/team — Create user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyId, bulk, email, name, password, role } = body;

    if (!companyId) {
      return NextResponse.json({ error: 'companyId is required' }, { status: 400 });
    }

    // ── Bulk create from Excel ────────────────────────────────────────
    if (bulk) {
      if (!Array.isArray(bulk.members)) {
        return NextResponse.json({ error: 'bulk.members array required' }, { status: 400 });
      }

      const created: { email: string; name: string }[] = [];
      const errors: { row: number; error: string; email?: string }[] = [];

      for (let i = 0; i < bulk.members.length; i++) {
        const row = bulk.members[i];

        const rowName = row.name?.trim() ?? '';
        const finalName =
          !rowName || rowName.toLowerCase() === 'mt'
            ? `Team Member ${i + 1}`
            : rowName;

        // FIX: accept both lowercase `email` (new) and `Email` (legacy) 
        const rowEmail = (row.email ?? row.Email ?? '').toString().trim();
        const rowPassword = (row.password ?? '').toString().trim();

        if (!rowEmail || !rowPassword) {
          errors.push({ row: i + 1, error: 'Email and password required' });
          continue;
        }

        // Check duplicate email
        const existing = await db.user.findUnique({ where: { email: rowEmail } });
        if (existing) {
          errors.push({ row: i + 1, email: rowEmail, error: 'Email already exists' });
          continue;
        }

        try {
          await db.user.create({
            data: {
              companyId,
              email: rowEmail,
              name: finalName,
              password: rowPassword,
              role: 'team_agent',
            },
          });
          created.push({ email: rowEmail, name: finalName });
        } catch (err) {
          console.error(`Row ${i + 1} create error:`, err);
          errors.push({ row: i + 1, email: rowEmail, error: 'Failed to create' });
        }
      }

      return NextResponse.json(
        {
          success: true,
          createdCount: created.length,
          created,
          errors,
        },
        { status: 201 }
      );
    }

    // ── Single create ─────────────────────────────────────────────────
    if (!email || !name || !password) {
      return NextResponse.json(
        { error: 'companyId, email, name, and password are required' },
        { status: 400 }
      );
    }

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 409 }
      );
    }

    const roleMap: Record<string, string> = {
      team_admin: 'team_admin',
      team_manager: 'team_manager',
      team_agent: 'team_agent',
      team_viewer: 'team_viewer',
    };
    const assignedRole = roleMap[role] ?? 'team_agent';

    const newUser = await db.user.create({
      data: {
        companyId,
        email,
        name,
        password,
        role: assignedRole,
      },
    });

    return NextResponse.json(
      { user: newUser, message: 'Team member created successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating team member:', error);
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create team member' }, { status: 500 });
  }
}

// PUT /api/crm/team — Update user
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, role } = body;

    if (!id) {
      return NextResponse.json({ error: 'User id is required' }, { status: 400 });
    }

    const existing = await db.user.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const updateData: Prisma.UserUpdateInput = {};
    if (role !== undefined) {
      updateData.role = role;
    } else if (status !== undefined) {
      updateData.role = status === 'inactive' ? 'inactive_client' : 'team_agent';
    }

    const user = await db.user.update({ where: { id }, data: updateData });

    return NextResponse.json({ user, message: 'Team member updated successfully' });
  } catch (error) {
    console.error('Error updating team member:', error);
    return NextResponse.json({ error: 'Failed to update team member' }, { status: 500 });
  }
}

// DELETE /api/crm/team?id=xxx
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'User id is required' }, { status: 400 });
    }

    const existing = await db.user.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await db.user.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Team member removed successfully' });
  } catch (error) {
    console.error('Error deleting team member:', error);
    return NextResponse.json({ error: 'Failed to delete team member' }, { status: 500 });
  }
}