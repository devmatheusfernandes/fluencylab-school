import { NextRequest, NextResponse } from 'next/server';
import { withAuth, createAdminConfig } from '../../../../lib/auth/middleware';
import { UserService } from '../../../../services/userService';

const userService = new UserService();

/**
 * Endpoint para gerenciamento de usuários (Admin)
 * 
 * Aplicação do novo sistema de autorização:
 * - Validação automática de autenticação
 * - Verificação de role ADMIN ou MANAGER
 * - Acesso total sem restrições de ownership
 * - Rate limiting (100 requests/min)
 * - Logging automático de operações
 */

// GET - Listar todos os usuários
async function getUsersHandler(
  request: NextRequest,
  { params, authContext }: { params?: any; authContext: any }
) {
  try {
    // Parse query parameters for filtering and pagination
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const status = searchParams.get('status');
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');
    const search = searchParams.get('search');

    // O middleware já validou:
    // 1. Autenticação do usuário
    // 2. Role de admin/manager
    // 3. Rate limiting
    
    const users = await userService.getAllUsers({
      role: role || undefined,
      isActive: status === 'active' ? true : status === 'inactive' ? false : undefined
    });

    return NextResponse.json({
      success: true,
      data: users,
      total: users.length
    });
    
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor.' },
      { status: 500 }
    );
  }
}

// POST - Criar novo usuário
async function createUserHandler(
  request: NextRequest,
  { params, authContext }: { params?: any; authContext: any }
) {
  try {
    const userData = await request.json();

    // Validate required fields
    const requiredFields = ['email', 'name', 'role'];
    for (const field of requiredFields) {
      if (!userData[field]) {
        return NextResponse.json(
          { error: `Campo obrigatório: ${field}` },
          { status: 400 }
        );
      }
    }

    // Validate role
    const validRoles = ['student', 'teacher', 'admin', 'manager', 'guarded_student', 'material_manager'];
    if (!validRoles.includes(userData.role)) {
      return NextResponse.json(
        { error: 'Role inválido.' },
        { status: 400 }
      );
    }

    // O middleware já validou:
    // 1. Autenticação do usuário
    // 2. Role de admin/manager
    // 3. Rate limiting
    
    // Extract IP and User Agent for audit logging
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    const newUser = await userService.createUser({
      ...userData,
      createdBy: authContext.userId
    }, {
      ip,
      userAgent
    });
    
    return NextResponse.json({
      success: true,
      message: 'Usuário criado com sucesso.',
      data: newUser
    }, { status: 201 });
    
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor.' },
      { status: 500 }
    );
  }
}

// Aplicar middleware de autorização com configuração específica para administradores
export const GET = withAuth(
  getUsersHandler,
  createAdminConfig('user', 'general')
);

export const POST = withAuth(
  createUserHandler,
  createAdminConfig('user', 'general')
);