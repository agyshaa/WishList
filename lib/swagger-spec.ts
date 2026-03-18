export const swaggerSpec = {
    openapi: "3.0.0",
    info: {
        title: "WishList API",
        description: "API документація для WishList додатку",
        version: "1.0.0",
        contact: {
            name: "WishList Support",
        },
    },
    servers: [
        {
            url: "http://localhost:3000",
            description: "Development server",
        },
        {
            url: "https://wishlist.app",
            description: "Production server",
        },
    ],
    paths: {
        "/api/auth/signup": {
            post: {
                tags: ["Authentication"],
                summary: "Реєстрація нового користувача",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    name: { type: "string", example: "John Doe" },
                                    email: { type: "string", example: "john@example.com" },
                                    password: { type: "string", example: "securePassword123" },
                                },
                                required: ["name", "email", "password"],
                            },
                        },
                    },
                },
                responses: {
                    201: {
                        description: "Користувач успішно зареєстрований",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        user: {
                                            type: "object",
                                            properties: {
                                                id: { type: "string" },
                                                name: { type: "string" },
                                                email: { type: "string" },
                                                avatar: { type: "string", nullable: true },
                                            },
                                        },
                                        token: { type: "string" },
                                    },
                                },
                            },
                        },
                    },
                    400: { description: "Bad request" },
                },
            },
        },
        "/api/auth/login": {
            post: {
                tags: ["Authentication"],
                summary: "Вхід користувача",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    email: { type: "string", example: "john@example.com" },
                                    password: { type: "string", example: "securePassword123" },
                                },
                                required: ["email", "password"],
                            },
                        },
                    },
                },
                responses: {
                    200: { description: "Успішний вхід" },
                    401: { description: "Неправильні облікові дані" },
                },
            },
        },
        "/api/auth/me": {
            get: {
                tags: ["Authentication"],
                summary: "Отримати поточного користувача",
                security: [{ cookieAuth: [] }],
                responses: {
                    200: { description: "Поточний користувач" },
                    401: { description: "Unauthorized" },
                },
            },
        },
        "/api/auth/logout": {
            post: {
                tags: ["Authentication"],
                summary: "Вихід користувача",
                security: [{ cookieAuth: [] }],
                responses: {
                    200: { description: "Успішний вихід" },
                    401: { description: "Unauthorized" },
                },
            },
        },
        "/api/wishlists": {
            get: {
                tags: ["Wishlists"],
                summary: "Отримати всі вишлісти користувача",
                security: [{ cookieAuth: [] }],
                responses: {
                    200: { description: "Список вишлістів" },
                    401: { description: "Unauthorized" },
                },
            },
            post: {
                tags: ["Wishlists"],
                summary: "Створити новий вишліст",
                security: [{ cookieAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    name: { type: "string", example: "Birthday Wishlist" },
                                    description: { type: "string", example: "Things I'd love for my birthday" },
                                    emoji: { type: "string", example: "🎂" },
                                    isPrivate: { type: "boolean", example: false },
                                },
                                required: ["name", "isPrivate"],
                            },
                        },
                    },
                },
                responses: {
                    201: { description: "Вишліст успішно створений" },
                    401: { description: "Unauthorized" },
                },
            },
        },
        "/api/wishlists/{id}": {
            put: {
                tags: ["Wishlists"],
                summary: "Оновити вишліст",
                security: [{ cookieAuth: [] }],
                parameters: [
                    {
                        name: "id",
                        in: "path",
                        required: true,
                        schema: { type: "string" },
                    },
                ],
                requestBody: {
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    name: { type: "string" },
                                    description: { type: "string" },
                                    isPrivate: { type: "boolean" },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: { description: "Вишліст успішно оновлений" },
                    401: { description: "Unauthorized" },
                },
            },
            delete: {
                tags: ["Wishlists"],
                summary: "Видалити вишліст",
                security: [{ cookieAuth: [] }],
                parameters: [
                    {
                        name: "id",
                        in: "path",
                        required: true,
                        schema: { type: "string" },
                    },
                ],
                responses: {
                    200: { description: "Вишліст успішно видалений" },
                    401: { description: "Unauthorized" },
                },
            },
        },
        "/api/items/public": {
            get: {
                tags: ["Items"],
                summary: "Отримати всі товари з публічних вишлістів",
                responses: {
                    200: { description: "Список публічних товарів" },
                },
            },
        },
        "/api/user": {
            put: {
                tags: ["User"],
                summary: "Оновити профіль користувача",
                security: [{ cookieAuth: [] }],
                requestBody: {
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    name: { type: "string" },
                                    username: { type: "string" },
                                    bio: { type: "string" },
                                    avatar: { type: "string", description: "Base64 encoded image" },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: { description: "Профіль успішно оновлений" },
                    401: { description: "Unauthorized" },
                },
            },
        },
        "/api/parse": {
            post: {
                tags: ["Items"],
                summary: "Парсити інформацію про товар з URL",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    url: { type: "string", example: "https://example.com/product" },
                                },
                                required: ["url"],
                            },
                        },
                    },
                },
                responses: {
                    200: { description: "Інформація про товар успішно парсена" },
                    400: { description: "Invalid URL" },
                },
            },
        },
    },
    components: {
        securitySchemes: {
            cookieAuth: {
                type: "apiKey",
                in: "cookie",
                name: "token",
                description: "JWT токен в cookie",
            },
        },
    },
}
