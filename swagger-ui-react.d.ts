declare module 'swagger-ui-react' {
  import React from 'react'

  interface SwaggerUIProps {
    url?: string
    spec?: Record<string, any>
    onComplete?: () => void
    onFailure?: () => void
    presets?: Array<any>
    plugins?: Array<any>
    layout?: string
    persistAuthorization?: boolean
    docExpansion?: 'list' | 'full' | 'none'
    defaultModelsExpandDepth?: number
    defaultModelExpandDepth?: number
    showOperationFilterTag?: boolean
    showCommonExtensions?: boolean
    filter?: boolean | string
    showExtensions?: boolean
  }

  const SwaggerUI: React.FC<SwaggerUIProps>
  export default SwaggerUI
}
