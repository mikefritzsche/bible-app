import { NextRequest, NextResponse } from 'next/server';
import FirstRunSetupInstance from '@/lib/modules/FirstRunSetup';

export async function GET(request: NextRequest) {
  try {
    // Get current setup status
    const status = await FirstRunSetupInstance.getSetupStatus();

    return NextResponse.json({ status });
  } catch (error) {
    console.error('Error getting first-run status:', error);
    return NextResponse.json(
      { error: 'Failed to get first-run status' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();

    if (action === 'initialize') {
      // Run first-run setup
      await FirstRunSetupInstance.initialize();

      const status = await FirstRunSetupInstance.getSetupStatus();
      return NextResponse.json({
        success: true,
        message: 'First-run setup completed',
        status
      });
    } else if (action === 'reinitialize') {
      // Force re-run first-run setup
      await FirstRunSetupInstance.forceReinitialize();

      const status = await FirstRunSetupInstance.getSetupStatus();
      return NextResponse.json({
        success: true,
        message: 'First-run setup reinitialized',
        status
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Error in first-run setup:', error);
    return NextResponse.json(
      { error: 'Failed to complete first-run setup' },
      { status: 500 }
    );
  }
}