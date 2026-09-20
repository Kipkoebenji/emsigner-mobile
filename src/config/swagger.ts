import swaggerJSDoc from "swagger-jsdoc";
import { env } from "./env.js";

const swaggerOptions: swaggerJSDoc.Options = {
  definition: {
    openapi: "3.0.3",

    info: {
      title: "eMSigner API",
      version: "1.0.0",
      description: "API documentation for the eMSigner backend.",
    },

    servers: [
      {
        url: `http://localhost:${env.PORT}`,
        description: "Local development server",
      },
    ],

    tags: [
      {
        name: "Authentication",
        description: "User registration, login, and profile endpoints.",
      },
    ],

    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },

      schemas: {
        ErrorResponse: {
          type: "object",
          required: ["message"],
          properties: {
            message: {
              type: "string",
              example:
                "A valid email and a password of 8-128 characters are required",
            },
          },
        },

        User: {
          type: "object",
          required: ["id", "fullName", "email", "role"],
          properties: {
            id: {
              type: "string",
              format: "uuid",
              example: "2b4d5050-4d89-4eb6-b0d8-e63f4077e3f0",
            },
            fullName: {
              type: "string",
              example: "Jane Doe",
            },
            email: {
              type: "string",
              format: "email",
              example: "jane.doe@example.com",
            },
            role: {
              type: "string",
              enum: ["CHAIRPERSON", "SECRETARY", "MEMBER"],
              example: "MEMBER",
            },
          },
        },

        RegisterRequest: {
          type: "object",
          required: ["fullName", "email", "password"],
          properties: {
            fullName: {
              type: "string",
              minLength: 2,
              example: "Jane Doe",
            },
            email: {
              type: "string",
              format: "email",
              example: "jane.doe@example.com",
            },
            password: {
              type: "string",
              minLength: 8,
              maxLength: 128,
              format: "password",
              example: "password123",
            },
          },
        },

        LoginRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: {
              type: "string",
              format: "email",
              example: "jane.doe@example.com",
            },
            password: {
              type: "string",
              minLength: 8,
              maxLength: 128,
              format: "password",
              example: "password123",
            },
          },
        },

        CreateUserRequest: {
          type: "object",
          required: ["fullName", "email", "password", "role"],
          properties: {
            fullName: {
              type: "string",
              minLength: 2,
              example: "John Smith",
            },
            email: {
              type: "string",
              format: "email",
              example: "john.smith@example.com",
            },
            password: {
              type: "string",
              minLength: 8,
              maxLength: 128,
              format: "password",
              example: "password123",
            },
            role: {
              type: "string",
              enum: ["CHAIRPERSON", "SECRETARY", "MEMBER"],
              example: "SECRETARY",
            },
          },
        },

        AuthResponse: {
          type: "object",
          required: ["user", "accessToken"],
          properties: {
            user: {
              $ref: "#/components/schemas/User",
            },
            accessToken: {
              type: "string",
              example:
                "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyYjRkNTA1MC00ZDg5LTRlYjYtYjBkOC1lNjNmNDA3N2UzZjAiLCJlbWFpbCI6ImphbmUuZG9lQGV4YW1wbGUuY29tIiwidG9rZW4iOiJzdWJqZWN0In0.signature",
            },
          },
        },

        CurrentUserResponse: {
          type: "object",
          required: ["user"],
          properties: {
            user: {
              $ref: "#/components/schemas/User",
            },
          },
        },
      },
    },
  },

  apis: ["./src/**/*.ts"],
};

export const swaggerSpec = swaggerJSDoc(swaggerOptions);
