import type { FC, ReactNode } from 'react';
import styles from './endpoint.module.css';
import { Code } from '@/components/Layout/Code';

export interface ApiEndpointParameters {
  name: string,
  optional?: boolean,
  type: 'String' | (string & {}),
  description: ReactNode,
}

export interface ApiEndpointResponse {

}

export interface ApiEndpointProps {
  children?: ReactNode,
  method: 'GET' | 'POST',
  body?: ApiEndpointParameters[],
  query?: ApiEndpointParameters[],
  path?: ApiEndpointParameters[],
  responses?: ApiEndpointResponse[],
}

const response = {
  'access_token': 'xl1eSPfCpUNdQiIPe4TAag',
  'token_type': 'Bearer',
  'expires_in': 604800,
  'refresh_token': 'mcn6FMwoiufzqcBDVwzOnz_NvGn-1ezzRKIm7vN_bsk',
  'scope': 'identify email gw2:account'
};

export const ApiEndpoint: FC<ApiEndpointProps> = ({ children, method, body, query, path }) => {
  return (
    <div className={styles.endpoint}>
      <div className={styles.description}>
        {children}
        {body?.length && (
          <div className={styles.parameters}>
            <div className={styles.parametersHeader}>Body Parameters</div>
            {body.map((parameter) => (
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
        )}
      </div>
      <div className={styles.examples}>
        <div className={styles.codeBlock}>
          <div className={styles.codeBlockHeader}>{method} /api/token</div>
          <div className={styles.code}>
            <Code borderless>{'client.getAccessToken({ code: \'123\' })'}</Code>
          </div>
        </div>
        <div className={styles.codeBlock}>
          <div className={styles.codeBlockHeader}>200</div>
          <div className={styles.code}>
            <Code borderless>{JSON.stringify(response, null, '  ')}</Code>
          </div>
        </div>
      </div>
    </div>
  );
};
