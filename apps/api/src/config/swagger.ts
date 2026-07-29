import swaggerJsdoc from 'swagger-jsdoc';

export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.3',
    info: { title: 'Three-Way Match Engine API', version: '1.0.0' },
    servers: [{ url: 'http://localhost:5000/api' }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'Static token' },
      },
      schemas: {
        SuccessResponse: {
          type: 'object',
          required: ['success', 'data'],
          properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'object' },
            meta: { nullable: true },
          },
        },
        ErrorResponse: {
          type: 'object',
          required: ['success', 'error'],
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              required: ['code', 'message', 'details'],
              properties: {
                code: { type: 'string' },
                message: { type: 'string' },
                details: { nullable: true },
              },
            },
          },
        },
        SkuMaster: {
          type: 'object',
          required: ['id', 'skuErpCode', 'name', 'priceTolerance', 'createdAt', 'updatedAt'],
          properties: {
            id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            skuErpCode: { type: 'string', example: '11423' },
            name: {
              type: 'string',
              example: 'PSM Cheesy Spicy Vegetable Momos 24Pcs',
            },
            eanCode: { type: 'string', example: 'FG-P-F-0503' },
            hsnCode: { type: 'string', example: '19022010' },
            uom: { type: 'string', example: 'PKT' },
            agreedRate: { type: 'number', example: 220.76 },
            mrp: { type: 'number', example: 305 },
            priceTolerance: { type: 'number', minimum: 0, maximum: 1, example: 0.05 },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        SkuMasterInput: {
          type: 'object',
          required: ['skuErpCode', 'name'],
          additionalProperties: false,
          properties: {
            skuErpCode: { type: 'string', minLength: 1 },
            name: { type: 'string', minLength: 1 },
            eanCode: { type: 'string' },
            hsnCode: { type: 'string' },
            uom: { type: 'string' },
            agreedRate: { type: 'number', minimum: 0 },
            mrp: { type: 'number', minimum: 0 },
            priceTolerance: { type: 'number', minimum: 0, maximum: 1, default: 0.05 },
          },
        },
        SkuMasterUpdateInput: {
          type: 'object',
          minProperties: 1,
          additionalProperties: false,
          properties: {
            skuErpCode: { type: 'string', minLength: 1 },
            name: { type: 'string', minLength: 1 },
            eanCode: { type: 'string' },
            hsnCode: { type: 'string' },
            uom: { type: 'string' },
            agreedRate: { type: 'number', minimum: 0 },
            mrp: { type: 'number', minimum: 0 },
            priceTolerance: { type: 'number', minimum: 0, maximum: 1 },
          },
        },
        PaginationMeta: {
          type: 'object',
          required: ['page', 'limit', 'total', 'totalPages'],
          properties: {
            page: { type: 'integer', minimum: 1 },
            limit: { type: 'integer', minimum: 1, maximum: 100 },
            total: { type: 'integer', minimum: 0 },
            totalPages: { type: 'integer', minimum: 0 },
          },
        },
      },
      responses: {
        ValidationError: {
          description: 'Request validation failed',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
        Unauthorized: {
          description: 'Bearer token is missing or invalid',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
        NotFound: {
          description: 'SKU Master record was not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
        Conflict: {
          description: 'ERP or EAN code already exists',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
        ServerError: {
          description: 'Unexpected server error',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
      },
    },
    paths: {
      '/health': {
        get: {
          summary: 'Check API health',
          responses: {
            '200': {
              description: 'API is running',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/SuccessResponse' },
                },
              },
            },
          },
        },
      },
      '/auth/login': {
        post: {
          summary: 'Log in with scaffold credentials',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string', minLength: 1 },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Authentication succeeded',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/SuccessResponse' },
                },
              },
            },
            '400': {
              description: 'Invalid request',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
          },
        },
      },
      '/masters/sku': {
        post: {
          summary: 'Create a SKU Master record',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SkuMasterInput' },
              },
            },
          },
          responses: {
            '201': {
              description: 'SKU created',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/SuccessResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: { $ref: '#/components/schemas/SkuMaster' },
                        },
                      },
                    ],
                  },
                },
              },
            },
            '400': { $ref: '#/components/responses/ValidationError' },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '409': { $ref: '#/components/responses/Conflict' },
            '500': { $ref: '#/components/responses/ServerError' },
          },
        },
        get: {
          summary: 'List SKU Master records',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1, minimum: 1 } },
            {
              name: 'limit',
              in: 'query',
              schema: { type: 'integer', default: 20, minimum: 1, maximum: 100 },
            },
            { name: 'search', in: 'query', schema: { type: 'string' } },
            {
              name: 'sortBy',
              in: 'query',
              schema: {
                type: 'string',
                enum: ['createdAt', 'updatedAt', 'skuErpCode', 'name'],
                default: 'createdAt',
              },
            },
            {
              name: 'sortOrder',
              in: 'query',
              schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
            },
          ],
          responses: {
            '200': {
              description: 'Paginated SKU records',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    required: ['success', 'data', 'meta'],
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/SkuMaster' },
                      },
                      meta: { $ref: '#/components/schemas/PaginationMeta' },
                    },
                  },
                },
              },
            },
            '400': { $ref: '#/components/responses/ValidationError' },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '500': { $ref: '#/components/responses/ServerError' },
          },
        },
      },
      '/masters/sku/{id}': {
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', pattern: '^[a-fA-F0-9]{24}$' },
          },
        ],
        get: {
          summary: 'Get a SKU Master record',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'SKU record',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/SuccessResponse' },
                },
              },
            },
            '400': { $ref: '#/components/responses/ValidationError' },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '404': { $ref: '#/components/responses/NotFound' },
            '500': { $ref: '#/components/responses/ServerError' },
          },
        },
        patch: {
          summary: 'Update a SKU Master record',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SkuMasterUpdateInput' },
              },
            },
          },
          responses: {
            '200': {
              description: 'Updated SKU record',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/SuccessResponse' },
                },
              },
            },
            '400': { $ref: '#/components/responses/ValidationError' },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '404': { $ref: '#/components/responses/NotFound' },
            '409': { $ref: '#/components/responses/Conflict' },
            '500': { $ref: '#/components/responses/ServerError' },
          },
        },
        delete: {
          summary: 'Delete a SKU Master record',
          security: [{ bearerAuth: [] }],
          responses: {
            '204': { description: 'SKU deleted' },
            '400': { $ref: '#/components/responses/ValidationError' },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '404': { $ref: '#/components/responses/NotFound' },
            '500': { $ref: '#/components/responses/ServerError' },
          },
        },
      },
    },
  },
  apis: [],
});
