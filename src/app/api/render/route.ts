import { NextRequest, NextResponse } from 'next/server';

/**
 * Video rendering endpoint.
 *
 * For production use with Vercel, you have two options:
 *
 * 1. Remotion Lambda (recommended for full MP4 export):
 *    - Deploy a Remotion Lambda function to AWS
 *    - This route triggers renderMediaOnLambda()
 *    - Poll for completion, return S3 download URL
 *
 * 2. Client-side recording (simpler, no server infra):
 *    - Use MediaRecorder API on the Remotion Player canvas
 *    - Export as WebM directly in the browser
 *    - See the ExportButton component for this approach
 *
 * This route currently returns instructions for setup.
 * To enable Lambda rendering, install @remotion/lambda and configure AWS credentials.
 */
export async function POST(request: NextRequest) {
  return NextResponse.json({
    status: 'not_configured',
    message:
      'Video rendering requires either Remotion Lambda (AWS) or client-side export. ' +
      'Use the in-browser export button for WebM output, or configure Remotion Lambda for MP4.',
    docs: 'https://www.remotion.dev/docs/lambda',
  });
}
