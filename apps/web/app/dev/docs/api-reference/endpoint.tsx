'use client';

import type { FC, ReactNode } from 'react';
import styles from './endpoint.module.css';
import { Code } from '@/components/Layout/Code';
import { useApiReference } from './api-reference';
import { AuthenticationMethod } from '@/lib/oauth/types';
import { isDefined, isTruthy } from '@gw2treasures/helper/is';
import { ExternalLink } from '@gw2treasures/ui/components/Link/ExternalLink';
import { Highlight } from '@/components/Layout/Highlight';
import { ClientType } from '@gw2me/database';

export interface ApiEndpointParameters {
  name: string,
  optional?: boolean,
  type: 'String' | (string & {}),
  description: ReactNode,
}

export interface ApiEndpointResponse {
  id: string,
  type?: ClientType,
  status: number,
  title: ReactNode,
  content: ReactNode,
}

export interface ApiEndpointProps {
  children?: ReactNode,
  method: 'GET' | 'POST',
  endpoint: string,
  auth?: 'oauth2' | 'bearer'
  body?: ApiEndpointParameters[],
  query?: ApiEndpointParameters[],
  path?: ApiEndpointParameters[],
  responses?: ApiEndpointResponse[],
}

const clientIdParameter: ApiEndpointParameters = { name: 'client_id', type: 'String', description: 'The client_id of your application.' };
const clientIdOptionalParameter: ApiEndpointParameters = { ...clientIdParameter, optional: true };
const clientSecretParameter: ApiEndpointParameters = { name: 'client_secret', type: 'String', description: 'The client_secret of your application.' };
const formContentTypeHeader: ApiEndpointParameters = { name: 'Content-type', type: '"application/x-www-form-urlencoded"', description: <>The body of the request has to be transmitted using <Code inline>application/x-www-form-urlencoded</Code> encoding.</> };
const basicAuthHeader: ApiEndpointParameters = { name: 'Authorization', type: '"Basic <credentials>"', description: <>Basic authentication header, using <Code inline>client_id</Code> as username and <Code inline>client_secret</Code> as password (see <ExternalLink href="https://datatracker.ietf.org/doc/html/rfc7617">RFC 7617</ExternalLink>).</> };

export const ApiEndpoint: FC<ApiEndpointProps> = ({ children, method, auth, body = [], responses, endpoint, query, path }) => {
  const reference = useApiReference();

  const bodyParametersIncludingAuth: ApiEndpointParameters[] = [
    ...(auth === 'oauth2'
      ? (reference.type === 'Public' ? [clientIdParameter] :
        reference.authorization === AuthenticationMethod.client_secret_post ? [clientIdParameter, clientSecretParameter] :
        reference.authorization === AuthenticationMethod.client_secret_basic ? [clientIdOptionalParameter] : []
      ) : []),
    ...body ?? [],
  ];

  const headers: ApiEndpointParameters[] = auth === 'oauth2'
    ? [formContentTypeHeader, reference.type === 'Confidential' && reference.authorization === AuthenticationMethod.client_secret_basic && basicAuthHeader].filter(isTruthy)
    : [];

  return (
    <div className={styles.endpoint}>
      <div className={styles.description}>
        {children}
        <Parameters parameters={headers}>Headers</Parameters>
        <Parameters parameters={bodyParametersIncludingAuth}>Body</Parameters>
      </div>
      <div className={styles.examples}>
        <div className={styles.codeBlock}>
          <div className={styles.codeBlockHeader}><Code inline borderless>{method} {endpoint}</Code></div>
          <div className={styles.code}>
            <Code borderless>TODO</Code>
          </div>
        </div>
        {responses?.filter(({ type }) => type === undefined || type === reference.type).map((response) => (
          <div key={response.id} className={styles.codeBlock}>
            <div className={styles.codeBlockHeader}><Code inline>{response.status}</Code> {response.title}</div>
            <div className={styles.code}>
              <Code borderless>{response.content}</Code>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};


interface ParametersProps {
  parameters: ApiEndpointParameters[],
  children: ReactNode;
}

const Parameters: FC<ParametersProps> = ({ parameters, children }) => {
  return parameters.length > 0 && (
    <div className={styles.parameters}>
      <div className={styles.parametersHeader}>{children}</div>
      {parameters.map((parameter) => (
        <div className={styles.parameter} key={parameter.name}>
          <div className={styles.parameterHeader}>
            <div className={styles.parameterName}><Code inline borderless>{parameter.name}</Code></div>
            {parameter.optional && (<div className={styles.parameterOptional}>(optional)</div>)}
            <div className={styles.parameterType}><Code inline borderless>{parameter.type}</Code></div>
          </div>
          <p className={styles.parameterDescription}>{parameter.description}</p>
        </div>
      ))}
    </div>
  );
};


export const ApiHeadline: FC<{ children: ReactNode, id: string }> = ({ children, id }) => {
  return (
    <h2 id={id} className={styles.headline}>{children}</h2>
  );
};
