import { NextRequest, NextResponse } from 'next/server';
import ModuleManagerInstance from '@/lib/modules/ModuleManager';

export async function POST(request: NextRequest) {
  try {
    const { moduleId } = await request.json();

    if (!moduleId) {
      return NextResponse.json(
        { error: 'Module ID is required' },
        { status: 400 }
      );
    }

    const moduleManager = ModuleManagerInstance();

    // Check if module is already installed
    const isInstalled = await moduleManager.isModuleInstalled(moduleId);
    if (isInstalled) {
      return NextResponse.json(
        { error: 'Module is already installed' },
        { status: 400 }
      );
    }

    // Check if module exists
    const module = await moduleManager.getModule(moduleId);
    if (!module) {
      return NextResponse.json(
        { error: 'Module not found' },
        { status: 404 }
      );
    }

    // Start download (in a real implementation, this would be handled differently)
    // For now, we'll simulate the download
    try {
      await moduleManager.downloadModule(moduleId);

      return NextResponse.json({
        success: true,
        message: `Module ${moduleId} downloaded successfully`,
        moduleId
      });
    } catch (downloadError) {
      return NextResponse.json(
        { error: `Download failed: ${downloadError}` },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error downloading module:', error);
    return NextResponse.json(
      { error: 'Failed to download module' },
      { status: 500 }
    );
  }
}