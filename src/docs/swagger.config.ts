interface SwaggerConfig {
  title: string;
  description: string;
  version: string;
  tags: string[];
}

export const SWAGGER_CONFIG: SwaggerConfig = {
  title: 'auth service',
  description: ' api specs',
  version: '1.0',
  tags: [],
};
