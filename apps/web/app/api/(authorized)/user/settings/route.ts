import { db } from '@/lib/db';
import { Scope } from '@gw2me/client';
import { NextRequest, NextResponse } from 'next/server';
import { getApplicationGrantByAuthorization, OptionsHandler, withAuthorization } from '../../auth';
import { Authorization } from '@gw2me/database';

export const POST = withAuthorization([Scope.Identify])(
  async (authorization: Authorization, request: NextRequest) => {
    // make sure body is json
    if(request.headers.get('content-type') !== 'application/json') {
      return NextResponse.json({ error: true, error_description: 'Expected `Content-Type: application/json`' }, { status: 400 });
    }

    // get settings from request body
    let settings;
    try {
      settings = await request.json();
    } catch {
      return NextResponse.json({ error: true, error_description: 'Invalid JSON' }, { status: 400 });
    }

    // make sure settings is an object
    if(typeof settings !== 'object' || settings === null || Array.isArray(settings)) {
      return NextResponse.json({ error: true, error_description: 'Only JSON objects are supported' }, { status: 400 });
    }

    // make sure settings are below 10kb
    if(JSON.stringify(settings).length > 10240) {
      return NextResponse.json({ error: true, error_description: 'Max size for settings is 10kb' }, { status: 400 });
    }

    // get application grant
    const grant = await getApplicationGrantByAuthorization(authorization);

    if(!grant) {
      return NextResponse.json({ error: true }, { status: 404 });
    }

    // update settings
    await db.applicationUserSettings.upsert({
      where: { applicationGrantId: grant.id },
      create: {
        applicationGrantId: grant.id,
        settings
      },
      update: {
        settings
      }
    });

    // return no content
    return new NextResponse(null, { status: 204 });
  }
);

export const OPTIONS = OptionsHandler;
