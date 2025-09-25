import { NextRequest, NextResponse } from 'next/server';
import ModuleManagerInstance from '@/lib/modules/ModuleManager';

export async function GET(request: NextRequest) {
  try {
    const moduleManager = ModuleManagerInstance();
    const [available, installed] = await Promise.all([
      moduleManager.getAvailableModules(),
      moduleManager.getInstalledModules()
    ]);

    // Transform to include installation status
    const modules = Object.values(available).map(module => ({
      ...module,
      installed: installed.includes(module.id)
    }));

    return NextResponse.json({ modules });
  } catch (error) {
    console.error('Error fetching modules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch modules' },
      { status: 500 }
    );
  }
}