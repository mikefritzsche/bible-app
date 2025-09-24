import { NextRequest, NextResponse } from 'next/server';
import ModuleManagerInstance from '@/lib/modules/ModuleManager';

export async function DELETE(request: NextRequest) {
  try {
    const { moduleId } = await request.json();

    if (!moduleId) {
      return NextResponse.json(
        { error: 'Module ID is required' },
        { status: 400 }
      );
    }

    const moduleManager = ModuleManagerInstance;

    // Check if module is installed
    const isInstalled = await moduleManager.isModuleInstalled(moduleId);
    if (!isInstalled) {
      return NextResponse.json(
        { error: 'Module is not installed' },
        { status: 400 }
      );
    }

    // Get module details to check if it's a default module
    const module = await moduleManager.getModule(moduleId);
    if (module?.isDefault) {
      return NextResponse.json(
        { error: 'Cannot delete default module' },
        { status: 400 }
      );
    }

    // Delete the module
    await moduleManager.deleteModule(moduleId);

    return NextResponse.json({
      success: true,
      message: `Module ${moduleId} deleted successfully`,
      moduleId
    });

  } catch (error) {
    console.error('Error deleting module:', error);
    return NextResponse.json(
      { error: 'Failed to delete module' },
      { status: 500 }
    );
  }
}