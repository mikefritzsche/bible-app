import { NextRequest, NextResponse } from 'next/server';
import ModuleManagerInstance from '@/lib/modules/ModuleManager';

// Simple route that returns all progress or handles moduleId in URL path
export async function GET(request: NextRequest) {
  try {
    const moduleManager = ModuleManagerInstance;
    // Just return all progress for now - client can filter
    const progress = moduleManager.getDownloadProgress();
    return NextResponse.json({ progress });

  } catch (error) {
    console.error('Error fetching download progress:', error);
    return NextResponse.json(
      { error: 'Failed to fetch download progress' },
      { status: 500 }
    );
  }
}