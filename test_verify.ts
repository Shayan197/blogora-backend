import { Request, Response } from 'express';

import './src/models/models.js';
import './src/models/associations.js';
import sequelize from './src/config/db.config.js';
import { getBlogBySlug } from './src/controllers/blog.controller.js';
import { getBlogComments } from './src/controllers/comment.controller.js';
import { getBlogLikers } from './src/controllers/like.controller.js';

interface MockResponse {
    statusCode: number;
    payload: any;
    status(code: number): this;
    json(body: any): this;
    send(body: any): this;
}

const createMockRes = (): Response & MockResponse => {
    const res: MockResponse = {
        statusCode: 200,
        payload: null,
        status(code: number) {
            this.statusCode = code;
            return this;
        },
        json(body: any) {
            this.payload = body;
            return this;
        },
        send(body: any) {
            this.payload = body;
            return this;
        },
    };
    return res as unknown as Response & MockResponse;
};

const createMockReq = (params: Record<string, string>, user?: any): Request =>
    ({
        params,
        user,
        query: {},
        body: {},
    }) as unknown as Request;

const runVerification = async () => {
    console.log('--- STARTING COMPREHENSIVE VERIFICATION ---\n');

    const testSlugs = [
        'building-a-scalable-blog-backend-with-nodejs-postgresql-sequelize',
        'the-evolution-of-ai-agents-in-modern-software-engineering',
        'building-resilient-rest-apis-with-nodejs-express-sequelize',
    ];

    let passedTests = 0;
    let totalTests = 0;

    const assertTest = (description: string, condition: boolean, details?: any) => {
        totalTests++;
        if (condition) {
            passedTests++;
            console.log(`[PASS] ${description}`);
        } else {
            console.error(`[FAIL] ${description}`, details || '');
        }
    };

    let firstBlogUuid = '';
    // 1. Test the 3 failing slugs
    for (const slug of testSlugs) {
        const req = createMockReq({ slugOrUuid: slug });
        const res = createMockRes();

        await getBlogBySlug(req, res);

        if (!firstBlogUuid && res.payload?.data?.blog?.uuid) {
            firstBlogUuid = res.payload.data.blog.uuid;
        }

        assertTest(`Slug '${slug}' returns status 200`, res.statusCode === 200, {
            status: res.statusCode,
            payload: res.payload,
        });
        assertTest(
            `Slug '${slug}' returns success=true and contains blog data`,
            res.payload?.success === true && res.payload?.data?.blog?.slug === slug,
            res.payload,
        );
        assertTest(
            `Slug '${slug}' contains author, category, and tags`,
            !!(
                res.payload?.data?.blog?.author &&
                res.payload?.data?.blog?.category &&
                Array.isArray(res.payload?.data?.blog?.tags)
            ),
            {
                author: !!res.payload?.data?.blog?.author,
                category: !!res.payload?.data?.blog?.category,
                tags: Array.isArray(res.payload?.data?.blog?.tags),
            },
        );
    }

    // 2. Test valid UUID fetch
    const validUuid = firstBlogUuid;
    const uuidReq = createMockReq({ slugOrUuid: validUuid });
    const uuidRes = createMockRes();
    await getBlogBySlug(uuidReq, uuidRes);

    assertTest(`Valid UUID '${validUuid}' returns status 200`, uuidRes.statusCode === 200, {
        status: uuidRes.statusCode,
        payload: uuidRes.payload,
    });
    assertTest(
        `Valid UUID returns the expected blog`,
        uuidRes.payload?.data?.blog?.uuid === validUuid,
        uuidRes.payload,
    );

    // 3. Test non-existent slug -> MUST return 404, never 500!
    const fakeSlug = 'non-existent-blog-slug-which-should-be-404';
    const fakeReq = createMockReq({ slugOrUuid: fakeSlug });
    const fakeRes = createMockRes();
    await getBlogBySlug(fakeReq, fakeRes);

    assertTest(
        `Non-existent slug returns 404 (NOT 500)`,
        fakeRes.statusCode === 404 && fakeRes.payload?.success === false,
        { status: fakeRes.statusCode, payload: fakeRes.payload },
    );

    // 4. Test invalid UUID / string containing special characters -> MUST return 404, never 500!
    const invalidUuid = 'definitely-not-a-valid-uuid-12345';
    const invalidUuidReq = createMockReq({ slugOrUuid: invalidUuid });
    const invalidUuidRes = createMockRes();
    await getBlogBySlug(invalidUuidReq, invalidUuidRes);

    assertTest(
        `Invalid UUID string returns 404 (NOT 500)`,
        invalidUuidRes.statusCode === 404 && invalidUuidRes.payload?.success === false,
        { status: invalidUuidRes.statusCode, payload: invalidUuidRes.payload },
    );

    // 5. Test comments endpoint with valid blogUuid
    const commentsReq = createMockReq({ blogUuid: validUuid });
    const commentsRes = createMockRes();
    await getBlogComments(commentsReq, commentsRes);
    assertTest(
        `getBlogComments with valid blogUuid returns 200`,
        commentsRes.statusCode === 200 && commentsRes.payload?.success === true,
        { status: commentsRes.statusCode, payload: commentsRes.payload },
    );

    // 6. Test comments endpoint with invalid non-UUID -> MUST return 404, never 500!
    const badCommentsReq = createMockReq({ blogUuid: 'invalid-non-uuid-string' });
    const badCommentsRes = createMockRes();
    await getBlogComments(badCommentsReq, badCommentsRes);
    assertTest(
        `getBlogComments with invalid blogUuid returns 404 (NOT 500)`,
        badCommentsRes.statusCode === 404 && badCommentsRes.payload?.success === false,
        { status: badCommentsRes.statusCode, payload: badCommentsRes.payload },
    );

    // 7. Test likers endpoint with valid blogUuid
    const likersReq = createMockReq({ blogUuid: validUuid });
    const likersRes = createMockRes();
    await getBlogLikers(likersReq, likersRes);
    assertTest(
        `getBlogLikers with valid blogUuid returns 200`,
        likersRes.statusCode === 200 && likersRes.payload?.success === true,
        { status: likersRes.statusCode, payload: likersRes.payload },
    );

    // 8. Test likers endpoint with invalid blogUuid -> MUST return 404, never 500!
    const badLikersReq = createMockReq({ blogUuid: 'invalid-non-uuid-string' });
    const badLikersRes = createMockRes();
    await getBlogLikers(badLikersReq, badLikersRes);
    assertTest(
        `getBlogLikers with invalid blogUuid returns 404 (NOT 500)`,
        badLikersRes.statusCode === 404 && badLikersRes.payload?.success === false,
        { status: badLikersRes.statusCode, payload: badLikersRes.payload },
    );

    console.log(`\n--- VERIFICATION SUMMARY: ${passedTests}/${totalTests} TESTS PASSED ---`);

    await sequelize.close();
    process.exit(passedTests === totalTests ? 0 : 1);
};

runVerification().catch((err) => {
    console.error('Fatal error during verification:', err);
    process.exit(1);
});
